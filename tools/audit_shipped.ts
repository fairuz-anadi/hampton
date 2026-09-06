// Audit of lib/insights.ts — the module that actually ships.
//
// The question is not "does it find things" but "how often does it find things that are not
// there". Runs the shipped detectors against (a) the real data, (b) a pure-noise control, and
// (c) a Monte Carlo of many independent noise draws, to estimate the false-positive rate.
//
//   node tools/audit_shipped.ts

import { readFileSync } from 'node:fs';
import { detectDrift, detectLengthEffect, findSimilarPairs, consistencyScore } from '../lib/insights.ts';
import type { Script } from '../lib/types.ts';

const load = (f: string): Script[] => {
  const raw = JSON.parse(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'));
  return Array.isArray(raw) ? raw : raw.scripts;
};

const TOTAL = 10;

function report(label: string, scripts: Script[]) {
  const d = detectDrift(scripts, TOTAL);
  const l = detectLengthEffect(scripts, TOTAL);
  const p = findSimilarPairs(scripts, 5);
  const c = consistencyScore(scripts);
  console.log(`\n=== ${label} ===`);
  console.log(`  drift   step ${d.step >= 0 ? '+' : ''}${d.step} (early ${d.earlyMean} / late ${d.lateMean}, n ${d.earlyN}/${d.lateN})  -> ${d.significant ? 'REPORTED' : 'silent'}`);
  console.log(`  length  advantage ${l.advantage} (ex-ceiling ${l.advantageExCeiling}, ${l.groups} groups, ceiling ${l.ceilingN})  -> ${l.significant ? 'REPORTED' : 'silent'}`);
  console.log(`  pairs   ${p.length} shown${p.length ? ` (widest gap ${p[0].gap})` : ''}`);
  console.log(`  consistency ${JSON.stringify(c)}`);
}

report('data/graded-50.json  (real)', load('data/graded-50.json'));
report('fixtures/flat-control.json  (pure noise)', load('fixtures/flat-control.json'));

// ---- Monte Carlo: how often does a detector fire on data with NOTHING in it?
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const base = load('data/graded-50.json');
const TRIALS = 400;
let driftFired = 0;
let lengthFired = 0;
let pairsFired = 0;

for (let t = 0; t < TRIALS; t++) {
  const rand = rng(1000 + t);
  const gauss = (sd: number) =>
    Math.sqrt(-2 * Math.log(Math.max(rand(), 1e-9))) * Math.cos(2 * Math.PI * rand()) * sd;
  // Faculty mark = Markable's mark + symmetric noise. No drift, no length effect, by construction.
  const noise: Script[] = base.map((s) => ({
    ...s,
    facultyMark: Math.max(0, Math.min(TOTAL, Math.round(((s.normMark ?? 0) + gauss(0.7)) * 2) / 2)),
  }));
  if (detectDrift(noise, TOTAL).significant) driftFired++;
  if (detectLengthEffect(noise, TOTAL).significant) lengthFired++;
  if (findSimilarPairs(noise, 5).length > 0) pairsFired++;
}

const pct = (n: number) => `${((n / TRIALS) * 100).toFixed(1)}%`;
console.log(`\n=== FALSE POSITIVE RATE (${TRIALS} independent noise datasets, nothing planted) ===`);
console.log(`  drift  reported a finding in  ${String(driftFired).padStart(3)} / ${TRIALS}   ${pct(driftFired)}`);
console.log(`  length reported a finding in  ${String(lengthFired).padStart(3)} / ${TRIALS}   ${pct(lengthFired)}`);
console.log(`  pairs  reported at least one  ${String(pairsFired).padStart(3)} / ${TRIALS}   ${pct(pairsFired)}`);
console.log(`\n  A trustworthy detector should sit near 5% or below on data with nothing in it.`);
