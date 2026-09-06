// Markable — builds fixtures/fake-10.json (Dev 1, handed to Dev 2 and Dev 3 at 0:20).
//
//   node scripts/build-fixture.mjs
//
// Ten hand-written rows in the real Script shape, so Dev 2 and Dev 3 can build
// before any model has run. Offsets are computed with the SAME locate() the
// real marking uses, so this doubles as its test — a quote that does not match
// verbatim fails the build loudly instead of shipping a wrong highlight.
//
// Planted for Dev 2: marking is generous for orders 1-5 and stricter for 6-10,
// and the verbose answers sit above the concise ones at equal coverage.

import fs from 'node:fs';
import path from 'node:path';
import { locate } from './locate.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const MAX = { c1: 2, c2: 2, c3: 2, c4: 2, c5: 2 };

const rows = [
  {
    id: 'f01', order: 1, facultyMark: 8.5, style: 'concise',
    text: 'Here a = 3, b = 4, f(n) = n log n. So n^(log_4 3) = n^0.79. Since n log n grows faster, this is Case 3. Therefore T(n) = Theta(n log n).',
    awards: [
      ['c1', 2, 'a = 3, b = 4, f(n) = n log n.', 'All three parameters stated.', null],
      ['c2', 2, 'n^(log_4 3) = n^0.79.', 'Critical exponent computed.', null],
      ['c3', 2, 'Since n log n grows faster, this is Case 3.', 'Case 3 selected with a reason.', null],
      ['c4', 0, '', 'Regularity condition never checked.', 'missed-regularity-check'],
      ['c5', 2, 'Therefore T(n) = Theta(n log n).', 'Correct bound.', null],
    ],
    triage: 'clear',
  },
  {
    id: 'f02', order: 2, facultyMark: 9, style: 'verbose',
    text: 'a is 3 and b is 4 and the driving function is n log n. Computing the watershed we get n raised to log base 4 of 3 which is about n^0.79. Comparing the two, the driving function clearly dominates, so we are in the third case of the theorem, and I believe the answer works out to Theta of n log n overall.',
    awards: [
      ['c1', 2, 'a is 3 and b is 4 and the driving function is n log n.', 'Parameters identified in words.', null],
      ['c2', 2, 'n raised to log base 4 of 3 which is about n^0.79.', 'Exponent computed correctly.', null],
      ['c3', 2, 'we are in the third case of the theorem', 'Case 3 identified.', null],
      ['c4', 0, '', 'No regularity check.', 'missed-regularity-check'],
      ['c5', 2, 'the answer works out to Theta of n log n overall.', 'Bound stated, hedged.', null],
    ],
    triage: 'clear',
  },
  {
    id: 'f03', order: 3, facultyMark: 5.5, style: 'concise',
    text: 'a = 3, b = 4, f(n) = n log n. n^(log_4 3) is roughly n^0.79.',
    awards: [
      ['c1', 2, 'a = 3, b = 4, f(n) = n log n.', 'Parameters stated.', null],
      ['c2', 2, 'n^(log_4 3) is roughly n^0.79.', 'Exponent computed.', null],
      ['c3', 0, '', 'No case selected.', 'incomplete-working'],
      ['c4', 0, '', 'Not attempted.', 'incomplete-working'],
      ['c5', 0, '', 'No bound given.', 'incomplete-working'],
    ],
    triage: 'clear',
  },
  {
    id: 'f04', order: 4, facultyMark: 7, style: 'verbose',
    text: 'The recurrence given to us is T(n) = 3T(n/4) + n log n, which is a divide and conquer recurrence of the standard form. We can see that a = 3 and b = 4 and the extra work at each level is f(n) = n log n. Next we need the watershed function, which is n to the power log base 4 of 3, approximately n^0.79 as a decimal. I am fairly confident this is the right approach here.',
    awards: [
      ['c1', 2, 'a = 3 and b = 4 and the extra work at each level is f(n) = n log n.', 'Parameters identified.', null],
      ['c2', 2, 'n to the power log base 4 of 3, approximately n^0.79 as a decimal.', 'Exponent computed.', null],
      ['c3', 0, '', 'Stops before choosing a case.', 'incomplete-working'],
      ['c4', 0, '', 'Not attempted.', 'incomplete-working'],
      ['c5', 0, '', 'No bound.', 'incomplete-working'],
    ],
    triage: 'clear',
  },
  {
    id: 'f05', order: 5, facultyMark: 10, style: 'concise',
    text: 'a = 3, b = 4. f(n) = n log n. Case 3 applies. Also 3(n/4)log(n/4) <= (3/4) n log n so the regularity condition holds. T(n) = Theta(n log n).',
    awards: [
      ['c1', 2, 'a = 3, b = 4. f(n) = n log n.', 'Parameters stated.', null],
      ['c2', 2, 'Case 3 applies.', 'Exponent implied by the case choice.', null],
      ['c3', 2, 'Case 3 applies.', 'Case 3 selected.', null],
      ['c4', 2, '3(n/4)log(n/4) <= (3/4) n log n so the regularity condition holds.', 'Regularity verified explicitly.', null],
      ['c5', 2, 'T(n) = Theta(n log n).', 'Correct bound.', null],
    ],
    triage: 'clear',
  },
  {
    id: 'f06', order: 6, facultyMark: 7.5, style: 'concise',
    text: 'We have a = 3, b = 4, f(n) = n log n. The watershed is n^(log_4 3) = n^0.79. f(n) is bigger so Case 3. Hence T(n) = Theta(n log n).',
    awards: [
      ['c1', 2, 'a = 3, b = 4, f(n) = n log n.', 'Parameters stated.', null],
      ['c2', 2, 'The watershed is n^(log_4 3) = n^0.79.', 'Exponent computed.', null],
      ['c3', 2, 'f(n) is bigger so Case 3.', 'Case 3 selected.', null],
      ['c4', 0, '', 'No regularity check.', 'missed-regularity-check'],
      ['c5', 2, 'Hence T(n) = Theta(n log n).', 'Correct bound.', null],
    ],
    triage: 'clear',
  },
  {
    id: 'f07', order: 7, facultyMark: 8.5, style: 'verbose',
    text: 'Reading the recurrence carefully, we can identify that a equals 3, b equals 4, and the additional work per level is f(n) = n log n. The comparison function is therefore n to the power of log base 4 of 3, which evaluates to approximately n^0.79. Since n log n is polynomially larger than this, the third case of the Master Theorem is the one that applies to this recurrence, and so the final asymptotic bound must be Theta(n log n) as required.',
    awards: [
      ['c1', 2, 'a equals 3, b equals 4, and the additional work per level is f(n) = n log n.', 'Parameters identified.', null],
      ['c2', 2, 'n to the power of log base 4 of 3, which evaluates to approximately n^0.79.', 'Exponent computed.', null],
      ['c3', 2, 'the third case of the Master Theorem is the one that applies', 'Case 3 with justification.', null],
      ['c4', 0, '', 'Regularity not verified.', 'missed-regularity-check'],
      ['c5', 2, 'the final asymptotic bound must be Theta(n log n)', 'Correct bound.', null],
    ],
    triage: 'clear',
  },
  {
    id: 'f08', order: 8, facultyMark: 2.5, style: 'concise',
    text: 'a = 3, b = 4, f(n) = n log n. Comparing, I think this is Case 1, so T(n) = Theta(n^0.79).',
    awards: [
      ['c1', 2, 'a = 3, b = 4, f(n) = n log n.', 'Parameters stated.', null],
      ['c2', 0, '', 'Exponent never computed.', 'incomplete-working'],
      ['c3', 0, 'I think this is Case 1', 'Case 1 chosen; f(n) dominates so Case 3 applies.', 'wrong-case-selected'],
      ['c4', 0, '', 'Not attempted.', 'incomplete-working'],
      ['c5', 0, 'T(n) = Theta(n^0.79).', 'Bound follows from the wrong case.', 'wrong-case-selected'],
    ],
    triage: 'clear',
  },
  {
    id: 'f09', order: 9, facultyMark: 4, style: 'verbose',
    text: 'For this recurrence we should identify the constants first. Clearly a = 3 because there are three subproblems, and b = 4 because the size shrinks by a factor of four each time, with f(n) = n log n being the combine step. Having set that up, my instinct is that the first case of the theorem applies here, giving T(n) = Theta(n^0.79) as the final answer, though I am not completely certain about this part.',
    awards: [
      ['c1', 2, 'a = 3 because there are three subproblems, and b = 4', 'Parameters identified with reasons.', null],
      ['c2', 0, '', 'Exponent not computed.', 'incomplete-working'],
      ['c3', 0, 'the first case of the theorem applies here', 'Case 1 chosen incorrectly.', 'wrong-case-selected'],
      ['c4', 0, '', 'Not attempted.', 'incomplete-working'],
      ['c5', 0, 'T(n) = Theta(n^0.79) as the final answer', 'Bound follows the wrong case.', 'wrong-case-selected'],
    ],
    triage: 'review',
  },
  {
    id: 'f10', order: 10, facultyMark: 4, style: 'concise',
    text: 'I would draw the recursion tree and add up the levels. The tree has depth log_4 n and each level does about n log n work, so summing gives roughly n log n times a constant. So T(n) = Theta(n log n).',
    awards: [
      ['c1', 0, '', 'Parameters never named.', 'misidentified-parameters'],
      ['c2', 0, '', 'No critical exponent.', 'incomplete-working'],
      ['c3', 0, 'I would draw the recursion tree', 'Recursion tree used instead of the Master Theorem.', 'no-justification'],
      ['c4', 0, '', 'Not applicable to the method used.', null],
      ['c5', 2, 'So T(n) = Theta(n log n).', 'Reaches the correct bound by another route.', 'correct-but-unexplained'],
    ],
    triage: 'unusual',
  },
];

let failures = 0;
const out = rows.map((r) => {
  const awards = r.awards.map(([criterionId, awarded, quote, note, errorTag]) => {
    const evidence = locate(r.text, quote);
    if (quote && evidence.length === 0) {
      console.error(`  ${r.id} ${criterionId}: quote not found verbatim -> ${JSON.stringify(quote.slice(0, 50))}`);
      failures++;
    }
    return { criterionId, awarded, max: MAX[criterionId], evidence, note, errorTag };
  });
  return {
    id: r.id,
    order: r.order,
    label: `Student ${r.order}`,
    text: r.text,
    wordCount: r.text.split(/\s+/).filter(Boolean).length,
    facultyMark: r.facultyMark,
    normMark: awards.reduce((s, a) => s + a.awarded, 0),
    awards,
    triage: r.triage,
    _truth: {
      covers: awards.filter((a) => a.awarded === a.max).map((a) => a.criterionId),
      base: awards.reduce((s, a) => s + a.awarded, 0),
      style: r.style,
    },
  };
});

if (failures) {
  console.error(`\n${failures} quote(s) did not match. Fix the quotes; nothing written.`);
  process.exit(1);
}

fs.writeFileSync(path.join(ROOT, 'fixtures/fake-10.json'), JSON.stringify(out, null, 2));
const spans = out.flatMap((s) => s.awards).filter((a) => a.evidence.length).length;
console.log(`Wrote fixtures/fake-10.json — ${out.length} scripts, ${spans} located evidence spans, 0 failures.`);
