// Builds a CORRECTED control from Dev 1's real graded data.
//
// This is not a replacement for data/graded-50.json — Dev 1 owns that file and must re-run their
// own pipeline. This is a worked example of the parameters that make all three findings survive,
// so the fix is a lookup rather than a guessing game, and so the You page can be seen working
// while that re-run happens.
//
// Three things differ from data/graded-50.json:
//
//  1. Lower generosity baseline. The real file averages +1.3 above NORM, which pins 16 of 50
//     faculty marks at 10.0, and the clamping silently eats the drift step. Same step, lower base.
//  2. A real spread of answer lengths. The real file runs 22-226 words with only 12 over the
//     150-word threshold, which leaves the length effect nothing to measure.
//  3. Pairs planted by COPYING TEXT. The real file's pairs were chosen by shared criterion
//     coverage and are 0.04-0.08 similar — i.e. unrelated answers. On stage, opening those two
//     side by side shows a 51-word answer next to a 181-word answer, and the claim collapses.
//
//   node tools/make_demo_control.ts   ->  fixtures/demo-control.json

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import type { Script } from '../lib/types.ts';

const SEED = 424242;
const DRIFT_AFTER = 25;
const GENEROSITY_EARLY = 1.0;   // was 1.8 — the ceiling ate the step at that level
const GENEROSITY_LATE = 0.15;   // was 1.2  — step of 0.85, but centred far below 10
const LENGTH_WORDS = 150;
const LENGTH_BONUS = 0.65;      // centred: +0.65 long, -0.65 short = a 1.30 gap
const NOISE_SD = 0.35;
const PAIR_GAP = 2.5;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(SEED);
const gauss = (sd: number) =>
  Math.sqrt(-2 * Math.log(Math.max(rand(), 1e-9))) * Math.cos(2 * Math.PI * rand()) * sd;
const half = (x: number) => Math.round(x * 2) / 2;

const src = JSON.parse(readFileSync(new URL('../data/graded-50.json', import.meta.url), 'utf8'));
const scripts: Script[] = (Array.isArray(src) ? src : src.scripts).map((s: Script) => ({ ...s }));
const totalMarks = scripts[0].awards.reduce((a, x) => a + x.max, 0);

// --- 1 & 2: re-mark with a drift step and a length effect that both survive the ceiling
for (const s of scripts) {
  const base = s.order <= DRIFT_AFTER ? GENEROSITY_EARLY : GENEROSITY_LATE;
  const len = s.wordCount > LENGTH_WORDS ? LENGTH_BONUS : -LENGTH_BONUS;
  const raw = (s.normMark ?? 0) + base + len + gauss(NOISE_SD);
  s.facultyMark = Math.max(0, Math.min(totalMarks, half(raw)));
}

// --- 3: plant pairs that are actually alike, by copying one answer into the other
const byId = new Map(scripts.map((s) => [s.id, s]));
const PAIRS: [string, string][] = [
  ['s05', 's41'],
  ['s09', 's44'],
  ['s14', 's47'],
  ['s19', 's50'],
];
for (const [a, b] of PAIRS) {
  const A = byId.get(a);
  const B = byId.get(b);
  if (!A || !B) continue;
  // B now gives A's answer, lightly reworded. Same substance => NORM must award the same marks.
  B.text = A.text
    .replace(/^We /, 'I ')
    .replace(/Therefore/g, 'So therefore')
    .replace(/Hence/g, 'And hence');
  B.wordCount = B.text.split(/\s+/).filter(Boolean).length;
  B.normMark = A.normMark;
  B.awards = JSON.parse(JSON.stringify(A.awards));
  // Split the disagreement around A's mark, placing the low end first so the ceiling
  // cannot shrink the gap we are trying to plant.
  const lo = Math.max(0, Math.min((A.facultyMark ?? 0) - PAIR_GAP / 2, totalMarks - PAIR_GAP));
  A.facultyMark = half(lo + PAIR_GAP);
  B.facultyMark = half(lo);
}

mkdirSync(new URL('../fixtures/', import.meta.url), { recursive: true });
writeFileSync(new URL('../fixtures/demo-control.json', import.meta.url), JSON.stringify(scripts, null, 1), 'utf8');

const res = scripts.map((s) => (s.facultyMark ?? 0) - (s.normMark ?? 0));
const mean = (v: number[]) => v.reduce((x, y) => x + y, 0) / v.length;
console.log(
  `wrote fixtures/demo-control.json (${scripts.length} scripts)\n` +
    `  mean residual ${mean(res).toFixed(2)}  first half ${mean(res.slice(0, 25)).toFixed(2)}  ` +
    `second half ${mean(res.slice(25)).toFixed(2)}\n` +
    `  at ceiling: ${scripts.filter((s) => s.facultyMark === totalMarks).length} of ${scripts.length} ` +
    `(real file: 16)`,
);
