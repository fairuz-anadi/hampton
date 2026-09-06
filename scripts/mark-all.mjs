// Markable — batch marking (Dev 1). Runs ONCE, offline, on your laptop.
// The committed output is what the app ships; nothing calls the model in prod.
//
//   node scripts/mark-all.mjs
//   -> data/graded-50.json
//
// The evidence trick: we never ask the model for character offsets — models are
// unreliable at counting characters. We ask for an EXACT QUOTE from the answer
// and compute the offsets here with indexOf. If the quote is not found verbatim,
// the award ships with no evidence rather than a highlight in the wrong place.

import fs from 'node:fs';
import path from 'node:path';
import { locate } from './locate.mjs';
import { callJSON, modelName } from './llm.mjs';
import { deriveTriage } from './triage.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const CONCURRENCY = 6;


const Q = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/question.json'), 'utf8'));
const scripts = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/scripts-50.json'), 'utf8'));
const CRIT = Q.referenceCriteria;

const ERROR_TAGS = [
  'wrong-case-selected',
  'missed-regularity-check',
  'arithmetic-slip',
  'no-justification',
  'misidentified-parameters',
  'incomplete-working',
  'correct-but-unexplained',
];

const SYS = `You are marking one exam answer against an approved marking guide. You award marks strictly against the criteria given and nothing else. You never reward length, confidence or presentation. Return JSON only.`;

function prompt(script) {
  return `Question (${Q.totalMarks} marks):
${Q.question}

Approved marking guide:
${CRIT.map((c) => `- ${c.id} (${c.marks} marks) ${c.label}: ${c.expects}`).join('\n')}

Student answer:
"""
${script.text}
"""

For each criterion decide the marks awarded (whole or half marks, 0 to the criterion maximum).

Return ONLY this JSON, no prose, no code fence:
{
  "awards": [
    {
      "criterionId": "c1",
      "awarded": 2,
      "quote": "an EXACT substring copied character-for-character from the student answer that justifies this decision, or empty string if nothing in the answer relates to this criterion",
      "note": "one short sentence a faculty member would accept",
      "errorTag": one of ${JSON.stringify(ERROR_TAGS)} or null
    }
  ],
  "triage": "clear" | "review" | "unusual"
}

triage means:
- "clear": the criteria map cleanly onto the answer, nothing to argue about
- "review": partially credited, ambiguous wording, or you were unsure on any criterion
- "unusual": a valid method the guide does not cover, or an answer that does not engage the question

The quote must be copied verbatim from the answer above, including its typos. Do not paraphrase, do not fix spelling, do not add ellipses.`;
}

const markOf = Object.fromEntries(CRIT.map((c) => [c.id, c.marks]));

async function markOne(script) {
  const parsed = await callJSON({ system: SYS, user: prompt(script), maxTokens: 2000, temperature: 0 });
  const awards = CRIT.map((c) => {
    const a = parsed.awards?.find((x) => x.criterionId === c.id) ?? {};
    const awarded = Math.max(0, Math.min(markOf[c.id], Number(a.awarded) || 0));
    return {
      criterionId: c.id,
      awarded,
      max: markOf[c.id],
      evidence: locate(script.text, a.quote ?? ''),
      note: String(a.note ?? '').slice(0, 200),
      errorTag: ERROR_TAGS.includes(a.errorTag) ? a.errorTag : null,
    };
  });
  const modelTriage = ['clear', 'review', 'unusual'].includes(parsed.triage) ? parsed.triage : 'review';
  return {
    ...script,
    normMark: awards.reduce((s, a) => s + a.awarded, 0),
    awards,
    triage: deriveTriage(awards, modelTriage),
    _modelTriage: modelTriage,
  };
}

// ---- bounded pool ---------------------------------------------------------
const out = new Array(scripts.length);
let next = 0, done = 0, failed = 0;
const t0 = Date.now();

async function worker() {
  while (true) {
    const i = next++;
    if (i >= scripts.length) return;
    try {
      out[i] = await markOne(scripts[i]);
    } catch (err) {
      failed++;
      console.error(`  ${scripts[i].id} FAILED: ${err.message}`);
      out[i] = { ...scripts[i], normMark: null, awards: [], triage: 'review' };
    }
    done++;
    if (done % 5 === 0 || done === scripts.length) {
      process.stdout.write(`  ${done}/${scripts.length} marked (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);
    }
  }
}

console.log(`Marking ${scripts.length} scripts via ${modelName}, ${CONCURRENCY} at a time, temperature 0...`);
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

fs.writeFileSync(path.join(ROOT, 'data/graded-50.json'), JSON.stringify(out, null, 2));

const noEvidence = out.flatMap((s) => s.awards).filter((a) => a.evidence.length === 0).length;
const totalAwards = out.flatMap((s) => s.awards).length;
const triage = out.reduce((acc, s) => ({ ...acc, [s.triage]: (acc[s.triage] ?? 0) + 1 }), {});

console.log(`\nWrote data/graded-50.json in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
console.log(`  failures: ${failed}`);
console.log(`  triage: ${JSON.stringify(triage)}`);
console.log(`  awards with no located evidence: ${noEvidence}/${totalAwards}`);
console.log(`\nNow run:  npm run verify   — and spot-check five highlights by hand.`);
