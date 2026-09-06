// Builds the flat control from Dev 1's real graded data.
//
// Same texts, same NORM marks, same rubric — the ONLY change is that each faculty mark is
// replaced with the NORM mark plus small symmetric noise. So there is no drift and no length
// effect in it, by construction.
//
// This is a true control rather than a second synthetic dataset: if the discovery functions
// report something here, they are reporting noise, and the findings on the real data cannot
// be trusted either.
//
//   node tools/make_flat_control.ts   ->  fixtures/flat-control.json

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import type { Script } from '../lib/types.ts';

const SEED = 20260906;

/** mulberry32 — seeded so the control is identical on every machine. */
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
/** Box–Muller, so the noise is normal rather than uniform. */
const gauss = (sd: number) => {
  const u = Math.max(rand(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand()) * sd;
};

const src = JSON.parse(readFileSync(new URL('../data/graded-50.json', import.meta.url), 'utf8'));
const scripts: Script[] = Array.isArray(src) ? src : src.scripts;

const flat = scripts.map((s) => {
  const norm = s.normMark ?? 0;
  const noisy = norm + gauss(0.7);
  return {
    ...s,
    // round to halves and clamp, exactly as a real marker would
    facultyMark: Math.max(0, Math.min(s.awards.reduce((a, x) => a + x.max, 0), Math.round(noisy * 2) / 2)),
  };
});

mkdirSync(new URL('../fixtures/', import.meta.url), { recursive: true });
writeFileSync(new URL('../fixtures/flat-control.json', import.meta.url), JSON.stringify(flat, null, 1), 'utf8');

const res = flat.map((s) => s.facultyMark - (s.normMark ?? 0));
const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length;
console.log(
  `wrote fixtures/flat-control.json (${flat.length} scripts) — ` +
    `mean residual ${mean(res).toFixed(2)}, first half ${mean(res.slice(0, 25)).toFixed(2)}, ` +
    `second half ${mean(res.slice(25)).toFixed(2)}`,
);
