// NORM — seed generator (Dev 1).
//
// The model writes the ANSWERS. JavaScript computes the FACULTY MARKS.
// That split is deliberate: if the model assigned the marks we could not
// guarantee the drift step exists, and the whole demo rests on it existing.
//
//   node scripts/generate-seed.mjs
//   -> data/scripts-50.json      50 Script rows, facultyMark set, unmarked by NORM
//   -> data/planted-effects.json ground truth Dev 2's detectors must recover
//
// Needs OPENAI_API_KEY (see scripts/llm.mjs). No npm install — node 20 has fetch.

import fs from 'node:fs';
import path from 'node:path';
import { callJSON, modelName } from './llm.mjs';
import { PLANT, mulberry32, applyPlantedEffects } from './plant.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const rand = mulberry32(PLANT.seed);

// ---------------------------------------------------------------- the 50 slots
// Coverage is decided here, not by the model, so the mark distribution is known.
const Q = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/question.json'), 'utf8'));
const CRIT = Q.referenceCriteria;
const IDS = CRIT.map((c) => c.id);

const TIERS = [
  { n: 8, covers: () => IDS.slice() },                                   // full marks
  { n: 14, covers: () => IDS.filter((_, i) => i !== 3) },                // misses regularity check
  { n: 10, covers: () => ['c1', 'c2', 'c3'] },                           // right case, stops there
  { n: 8, covers: () => ['c1', 'c2', 'c5'] },                            // answer, no justification
  { n: 6, covers: () => ['c1'] },                                        // parameters only
  { n: 4, covers: () => [] },                                            // wrong throughout
];

const slots = [];
for (const t of TIERS) for (let i = 0; i < t.n; i++) slots.push({ covers: t.covers() });
// Shuffle deterministically, then assign marking order 1..50.
for (let i = slots.length - 1; i > 0; i--) {
  const j = Math.floor(rand() * (i + 1));
  [slots[i], slots[j]] = [slots[j], slots[i]];
}
slots.forEach((s, i) => {
  s.order = i + 1;
  s.id = `s${String(i + 1).padStart(2, '0')}`;
  s.label = `Student ${i + 1}`;
  // ~40% verbose. Verbose must NOT mean more correct — that is the whole point.
  s.style = rand() < 0.4 ? 'verbose' : 'concise';
});

// ---------------------------------------------------------------- generation
const SYS = `You are producing realistic student exam answers for a university algorithms paper, to test a marking tool. Write as a real undergraduate would: informal notation, occasional arithmetic slips, uneven working. Never write commentary about the task.`;

function userPrompt(batch) {
  return `Exam question (${Q.totalMarks} marks):
${Q.question}

Marking criteria:
${CRIT.map((c) => `- ${c.id} (${c.marks} marks) ${c.label}: ${c.expects}`).join('\n')}

Write ${batch.length} separate student answers to this exact specification.

${batch.map((s, i) => `Answer ${i + 1} (id ${s.id}) — must satisfy EXACTLY these criteria: ${s.covers.length ? s.covers.join(', ') : 'NONE of them'}. Style: ${s.style === 'verbose' ? 'verbose — 220-320 words, restates the question, hedges, repeats itself, sounds confident' : 'concise — 60-110 words, terse working, no padding'}.`).join('\n')}

Rules:
- An answer must NOT satisfy a criterion outside its list. If c4 is not listed, the answer must not verify the regularity condition at all.
- A verbose answer must not be more correct than a concise one. Length comes from restatement and hedging, never from extra correct reasoning.
- An answer satisfying NO criteria should attempt the problem and get it wrong (wrong case, wrong parameters), not be blank.

Return ONLY this JSON object, no prose, no code fence:
{"answers": [{"id": "s01", "text": "..."}]}`;
}

// ---------------------------------------------------------------- run
const BATCH = 10;
const batches = [];
for (let i = 0; i < slots.length; i += BATCH) batches.push(slots.slice(i, i + BATCH));

console.log(`Generating ${slots.length} answers via ${modelName} in ${batches.length} concurrent calls...`);
const results = await Promise.all(
  batches.map(async (b, i) => {
    const res = await callJSON({ system: SYS, user: userPrompt(b), maxTokens: 8000, temperature: 1 });
    const parsed = res.answers ?? [];
    console.log(`  batch ${i + 1}/${batches.length}: ${parsed.length} answers`);
    return parsed;
  })
);
const byId = new Map(results.flat().map((a) => [a.id, a.text]));

const missing = slots.filter((s) => !byId.has(s.id));
if (missing.length) {
  console.error(`Model skipped ${missing.length} answers: ${missing.map((m) => m.id).join(', ')}`);
  process.exit(1);
}

// ---------------------------------------------------------------- faculty marks
const markOf = Object.fromEntries(CRIT.map((c) => [c.id, c.marks]));
const scripts = slots.map((s) => {
  const text = byId.get(s.id).trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return {
    id: s.id,
    order: s.order,
    label: s.label,
    text,
    wordCount,
    facultyMark: null, // set below
    normMark: null,
    awards: [],
    triage: 'clear',
    _truth: {
      covers: s.covers,
      base: s.covers.reduce((sum, id) => sum + markOf[id], 0),
      style: s.style,
    },
  };
});

// Drift step, length bonus and inconsistent pairs all live in scripts/plant.mjs,
// so replant.mjs can re-tune them later without spending API calls.
const plantedPairs = applyPlantedEffects(scripts, Q.totalMarks, PLANT);

fs.writeFileSync(path.join(ROOT, 'data/scripts-50.json'), JSON.stringify(scripts, null, 2));
fs.writeFileSync(
  path.join(ROOT, 'data/planted-effects.json'),
  JSON.stringify({ ...PLANT, plantedPairs, generatedAt: new Date().toISOString() }, null, 2)
);

console.log(`\nWrote data/scripts-50.json (${scripts.length} scripts)`);
console.log(`Planted ${plantedPairs.length} inconsistent pairs: ${plantedPairs.map((p) => `${p.a}/${p.b} gap ${p.gap}`).join(', ')}`);
console.log(`Now run:  npm run verify`);
