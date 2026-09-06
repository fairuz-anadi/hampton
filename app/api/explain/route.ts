import { NextResponse } from 'next/server';
import { QUESTION, CRITERIA, scriptById } from '@/lib/data';
import { envOr, envOrUndefined } from '@/lib/env';

// "Want to understand this?" — the one place in the product where a model
// talks to a student.
//
// The guard rails matter more here than anywhere else. The model is given the
// criterion the faculty approved, what that criterion expects, and the line
// the marker actually wrote — and it is told to explain the idea, never to
// re-argue the mark. A student who is told by an AI that their mark was right
// has been given an opinion nobody approved; a student who is told what the
// regularity condition is has been taught something.

export const dynamic = 'force-dynamic';

const SYSTEM = [
  'You explain one idea to a university student who just lost marks on it.',
  'Explain the concept itself, in plain language, as a teacher would at the board.',
  'Two short paragraphs at most, no markdown, no bullet points, no headings.',
  'Never say whether the mark was fair, never re-mark the answer, never apologise for the grade, and never suggest appealing.',
  'Do not praise or criticise the student. Explain the idea, say why it matters in this kind of problem, and stop.',
].join(' ');

export async function POST(req: Request) {
  let criterionId = '';
  let scriptId = '';
  try {
    const body = await req.json();
    criterionId = String(body?.criterionId ?? '');
    scriptId = String(body?.scriptId ?? '');
  } catch {
    return NextResponse.json({ explanation: 'That did not come through. Try again?' }, { status: 400 });
  }

  const criterion = CRITERIA.find((c) => c.id === criterionId);
  if (!criterion) {
    return NextResponse.json({ explanation: 'Markable does not have that criterion.' }, { status: 404 });
  }

  const script = scriptById(scriptId);
  const award = script?.awards.find((a) => a.criterionId === criterionId);

  // Without a key the student still gets something true and useful: the
  // standard their examiner approved, in full, rather than an error.
  const fallback = `Your examiner's guide asks for this: ${criterion.expects} The marker's note on your answer was: "${award?.note ?? 'no note recorded'}" Markable cannot reach a model to explain the idea further right now, but that is the exact standard your answer was read against.`;

  const key = envOrUndefined('OPENAI_API_KEY');
  if (!key) return NextResponse.json({ explanation: fallback, grounded: false });

  const model = envOr('OPENAI_MODEL', 'gpt-4o');
  const base = envOr('OPENAI_BASE_URL', 'https://api.openai.com/v1');

  const user = `The exam question was:
${QUESTION.question}

The student lost marks on this criterion: "${criterion.label}"
A full-mark answer must: ${criterion.expects}
The marker wrote: "${award?.note ?? 'no note recorded'}"

Explain what "${criterion.label}" means and why this step matters when solving a problem like this one. Do not mention the mark.`;

  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 420,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: user },
        ],
      }),
      signal: AbortSignal.timeout(25_000),
    });

    if (!res.ok) throw new Error(String(res.status));
    const json = await res.json();
    const explanation = json?.choices?.[0]?.message?.content?.trim();
    if (!explanation) throw new Error('empty');

    return NextResponse.json({ explanation, grounded: true });
  } catch {
    return NextResponse.json({ explanation: fallback, grounded: false });
  }
}
