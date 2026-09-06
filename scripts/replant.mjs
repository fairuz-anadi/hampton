// Markable — re-apply the planted effects to answers we already have (Dev 1).
//
//   node scripts/replant.mjs
//
// Tuning the drift step, the length threshold or the pair gap does not need new
// answers — the text is fine, only the faculty marks change. Edit PLANT in
// scripts/plant.mjs, run this, run verify. Costs nothing and takes no time.
//
// Rewrites data/scripts-50.json and data/planted-effects.json in place.
// Does NOT touch data/graded-50.json — re-run marking if Markable's marks matter.

import fs from 'node:fs';
import path from 'node:path';
import { PLANT, applyPlantedEffects } from './plant.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

const Q = read('data/question.json');
const scripts = read('data/scripts-50.json');

if (!scripts.every((s) => s._truth && typeof s._truth.base === 'number')) {
  console.error('scripts-50.json is missing _truth.base — regenerate with npm run seed.');
  process.exit(1);
}

const before = scripts.map((s) => s.facultyMark);
const plantedPairs = applyPlantedEffects(scripts, Q.totalMarks, PLANT);
const changed = scripts.filter((s, i) => s.facultyMark !== before[i]).length;

fs.writeFileSync(path.join(ROOT, 'data/scripts-50.json'), JSON.stringify(scripts, null, 2));
fs.writeFileSync(
  path.join(ROOT, 'data/planted-effects.json'),
  JSON.stringify({ ...PLANT, plantedPairs, replantedAt: new Date().toISOString() }, null, 2)
);

console.log(`Re-planted ${scripts.length} scripts — ${changed} faculty marks changed.`);
console.log(`Length threshold ${PLANT.lengthThreshold} words: ${scripts.filter((s) => s.wordCount > PLANT.lengthThreshold).length} answers get the bonus.`);
console.log(`Pairs: ${plantedPairs.map((p) => `${p.a}/${p.b} gap ${p.gap}`).join(', ')}`);
console.log('Now run:  npm run verify');
