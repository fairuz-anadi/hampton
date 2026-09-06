import { NextResponse } from 'next/server';
import { QUESTION } from '@/lib/data';
import type { Criterion } from '@/lib/types';

// The only live model call in the product. Everything else is the record of a
// marking run that already happened.
//
// The key is read server-side and never leaves this file. If anything at all
// goes wrong — no key, rate limit, malformed JSON, marks that do not add up —
// we return the stored guide and say so, because a demo that dies on venue wifi
// is worse than a demo that admits it fell back.

export const dynamic = 'force-dynamic';

const SYSTEM =
  'You turn an exam question and its mark allocation into a marking guide a faculty member can approve or edit. You propose criteria that are observable in a student answer — never vague qualities like "understanding" or "presentation". The criteria marks must sum exactly to the total. Return JSON only.';

function fallback(reason: string) {
  return NextResponse.json({
    criteria: QUESTION.referenceCriteria,
    source: 'fallback',
    reason,
    approved: false,
  });
}

function normalise(raw: unknown, totalMarks: number): Criterion[] | null {
  if (!raw || typeof raw !== 'object') return null;
  const list = (raw as { criteria?: unknown }).criteria;
  if (!Array.isArray(list) || list.length < 3 || list.length > 8) return null;

  const criteria: Criterion[] = list.map((c, i) => ({
    id: `c${i + 1}`, // models invent their own ids; ours are positional
    label: String((c as Criterion).label ?? '').slice(0, 80),
    marks: Number((c as Criterion).marks) || 0,
    expects: String((c as Criterion).expects ?? '').slice(0, 240),
  }));

  if (criteria.some((c) => !c.label || !c.expects)) return null;
  const sum = criteria.reduce((s, c) => s + c.marks, 0);
  if (Math.abs(sum - totalMarks) > 0.001) return null;

  return criteria;
}

export async function POST() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return fallback('No API key configured on the server — showing the stored guide.');

  const model = process.env.OPENAI_MODEL ?? 'gpt-4o';
  const base = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';

  const user = `Question (${QUESTION.totalMarks} marks):
${QUESTION.question}

Propose 4-6 marking criteria. Each one must be something you could point to in a student's answer and say "this is there" or "this is not".

Return ONLY this JSON, no prose, no code fence:
{"criteria":[{"label":"short noun phrase, 3-6 words","marks":2,"expects":"one sentence: what a full-mark answer must contain"}]}

The marks must sum to exactly ${QUESTION.totalMarks}.`;

  // Why the last attempt failed, so the banner can say something actionable. Every branch
  // below used to collapse into "did not add up", which is wrong for an expired key or an
  // account with no credit — and leaves you guessing at exactly the wrong moment.
  let lastReason = 'The model did not return a guide that adds up. Showing the stored one.';

  // Two attempts: models occasionally return criteria whose marks do not add up.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        // Attempt 0 uses the classic chat-completions shape. Newer models reject both
        // `max_tokens` (they want `max_completion_tokens`) and any temperature other than 1,
        // and answer 400 — so attempt 1 retries with the shape those models accept.
        body: JSON.stringify({
          model,
          response_format: { type: 'json_object' },
          ...(attempt === 0
            ? { max_tokens: 1500, temperature: 0 }
            : { max_completion_tokens: 1500 }),
          messages: [
            { role: 'system', content: SYSTEM },
            { role: 'user', content: user },
          ],
        }),
        signal: AbortSignal.timeout(20_000),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        // Surface OpenAI's own sentence. It names the offending parameter, which is the
        // difference between fixing this in a minute and guessing at it.
        let detailMsg = '';
        try {
          detailMsg = JSON.parse(detail)?.error?.message ?? '';
        } catch {
          detailMsg = '';
        }
        const hint =
          res.status === 401 ? 'the key was rejected — expired, revoked, or mistyped'
          : res.status === 429 ? 'rate limited, or the account has no credit left'
          : res.status === 404 ? `the model "${model}" is not available to this key`
          : `OpenAI returned ${res.status} for model "${model}"${detailMsg ? ` — ${detailMsg}` : ''}`;
        lastReason = `Could not reach the model: ${hint}. Showing the stored guide.`;
        console.error('[rubric] OpenAI %d: %s', res.status, detail.slice(0, 300));
        continue;
      }

      const json = await res.json();
      const text = json?.choices?.[0]?.message?.content ?? '';
      const parsed = normalise(JSON.parse(text), QUESTION.totalMarks);
      if (parsed) {
        return NextResponse.json({ criteria: parsed, source: 'live', model, approved: false });
      }
    } catch (err) {
      // fall through to the next attempt, then to the stored guide
      lastReason =
        err instanceof Error && err.name === 'TimeoutError'
          ? 'The model took longer than 20 seconds. Showing the stored guide.'
          : 'Could not reach the model. Showing the stored guide.';
      console.error('[rubric] %s', err);
    }
  }

  return fallback(lastReason);
}
