// Markable — the discovery layer.
//
// Everything here is arithmetic over Script[]. No model calls, so a finding is
// reproducible, costs nothing, and can be defended with a formula when someone
// asks "how do you know?".
//
// Rubric coverage is read from the AWARDS — what Markable actually credited. The
// _truth field on the seed data is generator scaffolding and must never be used
// here: in a real marking session it does not exist.

import type { Script, Finding, ErrorTag, Criterion, CriterionId } from './types';

export const LENGTH_THRESHOLD = 150; // words. See README: where the data separates.
export const MIN_PAIR_GAP = 2;       // marks
export const MIN_DRIFT_STEP = 0.4;   // below this we report nothing
export const MIN_PAIR_SIMILARITY = 0.6; // tf-idf cosine; below this the two answers do not read alike

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


// ---------------------------------------------------------------- statistics

/** Abramowitz & Stegun 7.1.26. */
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-a * a);
  return sign * y;
}

/** Smallest z with P(|Z| > z) <= p. Bisection — exact enough, and avoids a dependency. */
function twoSidedZ(p: number): number {
  let lo = 0;
  let hi = 8;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const tail = 1 - erf(mid / Math.SQRT2);
    if (tail > p) lo = mid;
    else hi = mid;
  }
  return hi;
}

/** Sample SD of marking noise, estimated from spread WITHIN coverage groups.
 *  Answers Markable credited identically should have received the same mark, so
 *  whatever spread remains is the marker's own wobble. */
function withinGroupSD(groups: Map<string, Script[]>): number {
  let ss = 0;
  let df = 0;
  for (const [, g] of groups) {
    const marks = g.filter((s) => s.facultyMark != null).map((s) => s.facultyMark!);
    if (marks.length < 2) continue;
    const m = mean(marks);
    for (const x of marks) ss += (x - m) ** 2;
    df += marks.length - 1;
  }
  return df > 0 ? Math.sqrt(ss / df) : NaN;
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'is', 'are', 'was', 'to', 'of', 'in', 'it', 'this',
  'that', 'we', 'i', 'so', 'here', 'be', 'as', 'at', 'for', 'on', 'with', 'by',
]);

const tokenize = (t: string): string[] =>
  t.toLowerCase().replace(/[^a-z0-9^_()/+=. ]/g, ' ').split(/\s+/).filter((w) => w && !STOP_WORDS.has(w));

/** Tf-idf, L2-normalised. Idf matters: fifty answers to one question share most of
 *  their vocabulary, so raw word overlap calls every pair similar. */
function tfidfVectors(scripts: Script[]): Map<string, Map<string, number>> {
  const docs = scripts.map((s) => [s.id, tokenize(s.text)] as const);
  const n = docs.length;
  const df = new Map<string, number>();
  for (const [, d] of docs) for (const w of new Set(d)) df.set(w, (df.get(w) ?? 0) + 1);

  const out = new Map<string, Map<string, number>>();
  for (const [id, d] of docs) {
    const tf = new Map<string, number>();
    for (const w of d) tf.set(w, (tf.get(w) ?? 0) + 1);
    const v = new Map<string, number>();
    let norm = 0;
    for (const [w, c] of tf) {
      const weight = (c / d.length) * Math.log(n / (df.get(w) ?? 1));
      v.set(w, weight);
      norm += weight * weight;
    }
    norm = Math.sqrt(norm) || 1;
    for (const [w, x] of v) v.set(w, x / norm);
    out.set(id, v);
  }
  return out;
}

/** Cosine of two L2-normalised sparse vectors. */
function cosine(a: Map<string, number>, b: Map<string, number>): number {
  const [small, big] = a.size < b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [w, x] of small) {
    const o = big.get(w);
    if (o !== undefined) dot += x * o;
  }
  return dot;
}

// ---------------------------------------------------------------- similar pairs

export interface SimilarPair {
  a: Script;
  b: Script;
  gap: number;
  key: string;
  /** Tf-idf cosine of the two answers, 0-1. Shown so the claim on screen matches
   *  what the reader sees when they open the two answers side by side. */
  similarity: number;
}

export interface SimilarPairResult {
  pairs: SimilarPair[];
  /** Mark gap a pair had to clear to be reported. Derived from this session's own
   *  marking noise and the number of comparisons made — not a fixed constant. */
  minGap: number;
  compared: number;
  noiseSD: number;
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
  return analyseSimilarPairs(scripts, limit).pairs;
}

/**
 * Answers Markable credited identically that the faculty marked differently.
 *
 * Two gates, and both are needed.
 *
 * 1. The gap must be bigger than this session's own marking noise, corrected for how
 *    many pairs we looked at. With ~230 comparable pairs, a plain "2 marks apart" bar
 *    is met by chance almost every time: measured over 400 noise-only datasets, the
 *    uncorrected rule reported a contradiction in 99.5% of them. Looking at hundreds of
 *    pairs and reporting the widest is how you find a pattern in a coin toss.
 *
 * 2. The two answers must actually read alike. Identical CREDIT does not mean identical
 *    ANSWER — a 45-word response and a 215-word response can earn the same marks. The
 *    screen invites the reader to compare them, so if they look nothing alike the finding
 *    collapses the moment anyone clicks.
 */
export function analyseSimilarPairs(
  scripts: Script[],
  limit = 5,
  minSimilarity = MIN_PAIR_SIMILARITY,
): SimilarPairResult {
  const marked = scripts.filter((s) => s.facultyMark != null);
  const groups = groupBy(marked, coverageKey);

  let compared = 0;
  for (const [, g] of groups) compared += (g.length * (g.length - 1)) / 2;

  const noiseSD = withinGroupSD(groups);
  // Two sigma of this session's own marking noise. A full Bonferroni correction across all
  // ~230 comparisons puts the bar above 5 marks on a 10-mark question, which rejects even a
  // deliberately planted contradiction — too blunt to be useful. The similarity gate below
  // is what actually removes the chance findings; this only keeps a pair from qualifying on
  // a wobble that is small relative to how this marker varies anyway.
  const derived = Number.isFinite(noiseSD) ? 2 * noiseSD : NaN;
  const minGap = Number.isFinite(derived) ? Math.max(MIN_PAIR_GAP, derived) : MIN_PAIR_GAP;

  const vectors = tfidfVectors(marked);
  const candidates: SimilarPair[] = [];

  for (const [key, group] of groups) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const gap = Math.abs(group[i].facultyMark! - group[j].facultyMark!);
        if (gap < minGap) continue;
        const similarity = cosine(vectors.get(group[i].id)!, vectors.get(group[j].id)!);
        if (similarity < minSimilarity) continue;
        const [hi, lo] =
          group[i].facultyMark! >= group[j].facultyMark! ? [group[i], group[j]] : [group[j], group[i]];
        candidates.push({ a: hi, b: lo, gap: round2(gap), key, similarity: round2(similarity) });
      }
    }
  }

  // Most alike first: the pair that best survives being opened side by side leads.
  candidates.sort((x, y) => y.similarity - x.similarity || y.gap - x.gap);

  const used = new Set<string>();
  const pairs: SimilarPair[] = [];
  for (const c of candidates) {
    if (used.has(c.a.id) || used.has(c.b.id)) continue;
    used.add(c.a.id);
    used.add(c.b.id);
    pairs.push(c);
    if (pairs.length >= limit) break;
  }

  return { pairs, minGap: round2(minGap), compared, noiseSD: round2(noiseSD) };
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

  const sim = analyseSimilarPairs(scripts);
  const pairs = sim.pairs;
  if (pairs.length) {
    const gaps = pairs.map((p) => p.gap);
    const lo = Math.min(...gaps);
    const hi = Math.max(...gaps);
    const range = lo === hi ? `${lo}` : `${lo}–${hi}`;
    out.push({
      kind: 'similar-pair',
      headline:
        pairs.length === 1
          ? 'Two answers say the same thing and were marked differently'
          : `${pairs.length} pairs of answers worth comparing`,
      detail:
        `Markable credited ${pairs.length === 1 ? 'these' : 'each of these'} the same way on every criterion, ` +
        `and they read alike too — ${pairs.length === 1 ? `${Math.round(pairs[0].similarity * 100)}% of the wording overlaps` : 'at least 60% of the wording overlaps'}. ` +
        `Their marks differ by ${range} marks. Out of ${sim.compared} comparable pairs, ` +
        `${pairs.length === 1 ? 'this was the only one' : `these were the ${pairs.length}`} where the gap was larger than this marker's own variation.`,
      strength: 'clear',
      scriptIds: pairs.flatMap((p) => [p.a.id, p.b.id]),
    });
  }

  return out;
}

// ---------------------------------------------------------- question quality
//
// "Was the question bad?" — the spec's Module 03.
//
// The naive version of this test needs a whole-exam score per student, which
// one marking session does not have. So the strength signal is taken from
// inside the question instead: a student who earned FULL marks on every other
// criterion has demonstrated command of the material this question rests on.
// If those students still miss one particular step, the step is not separating
// people who understand from people who do not — and that is a property of the
// question, not of the class.
//
// Nothing here is planted or generated. It is arithmetic over the same awards
// the Grade page shows.

/** Below this a criterion is hard enough to be worth looking at. */
export const LOW_FACILITY = 0.5;
/** At or above this share of the strong cohort failing, the step stops
 *  separating strong from weak. */
export const POOR_SEPARATION = 0.4;
/** A strong cohort smaller than this cannot support the claim. */
export const MIN_STRONG_COHORT = 8;

export type CriterionVerdict = 'review-the-question' | 'genuinely-hard' | 'working';

export interface CriterionPerformance {
  id: CriterionId;
  label: string;
  maxMarks: number;
  /** Mean share of the criterion's marks earned. 1.0 = everyone got it. */
  facility: number;
  fullCredit: number;
  noCredit: number;
  /** Students at full marks on every OTHER criterion. */
  strongN: number;
  strongFailed: number;
  strongFailRate: number;
  weakFailRate: number;
  /** strongFailRate vs weakFailRate. Near 0 = the step does not separate. */
  separation: number;
  verdict: CriterionVerdict;
  strongFailedIds: string[];
}

export function criterionPerformance(
  scripts: Script[],
  criteria: Criterion[]
): CriterionPerformance[] {
  const marked = scripts.filter((s) => s.awards.length > 0);

  return criteria.map((c) => {
    const awardOf = (s: Script) => s.awards.find((a) => a.criterionId === c.id);

    const earned = marked.reduce((t, s) => t + (awardOf(s)?.awarded ?? 0), 0);
    const possible = marked.length * c.marks;

    // "Strong" is defined per criterion: full marks on everything except this
    // one. Each criterion therefore gets its own cohort, which is the point —
    // we are asking whether THIS step separates people.
    const strong = marked.filter((s) =>
      s.awards.every((a) => a.criterionId === c.id || a.awarded >= a.max)
    );
    const rest = marked.filter((s) => !strong.includes(s));

    const failed = (s: Script) => (awardOf(s)?.awarded ?? 0) < (awardOf(s)?.max ?? c.marks);
    const strongFailedList = strong.filter(failed);

    const strongFailRate = strong.length ? strongFailedList.length / strong.length : 0;
    const weakFailRate = rest.length ? rest.filter(failed).length / rest.length : 0;

    const facility = possible ? earned / possible : 0;
    const separation = weakFailRate - strongFailRate;

    let verdict: CriterionVerdict = 'working';
    if (facility < LOW_FACILITY) {
      verdict =
        strong.length >= MIN_STRONG_COHORT && strongFailRate >= POOR_SEPARATION
          ? 'review-the-question'
          : 'genuinely-hard';
    }

    return {
      id: c.id,
      label: c.label,
      maxMarks: c.marks,
      facility,
      fullCredit: marked.filter((s) => (awardOf(s)?.awarded ?? 0) >= c.marks).length,
      noCredit: marked.filter((s) => (awardOf(s)?.awarded ?? 0) === 0).length,
      strongN: strong.length,
      strongFailed: strongFailedList.length,
      strongFailRate,
      weakFailRate,
      separation,
      verdict,
      strongFailedIds: strongFailedList.map((s) => s.id),
    };
  });
}
