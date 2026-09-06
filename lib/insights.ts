// Markable — the discovery layer.
//
// Everything here is arithmetic over Script[]. No model calls, so a finding is
// reproducible, costs nothing, and can be defended with a formula when someone
// asks "how do you know?".
//
// Rubric coverage is read from the AWARDS — what Markable actually credited. The
// _truth field on the seed data is generator scaffolding and must never be used
// here: in a real marking session it does not exist.

import type { Script, Finding, ErrorTag } from './types';

export const LENGTH_THRESHOLD = 150; // words. See README: where the data separates.
export const MIN_PAIR_GAP = 2;       // marks
export const MIN_DRIFT_STEP = 0.4;   // below this we report nothing

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Per-criterion outcome, full / partial / none. Two answers with the same
 *  signature were credited the same way, whatever their wording. */
export function coverageKey(s: Script): string {
  return s.awards
    .map((a) => (a.awarded >= a.max ? 'F' : a.awarded > 0 ? 'P' : '-'))
    .join('');
}

export function residual(s: Script): number {
  if (s.facultyMark == null || s.normMark == null) return NaN;
  return s.facultyMark - s.normMark;
}

function groupBy<T>(items: T[], key: (t: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const it of items) {
    const k = key(it);
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(it);
  }
  return m;
}

// ---------------------------------------------------------------- drift

export interface Drift {
  earlyMean: number;
  lateMean: number;
  step: number;
  splitAt: number;
  earlyN: number;
  lateN: number;
  points: { x: number; y: number; id: string; late: boolean }[];
  significant: boolean;
}

/**
 * Did the marking standard move as the pile went down?
 *
 * Compares faculty marks against Markable's, in marking order. Full-mark answers
 * are excluded: you cannot mark someone above the total, so they cannot show
 * generosity and including them would flatten a real effect.
 */
export function detectDrift(scripts: Script[], totalMarks: number): Drift {
  const partial = scripts
    .filter((s) => s.normMark != null && s.facultyMark != null && s.normMark < totalMarks)
    .sort((a, b) => a.order - b.order);

  const splitAt = Math.round(scripts.length / 2);
  const early = partial.filter((s) => s.order <= splitAt);
  const late = partial.filter((s) => s.order > splitAt);

  const earlyMean = mean(early.map(residual));
  const lateMean = mean(late.map(residual));
  const step = earlyMean - lateMean;

  return {
    earlyMean: round2(earlyMean),
    lateMean: round2(lateMean),
    step: round2(step),
    splitAt,
    earlyN: early.length,
    lateN: late.length,
    points: partial.map((s) => ({ x: s.order, y: residual(s), id: s.id, late: s.order > splitAt })),
    significant: Number.isFinite(step) && step > MIN_DRIFT_STEP && early.length >= 5 && late.length >= 5,
  };
}

// ---------------------------------------------------------------- length

export interface LengthEffect {
  advantage: number;
  /** The same comparison with answers at the mark ceiling removed. A mark that
   *  cannot go higher cannot show a bonus, so if the effect only exists while
   *  those are included, it is a ceiling artefact and not a marking habit. */
  advantageExCeiling: number;
  ceilingN: number;
  groups: number;
  longN: number;
  shortN: number;
  longMean: number;
  shortMean: number;
  threshold: number;
  significant: boolean;
}

/**
 * Were longer answers marked higher for the same amount of correct work?
 *
 * The comparison happens INSIDE each coverage group, so "these answers earned
 * the same credit" is held fixed and only length varies. Comparing long and
 * short answers across the whole cohort would just rediscover that students who
 * know more write more.
 */
export function detectLengthEffect(scripts: Script[], totalMarks = 10): LengthEffect {
  function compare(rows: Script[]) {
    const groups = groupBy(rows, coverageKey);
    let weightedSum = 0;
    let weight = 0;
    let usable = 0;
    let longN = 0;
    let shortN = 0;
    const longMarks: number[] = [];
    const shortMarks: number[] = [];

    for (const [, group] of groups) {
      const long = group.filter((s) => s.wordCount > LENGTH_THRESHOLD);
      const short = group.filter((s) => s.wordCount <= LENGTH_THRESHOLD);
      if (!long.length || !short.length) continue;

      usable++;
      longN += long.length;
      shortN += short.length;
      longMarks.push(...long.map((s) => s.facultyMark!));
      shortMarks.push(...short.map((s) => s.facultyMark!));

      const gap = mean(long.map((s) => s.facultyMark!)) - mean(short.map((s) => s.facultyMark!));
      weightedSum += gap * group.length;
      weight += group.length;
    }

    return {
      advantage: weight ? weightedSum / weight : NaN,
      groups: usable,
      longN,
      shortN,
      longMean: mean(longMarks),
      shortMean: mean(shortMarks),
    };
  }

  const marked = scripts.filter((s) => s.facultyMark != null);
  const all = compare(marked);
  const belowCeiling = marked.filter((s) => s.facultyMark! < totalMarks);
  const clean = compare(belowCeiling);

  // Report only if the effect survives dropping answers that were already at
  // full marks. Otherwise what looks like a length habit is the mark ceiling.
  const agree =
    Number.isFinite(all.advantage) &&
    Number.isFinite(clean.advantage) &&
    Math.sign(all.advantage) === Math.sign(clean.advantage);

  return {
    advantage: round2(all.advantage),
    advantageExCeiling: round2(clean.advantage),
    ceilingN: marked.length - belowCeiling.length,
    groups: all.groups,
    longN: all.longN,
    shortN: all.shortN,
    longMean: round2(all.longMean),
    shortMean: round2(all.shortMean),
    threshold: LENGTH_THRESHOLD,
    significant: agree && Math.abs(all.advantage) >= 0.5 && Math.abs(clean.advantage) >= 0.4 && all.groups >= 3,
  };
}

// ---------------------------------------------------------------- similar pairs

export interface SimilarPair {
  a: Script;
  b: Script;
  gap: number;
  key: string;
}

/**
 * Answers Markable credited identically that the faculty marked differently.
 *
 * Deduplicated so each script appears at most once: inside a group of n
 * similarly-credited answers there are n(n-1)/2 raw combinations, and a screen
 * reporting all of them says "your marking is chaos" rather than "here are four
 * worth a second look".
 */
export function findSimilarPairs(scripts: Script[], limit = 5): SimilarPair[] {
  const groups = groupBy(scripts.filter((s) => s.facultyMark != null), coverageKey);
  const candidates: SimilarPair[] = [];

  for (const [key, group] of groups) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const gap = Math.abs(group[i].facultyMark! - group[j].facultyMark!);
        if (gap >= MIN_PAIR_GAP) {
          const [hi, lo] = group[i].facultyMark! >= group[j].facultyMark! ? [group[i], group[j]] : [group[j], group[i]];
          candidates.push({ a: hi, b: lo, gap: round2(gap), key });
        }
      }
    }
  }

  candidates.sort((x, y) => y.gap - x.gap);

  const used = new Set<string>();
  const picked: SimilarPair[] = [];
  for (const c of candidates) {
    if (used.has(c.a.id) || used.has(c.b.id)) continue;
    used.add(c.a.id);
    used.add(c.b.id);
    picked.push(c);
    if (picked.length >= limit) break;
  }
  return picked;
}

// ---------------------------------------------------------------- common errors

export interface CommonError {
  tag: NonNullable<ErrorTag>;
  label: string;
  count: number;
  criterionIds: string[];
  scriptIds: string[];
}

const ERROR_LABELS: Record<string, string> = {
  'wrong-case-selected': 'Chose the wrong Master Theorem case',
  'missed-regularity-check': 'Never verified the regularity condition',
  'arithmetic-slip': 'Arithmetic slip in the working',
  'no-justification': 'Reached a result without justifying it',
  'misidentified-parameters': 'Misidentified a, b or f(n)',
  'incomplete-working': 'Stopped part-way through',
  'correct-but-unexplained': 'Correct answer, reasoning not shown',
};

/** One mistake, many students. Grouped on the fixed tag vocabulary — free-text
 *  reasons never group, which is why the marking prompt constrains them. */
export function findCommonErrors(scripts: Script[], min = 3): CommonError[] {
  const byTag = new Map<string, { scripts: Set<string>; criteria: Set<string>; count: number }>();

  for (const s of scripts) {
    for (const a of s.awards) {
      if (!a.errorTag || a.awarded >= a.max) continue;
      if (!byTag.has(a.errorTag)) byTag.set(a.errorTag, { scripts: new Set(), criteria: new Set(), count: 0 });
      const e = byTag.get(a.errorTag)!;
      e.scripts.add(s.id);
      e.criteria.add(a.criterionId);
      e.count++;
    }
  }

  return [...byTag.entries()]
    .map(([tag, e]) => ({
      tag: tag as NonNullable<ErrorTag>,
      label: ERROR_LABELS[tag] ?? tag,
      count: e.scripts.size,
      criterionIds: [...e.criteria],
      scriptIds: [...e.scripts],
    }))
    .filter((e) => e.count >= min)
    .sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------- consistency

/** Share of similarly-credited answers marked within a mark of each other.
 *  Reported as a headline, so it has to be a number we can explain. */
export function consistencyScore(scripts: Script[]): { pct: number; compared: number; diverging: number } {
  const groups = groupBy(scripts.filter((s) => s.facultyMark != null), coverageKey);
  let compared = 0;
  let diverging = 0;

  for (const [, group] of groups) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        compared++;
        if (Math.abs(group[i].facultyMark! - group[j].facultyMark!) >= MIN_PAIR_GAP) diverging++;
      }
    }
  }
  return {
    pct: compared ? Math.round(((compared - diverging) / compared) * 100) : 100,
    compared,
    diverging,
  };
}

// ---------------------------------------------------------------- findings

/** Everything above, as the hedged sentences the You page shows. */
export function buildFindings(scripts: Script[], totalMarks: number): Finding[] {
  const out: Finding[] = [];

  const drift = detectDrift(scripts, totalMarks);
  if (drift.significant) {
    out.push({
      kind: 'drift',
      headline: `Your marking may have tightened after script ${drift.splitAt}`,
      detail: `Partial-credit answers before script ${drift.splitAt} were marked ${drift.earlyMean.toFixed(2)} above Markable's reading of the guide, and after it ${drift.lateMean.toFixed(2)} — a difference of ${drift.step.toFixed(2)} marks (n=${drift.earlyN} and n=${drift.lateN}).`,
      strength: drift.step >= 0.5 ? 'clear' : 'weak',
      scriptIds: scripts.map((s) => s.id),
      series: drift.points.map((p) => ({ x: p.x, y: p.y })),
    });
  }

  const len = detectLengthEffect(scripts, totalMarks);
  if (len.significant) {
    out.push({
      kind: 'length',
      headline: 'Longer answers scored higher for the same credited work',
      detail: `Across ${len.groups} groups of answers Markable credited identically, those over ${len.threshold} words averaged ${len.advantage.toFixed(2)} marks more (${len.longN} longer, ${len.shortN} shorter).`,
      strength: Math.abs(len.advantage) >= 0.8 ? 'clear' : 'weak',
      scriptIds: [],
    });
  }

  const pairs = findSimilarPairs(scripts);
  if (pairs.length) {
    out.push({
      kind: 'similar-pair',
      headline: `${pairs.length} pairs of answers worth comparing`,
      detail: `These answers were credited the same way against every criterion, but their marks differ by ${Math.min(...pairs.map((p) => p.gap))}–${Math.max(...pairs.map((p) => p.gap))} marks.`,
      strength: 'clear',
      scriptIds: pairs.flatMap((p) => [p.a.id, p.b.id]),
    });
  }

  return out;
}
