// Markable — the planted effects (Dev 1).
//
// Faculty marks are computed here, never by the model. If the model assigned
// them we could not guarantee the drift step exists, and the demo rests on it.
// Both generate-seed.mjs and replant.mjs use this, so there is one definition.

export const PLANT = {
  seed: 20260906,
  driftAfter: 25,        // marking gets stricter from script 26
  generosityEarly: 1.8,  // partial-credit answers, scripts 1-25
  generosityLate: 1.2,   // partial-credit answers, scripts 26-50
  lengthThreshold: 150,  // words. Set from the real distribution: the generated
                         // concise answers average ~43 words and the verbose
                         // ones ~161, so 150 is where the two actually separate.
  lengthBonus: 1.3,      // verbose answers marked higher at the SAME coverage
  inconsistentPairs: 4,  // identical coverage, forced 2.5 mark gap
  pairGap: 2.5,
};

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const roundHalf = (n) => Math.round(n * 2) / 2;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/**
 * Sets facultyMark on every script and forces a few inconsistent pairs.
 * Mutates in place and returns the pairs it planted.
 *
 * A full-mark answer gets no generosity — you cannot mark someone above the
 * total, and pretending otherwise would put a fake step in the data.
 */
export function applyPlantedEffects(scripts, totalMarks, plant = PLANT) {
  const rand = mulberry32(plant.seed ^ 0x9e37);

  for (const s of scripts) {
    const base = s._truth.base;
    if (base >= totalMarks) {
      s.facultyMark = totalMarks;
      continue;
    }
    const generosity = s.order <= plant.driftAfter ? plant.generosityEarly : plant.generosityLate;
    const lengthBonus = s.wordCount > plant.lengthThreshold ? plant.lengthBonus : 0;
    const noise = rand() - 0.5;
    s.facultyMark = clamp(roundHalf(base + generosity + lengthBonus + noise), 0, totalMarks);
  }

  // Identical rubric coverage, marks pushed apart. Centred on where the pair
  // already sits, so this does not fight the drift structure, and slid inward
  // if the window would run off either end of the mark range.
  const groups = new Map();
  for (const s of scripts) {
    const key = s._truth.covers.join('|');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }

  const planted = [];
  const half = plant.pairGap / 2;
  for (const [key, members] of groups) {
    if (planted.length >= plant.inconsistentPairs) break;
    if (members.length < 2 || members[0]._truth.base >= totalMarks) continue;

    const a = members[0];
    const b = members[members.length - 1];
    let mid = (a.facultyMark + b.facultyMark) / 2;
    mid = clamp(mid, half, totalMarks - half); // keep both ends inside 0..total

    a.facultyMark = roundHalf(mid + half);
    b.facultyMark = roundHalf(mid - half);
    planted.push({ a: a.id, b: b.id, gap: a.facultyMark - b.facultyMark, covers: key.split('|') });
  }

  return planted;
}
