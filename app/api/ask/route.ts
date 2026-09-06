import { NextResponse } from 'next/server';
import { SCRIPTS, QUESTION, CRITERIA, triageCounts } from '@/lib/data';
import { detectDrift, detectLengthEffect, findSimilarPairs, findCommonErrors, consistencyScore } from '@/lib/insights';
import { envOr, envOrUndefined } from '@/lib/env';

// Answers questions about THIS marking session, and only from numbers Markable has
// already computed. The facts are assembled here and handed to the model as the
// entire world it may draw on — the model phrases the answer, it does not
// produce the arithmetic. If a question needs something not in the facts, the
// instruction is to say so rather than guess, because a grading tool that
// invents a statistic is worse than one that declines.

export const dynamic = 'force-dynamic';

function facts() {
  const drift = detectDrift(SCRIPTS, QUESTION.totalMarks);
  const length = detectLengthEffect(SCRIPTS, QUESTION.totalMarks);
  const pairs = findSimilarPairs(SCRIPTS, 5);
  const errors = findCommonErrors(SCRIPTS);
  const consistency = consistencyScore(SCRIPTS);
  const counts = triageCounts();
  const marks = SCRIPTS.map((s) => s.normMark ?? 0);

  return {
    question: QUESTION.question,
    totalMarks: QUESTION.totalMarks,
    scripts: SCRIPTS.length,
    criteria: CRITERIA.map((c) => ({ id: c.id, label: c.label, marks: c.marks })),
    triage: counts,
    marks: {
      mean: Number((marks.reduce((a, b) => a + b, 0) / marks.length).toFixed(2)),
      min: Math.min(...marks),
      max: Math.max(...marks),
      fullMarks: marks.filter((m) => m === QUESTION.totalMarks).length,
    },
    drift: {
      reported: drift.significant,
      step: drift.step,
      earlyMean: drift.earlyMean,
      lateMean: drift.lateMean,
      splitAt: drift.splitAt,
      n: { early: drift.earlyN, late: drift.lateN },
    },
    lengthEffect: {
      reported: length.significant,
      rawAdvantage: length.advantage,
      advantageExcludingFullMarks: length.advantageExCeiling,
      answersAtFullMarks: length.ceilingN,
      thresholdWords: length.threshold,
      note: 'Not reported as a finding: the effect reverses once answers already at full marks are excluded.',
    },
    consistency,
    similarPairs: pairs.map((p) => ({
      higher: { label: p.a.label, mark: p.a.facultyMark, order: p.a.order },
      lower: { label: p.b.label, mark: p.b.facultyMark, order: p.b.order },
      gap: p.gap,
    })),
    commonErrors: errors.map((e) => ({ label: e.label, students: e.count })),
  };
}

export async function POST(req: Request) {
  let question = '';
  try {
    question = String((await req.json())?.question ?? '').slice(0, 500);
  } catch {
    return NextResponse.json({ answer: 'That question did not come through. Try again?' }, { status: 400 });
  }
  if (!question.trim()) {
    return NextResponse.json({ answer: 'Ask me something about this marking session.' });
  }

  const key = envOrUndefined('OPENAI_API_KEY');
  if (!key) {
    return NextResponse.json({
      answer: 'No API key is configured on the server, so I can only show the numbers already on these pages.',
      grounded: false,
    });
  }

  const model = envOr('OPENAI_MODEL', 'gpt-4o');
  const base = envOr('OPENAI_BASE_URL', 'https://api.openai.com/v1');

  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 400,
        messages: [
          {
            role: 'system',
            content:
              'You answer questions about one exam marking session for the faculty member who marked it. The JSON below is the ONLY information you have. Quote its numbers exactly and never invent or estimate one. If the answer is not in the JSON, say plainly that Markable has not computed it. Two or three sentences, plain language, no bullet points, no markdown. Hedge findings the way the data does: say "may have" and "worth reviewing", never "you are biased".',
          },
          { role: 'user', content: `Session facts:\n${JSON.stringify(facts())}\n\nQuestion: ${question}` },
        ],
      }),
      signal: AbortSignal.timeout(25_000),
    });

    if (!res.ok) throw new Error(String(res.status));
    const json = await res.json();
    const answer = json?.choices?.[0]?.message?.content?.trim();
    if (!answer) throw new Error('empty');

    return NextResponse.json({ answer, grounded: true });
  } catch {
    return NextResponse.json({
      answer: 'I could not reach the model just now. Every number it would have used is on the Grade, You and Class pages.',
      grounded: false,
    });
  }
}
