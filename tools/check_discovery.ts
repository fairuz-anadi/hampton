// Dev 2's checks.  `node tools/check_discovery.ts`
//
// Two datasets, two different jobs:
//
//   data/graded-50.json        Dev 1's real marked scripts. Reported, not asserted — whether a
//                              finding appears here depends on Dev 1's planted effects surviving,
//                              which is their file to tune, not my code to bend.
//
//   fixtures/flat-control.json The same scripts with faculty marks replaced by noise. Nothing is
//                              planted, so nothing may be found. These ARE hard assertions: a
//                              discovery tool that always discovers something is a horoscope.

import { readFileSync } from 'node:fs';
import { drift, lengthEffect, similarPairs, misconceptions } from '../lib/insights/discovery.ts';
import type { Script } from '../lib/types.ts';

/** Dev 1 ships graded-50.json as a bare array; my fixtures wrap it. Accept either. */
const load = (f: string): Script[] => {
  const raw = JSON.parse(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'));
  return Array.isArray(raw) ? raw : raw.scripts;
};

let failures = 0;
const assert = (label: string, pass: boolean, got: string) => {
  if (!pass) failures++;
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${label.padEnd(34)} ${got}`);
};

function run(file: string, mode: 'report' | 'assert-found' | 'assert-silent') {
  const scripts = load(file);
  console.log(`\n=== ${file}  (${scripts.length} scripts) ===`);

  const d = drift(scripts);
  const l = lengthEffect(scripts);
  const p = similarPairs(scripts);

  if (mode === 'assert-silent') {
    assert('drift stays silent', d === null, d ? d.headline : 'nothing reported');
    assert('length stays silent', l === null, l ? l.headline : 'nothing reported');
    assert('no similar pairs', p.length === 0, `${p.length} found`);
  } else {
    console.log(`  drift   ${d ? d.headline : '— nothing above the noise'}`);
    if (d) console.log(`          ${d.detail}`);
    console.log(`  length  ${l ? l.headline : '— nothing above the noise'}`);
    if (l) console.log(`          ${l.detail}`);
    console.log(`  pairs   ${p.length} found`);
    for (const f of p) console.log(`          ${f.headline}`);
    if (mode === 'assert-found') {
      assert('drift found', d !== null, d ? 'reported' : 'nothing');
      assert('length found', l !== null, l ? 'reported' : 'nothing');
      assert('similar pairs found', p.length >= 4, `${p.length} found, 4 planted`);
    }
  }

  const m = misconceptions(scripts);
  console.log(`  shared mistakes: ${m.length} groups${m[0] ? ` — top: ${m[0].count} students, ${m[0].tag}` : ''}`);
}

run('data/graded-50.json', 'report');
run('fixtures/demo-control.json', 'assert-found');
run('fixtures/flat-control.json', 'assert-silent');

console.log(`\n${failures === 0 ? 'ALL ASSERTIONS PASSED' : `${failures} ASSERTION(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
