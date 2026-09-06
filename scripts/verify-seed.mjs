// Markable — proof the planted effects actually landed (Dev 1).
//
//   node scripts/verify-seed.mjs
//
// Run this BEFORE handing data to Dev 2. If the drift step is not in this
// output, it is not in the data, and the hero moment finds nothing.
//
// Before marking it compares against ground-truth coverage; once
// data/graded-50.json exists it uses Markable's real marks instead.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

const Q = read('data/question.json');
const PLANT = read('data/planted-effects.json');
const gradedPath = path.join(ROOT, 'data/graded-50.json');
const marked = fs.existsSync(gradedPath);
const scripts = marked ? read('data/graded-50.json') : read('data/scripts-50.json');

const mean = (a) => (a.length ? a.reduce((s, n) => s + n, 0) / a.length : NaN);
const f2 = (n) => (Number.isFinite(n) ? n.toFixed(2) : '—');

// Markable's mark, or ground-truth base as a stand-in before marking.
const norm = (s) => (marked && s.normMark != null ? s.normMark : s._truth.base);
const residual = (s) => s.facultyMark - norm(s);

console.log(`\nSource: ${marked ? 'data/graded-50.json (real Markable marks)' : 'data/scripts-50.json (ground-truth coverage as stand-in)'}`);
console.log(`Scripts: ${scripts.length}\n`);

// ---- 1. drift -------------------------------------------------------------
// Partial-credit answers only: a full-mark answer cannot be marked generously.
const partial = scripts.filter((s) => norm(s) < Q.totalMarks);
const early = partial.filter((s) => s.order <= PLANT.driftAfter);
const late = partial.filter((s) => s.order > PLANT.driftAfter);
const mE = mean(early.map(residual));
const mL = mean(late.map(residual));

console.log('DRIFT  (faculty - Markable, partial-credit answers only)');
console.log(`  scripts 1-${PLANT.driftAfter}    n=${String(early.length).padStart(2)}  mean +${f2(mE)}`);
console.log(`  scripts ${PLANT.driftAfter + 1}-${scripts.length}   n=${String(late.length).padStart(2)}  mean +${f2(mL)}`);
console.log(`  step             ${f2(mE - mL)}  (planted ${f2(PLANT.generosityEarly - PLANT.generosityLate)})`);
console.log(`  ${mE - mL > 0.4 ? 'OK — the step is findable' : 'FAIL — no usable step, re-seed'}\n`);

// ---- 2. length effect -----------------------------------------------------
// Compared WITHIN equal coverage, which is the only version of this claim
// that means anything.
const byCoverage = new Map();
for (const s of scripts) {
  const key = (s._truth?.covers ?? []).join('|');
  if (!byCoverage.has(key)) byCoverage.set(key, []);
  byCoverage.get(key).push(s);
}
const gaps = [];
for (const [, group] of byCoverage) {
  const long = group.filter((s) => s.wordCount > PLANT.lengthThreshold).map((s) => s.facultyMark);
  const short = group.filter((s) => s.wordCount <= PLANT.lengthThreshold).map((s) => s.facultyMark);
  if (long.length && short.length) gaps.push({ n: group.length, gap: mean(long) - mean(short) });
}
const weighted = gaps.length ? gaps.reduce((s, g) => s + g.gap * g.n, 0) / gaps.reduce((s, g) => s + g.n, 0) : NaN;

console.log(`LENGTH  (>${PLANT.lengthThreshold} words vs shorter, at equal rubric coverage)`);
console.log(`  coverage groups with both: ${gaps.length}`);
console.log(`  mean advantage to longer answers: +${f2(weighted)}  (planted +${f2(PLANT.lengthBonus)})`);
console.log(`  ${weighted > 0.5 ? 'OK — the effect survives the coverage control' : 'FAIL — effect washed out, re-seed'}\n`);

// ---- 3. similar pairs -----------------------------------------------------
const pairs = [];
for (const [, group] of byCoverage) {
  for (let i = 0; i < group.length; i++)
    for (let j = i + 1; j < group.length; j++) {
      const gap = Math.abs(group[i].facultyMark - group[j].facultyMark);
      if (gap >= 2) pairs.push({ a: group[i].id, b: group[j].id, gap });
    }
}
pairs.sort((x, y) => y.gap - x.gap);
console.log('SIMILAR PAIRS  (identical coverage, >= 2 marks apart)');
console.log(`  found: ${pairs.length}`);
for (const p of pairs.slice(0, 6)) console.log(`    ${p.a} / ${p.b}   gap ${p.gap}`);
console.log(`  ${pairs.length >= 4 ? 'OK' : 'FAIL — fewer than 4, re-seed'}\n`);

// ---- 4. distribution ------------------------------------------------------
const marks = scripts.map((s) => s.facultyMark);
console.log('DISTRIBUTION');
console.log(`  faculty marks  min ${Math.min(...marks)}  mean ${f2(mean(marks))}  max ${Math.max(...marks)}`);
console.log(`  full marks: ${marks.filter((m) => m === Q.totalMarks).length}   zeros: ${marks.filter((m) => m === 0).length}`);
const words = scripts.map((s) => s.wordCount);
console.log(`  words          min ${Math.min(...words)}  mean ${Math.round(mean(words))}  max ${Math.max(...words)}`);
if (marked) {
  const t = scripts.reduce((acc, s) => ({ ...acc, [s.triage]: (acc[s.triage] ?? 0) + 1 }), {});
  console.log(`  triage         ${JSON.stringify(t)}`);
  const noEvidence = scripts.flatMap((s) => s.awards).filter((a) => a.evidence.length === 0).length;
  const total = scripts.flatMap((s) => s.awards).length;
  console.log(`  awards without evidence: ${noEvidence}/${total}`);
}
console.log();
