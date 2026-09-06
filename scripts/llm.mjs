// Markable — the only file that knows which API we call (Dev 1).
//
// OpenAI chat completions. Set before running:
//   $env:OPENAI_API_KEY = "sk-..."
//   $env:OPENAI_MODEL   = "gpt-4o"        (optional, this is the default)
//   $env:OPENAI_BASE_URL = "https://..."  (optional, for Azure/proxies)
//
// Set OPENAI_MODEL to whatever your key actually has access to. If you pick a
// reasoning model that rejects `temperature` or `max_tokens`, the first call
// detects it from the error and retries without them — you do not have to care.

// Trim, and treat a blank value as absent: a dashboard variable left empty arrives as "",
// which `??` happily passes through.
const env = (n, d) => process.env[n]?.trim() || d;
const BASE = env('OPENAI_BASE_URL', 'https://api.openai.com/v1');
const MODEL = env('OPENAI_MODEL', 'gpt-4o');
const KEY = env('OPENAI_API_KEY', undefined);

if (!KEY) {
  console.error('OPENAI_API_KEY is not set.  PowerShell:  $env:OPENAI_API_KEY = "sk-..."');
  process.exit(1);
}

// Learned once, then reused for every later call in the run.
const supports = { temperature: true, jsonMode: true, maxTokensField: 'max_tokens' };

function body({ system, user, maxTokens, temperature }) {
  const b = {
    model: MODEL,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  };
  b[supports.maxTokensField] = maxTokens;
  if (supports.temperature) b.temperature = temperature;
  if (supports.jsonMode) b.response_format = { type: 'json_object' };
  return b;
}

/** Drop whatever the API just complained about. Returns true if we changed
 *  something and the call is worth retrying. */
function degrade(errText) {
  const e = errText.toLowerCase();
  if (supports.temperature && e.includes('temperature')) {
    supports.temperature = false;
    console.warn(`  (model ${MODEL} rejects temperature — dropping it. Marks stay reproducible only if the model is deterministic.)`);
    return true;
  }
  if (supports.maxTokensField === 'max_tokens' && e.includes('max_completion_tokens')) {
    supports.maxTokensField = 'max_completion_tokens';
    console.warn('  (switching to max_completion_tokens)');
    return true;
  }
  if (supports.jsonMode && e.includes('response_format')) {
    supports.jsonMode = false;
    console.warn('  (model rejects JSON mode — falling back to brace extraction)');
    return true;
  }
  return false;
}

/** Pull the first JSON object out of a response that isn't clean JSON. */
function extractJson(raw) {
  const s = raw.indexOf('{');
  const e = raw.lastIndexOf('}');
  if (s === -1 || e === -1) throw new Error(`no JSON object in response: ${raw.slice(0, 200)}`);
  return JSON.parse(raw.slice(s, e + 1));
}

/** One call, returns the parsed JSON object. Retries on rate limits and 5xx. */
export async function callJSON({ system, user, maxTokens = 2000, temperature = 0 }) {
  let attempt = 0;
  while (attempt < 5) {
    attempt++;
    const res = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${KEY}` },
      body: JSON.stringify(body({ system, user, maxTokens, temperature })),
    });

    if (res.ok) {
      const json = await res.json();
      const text = json.choices?.[0]?.message?.content ?? '';
      if (!text.trim()) throw new Error('empty response from model');
      try {
        return JSON.parse(text);
      } catch {
        return extractJson(text);
      }
    }

    const errText = await res.text();
    if (res.status === 400 && degrade(errText)) continue; // retry with fewer params
    if (res.status === 429 || res.status >= 500) {
      await new Promise((r) => setTimeout(r, 1500 * attempt));
      continue;
    }
    throw new Error(`${res.status} ${errText.slice(0, 300)}`);
  }
  throw new Error(`model call failed after ${attempt} attempts`);
}

export const modelName = MODEL;
