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

  // Two attempts: models occasionally return criteria whose marks do not add up.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          max_tokens: 1500,
          temperature: 0,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SYSTEM },
            { role: 'user', content: user },
          ],
        }),
        signal: AbortSignal.timeout(20_000),
      });

      if (!res.ok) continue;

      const json = await res.json();
      const text = json?.choices?.[0]?.message?.content ?? '';
      const parsed = normalise(JSON.parse(text), QUESTION.totalMarks);
      if (parsed) {
        return NextResponse.json({ criteria: parsed, source: 'live', model, approved: false });
      }
    } catch {
      // fall through to the next attempt, then to the stored guide
    }
  }

  return fallback('The model did not return a guide that adds up. Showing the stored one.');
}
