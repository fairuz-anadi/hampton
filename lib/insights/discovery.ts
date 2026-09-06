// Markable — Discovery. Dev 2.
//
// Pure functions over Script[]. No React, no fetch, no API calls, no randomness.
// Everything here is deterministic and runs offline, so nothing on the You page
// can fail on venue wifi.
//
// The one rule that matters: if the data does not support a finding, return null.
// A discovery tool that always discovers something is a horoscope.

import type { Script, Finding } from '../types';

// ---------------------------------------------------------------- statistics

const mean = (v: number[]): number => v.reduce((a, b) => a + b, 0) / v.length;

const variance = (v: number[]): number => {
  if (v.length < 2) return 0;
  const m = mean(v);
  return v.reduce((a, x) => a + (x - m) ** 2, 0) / (v.length - 1);
};

/** Abramowitz & Stegun 7.1.26. Good to ~1e-7, far beyond what n=50 needs. */
function erf(x: number): number {
  const s = x < 0 ? -1 : 1;
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t *
      Math.exp(-a * a);
  return s * y;
}

const pFromT = (t: number): number => 2 * (1 - 0.5 * (1 + erf(Math.abs(t) / Math.SQRT2)));

/** Welch's t-test. Returns the difference of means, t, and a two-sided p. */
function welch(a: number[], b: number[]) {
  const se = Math.sqrt(variance(a) / a.length + variance(b) / b.length);
  const diff = mean(a) - mean(b);
  const t = se === 0 ? 0 : diff / se;
  return { diff, t, p: pFromT(t), nA: a.length, nB: b.length };
}

/** Ordinary least squares for y = a + b*x. Used only inside the length control. */
function ols(x: number[], y: number[]) {
  const mx = mean(x);
  const my = mean(y);
  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < x.length; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
  }
  const b = sxx === 0 ? 0 : sxy / sxx;
  return { a: my - b * mx, b };
}

/** Only scripts the faculty actually marked can contribute to a residual. */
const isMarked = (s: Script): boolean => s.facultyMark !== null && s.normMark !== null;
const residualOf = (s: Script): number => s.facultyMark! - s.normMark!;
const isLong = (s: Script): boolean => s.wordCount > LONG_WORDS;
const round1 = (x: number): number => Math.round(x * 10) / 10;

// ---------------------------------------------------------------- thresholds
//
// Two gates, not one. Significance alone is not enough: with 50 scripts a
// statistically real 0.2-mark wobble is still not worth a faculty member's time,
// and reporting it trains them to ignore us.

const LONG_WORDS = 150;      // matches data/planted-effects.json lengthThreshold
const ALPHA = 0.05;          // significance gate
const MIN_DRIFT = 0.4;       // marks — below this, not worth saying out loud
const MIN_LENGTH_GAP = 0.75; // marks
const SIM_THRESHOLD = 0.9;   // tf-idf cosine for "these are the same answer"
const MIN_PAIR_GAP = 2;      // marks between two near-identical answers

// ---------------------------------------------------------------- 1 · drift

/**
 * Did the marking standard move over the course of the session?
 *
 * Measured as residual (facultyMark - normMark) against marking order. Markable is not
 * claimed to be correct here, only *constant* — it is a fixed ruler, and drift is
 * movement against it.
 *
 * Length is centred out first. It is a confound we know about, and leaving its
 * variance in the test only costs power.
 */
export function drift(all: Script[]): Finding | null {
  // A script the faculty never marked has no residual, so it cannot speak to drift.
  const scripts = all.filter(isMarked);
  if (scripts.length < 12) return null;

  const ordered = [...scripts].sort((a, b) => a.order - b.order);

  // centre residuals within each length group
  const groups = new Map<boolean, number[]>();
  for (const s of ordered) {
    const k = isLong(s);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(residualOf(s));
  }
  const groupMean = new Map<boolean, number>();
  for (const [k, v] of groups) groupMean.set(k, mean(v));
  const adjusted = new Map<string, number>();
  for (const s of ordered) adjusted.set(s.id, residualOf(s) - groupMean.get(isLong(s))!);

  const cut = Math.floor(ordered.length / 2);
  const firstHalf = ordered.slice(0, cut);
  const secondHalf = ordered.slice(cut);
  const { diff, p } = welch(
    firstHalf.map((s) => adjusted.get(s.id)!),
    secondHalf.map((s) => adjusted.get(s.id)!),
  );

  if (p >= ALPHA || Math.abs(diff) < MIN_DRIFT) return null;

  // Report the raw means, which are what the chart shows and what the faculty recognises.
  const rawFirst = mean(firstHalf.map(residualOf));
  const rawSecond = mean(secondHalf.map(residualOf));
  const stricter = diff > 0;
  const at = secondHalf[0].order;

  return {
    kind: 'drift',
    headline: `Your marking may have shifted after script ${at}`,
    detail:
      `Scripts ${firstHalf[0].order}–${firstHalf[firstHalf.length - 1].order} were marked ` +
      `${round1(Math.abs(rawFirst - rawSecond))} marks ${stricter ? 'more generously' : 'more strictly'} ` +
      `than scripts ${at}–${secondHalf[secondHalf.length - 1].order}, at the same rubric coverage. ` +
      `This is a pattern worth reviewing, not a verdict — but the later scripts were held to a ` +
      `different standard than the earlier ones.`,
    scriptIds: secondHalf.map((s) => s.id),
    series: ordered.map((s) => ({ x: s.order, y: round1(residualOf(s)) })),
  };
}

// --------------------------------------------------------------- 2 · length

/**
 * Are longer answers scoring higher than shorter answers that earned the same rubric marks?
 *
 * Controlling for coverage is the entire claim. Without it this finding says only
 * "students who wrote more knew more", which is not news and not a problem.
 *
 * Uses Frisch–Waugh: partial out coverage from both sides, then regress. That is one
 * test rather than one per coverage band, which avoids fishing across bands until
 * something clears 0.05.
 */
export function lengthEffect(all: Script[]): Finding | null {
  const scripts = all.filter(isMarked);
  const long = scripts.filter(isLong);
  const short = scripts.filter((s) => !isLong(s));
  if (long.length < 5 || short.length < 5) return null;

  const x = scripts.map((s) => (isLong(s) ? 1 : 0));
  const y = scripts.map(residualOf);
  const z = scripts.map((s) => s.normMark!); // rubric coverage — the thing we hold constant

  const fx = ols(z, x);
  const fy = ols(z, y);
  const xr = z.map((zi, i) => x[i] - (fx.a + fx.b * zi));
  const yr = z.map((zi, i) => y[i] - (fy.a + fy.b * zi));

  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < xr.length; i++) {
    sxy += xr[i] * yr[i];
    sxx += xr[i] * xr[i];
  }
  if (sxx === 0) return null;

  const beta = sxy / sxx; // extra marks a long answer gets at equal coverage
  const df = scripts.length - 3;
  let ssr = 0;
  for (let i = 0; i < xr.length; i++) ssr += (yr[i] - beta * xr[i]) ** 2;
  const se = Math.sqrt(ssr / df / sxx);
  const p = pFromT(beta / se);

  if (p >= ALPHA || beta < MIN_LENGTH_GAP) return null; // one-directional: only flag rewarding length

  return {
    kind: 'length',
    headline: `Longer answers scored higher at the same rubric coverage`,
    detail:
      `Answers over ${LONG_WORDS} words scored about ${beta.toFixed(1)} marks higher than shorter ` +
      `answers that earned the same marking-guide credit (${long.length} long, ${short.length} short). ` +
      `Length and correctness are not the same thing here, so this may be worth a look — a longer ` +
      `answer can read as more complete without containing more correct reasoning.`,
    scriptIds: long.map((s) => s.id),
  };
}

// -------------------------------------------------- 3 · similar, marked apart

const STOP = new Set([
  'the', 'a', 'an', 'and', 'or', 'is', 'are', 'was', 'to', 'of', 'in', 'it', 'this',
  'that', 'we', 'i', 'so', 'we', 'here', 'be', 'as', 'at', 'for', 'on', 'with', 'by',
]);

const tokenize = (t: string): string[] =>
  t.toLowerCase().replace(/[^a-z0-9^_()/+=. ]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w));

/**
 * Tf-idf vectors, L2-normalised, one per script.
 *
 * Tf-idf rather than raw word overlap: fifty answers to one exam question share most of
 * their vocabulary, so a plain overlap score calls almost every pair in the cohort similar.
 * Idf pushes the weight onto the words that actually distinguish one answer from another.
 */
function tfidf(scripts: Script[]): Map<string, number>[] {
  const docs = scripts.map((s) => tokenize(s.text));
  const n = docs.length;
  const df = new Map<string, number>();
  for (const d of docs) for (const w of new Set(d)) df.set(w, (df.get(w) ?? 0) + 1);

  return docs.map((d) => {
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
    for (const [w, val] of v) v.set(w, val / norm);
    return v;
  });
}

/** Cosine of two L2-normalised sparse vectors — just the dot product. */
function cosine(a: Map<string, number>, b: Map<string, number>): number {
  const [small, big] = a.size < b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [w, val] of small) {
    const other = big.get(w);
    if (other !== undefined) dot += val * other;
  }
  return dot;
}

/**
 * Pairs of answers that say substantially the same thing but received different marks.
 *
 * Similarity comes from the TEXT; the contradiction comes from the MARKS. Scoring
 * similarity on the award vectors would be circular — the pairs we want are precisely
 * the ones whose awards disagree.
 */
export function similarPairs(all: Script[]): Finding[] {
  const scripts = all.filter(isMarked);
  const n = scripts.length;
  const vectors = tfidf(scripts);
  const hits: { gap: number; finding: Finding }[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const gap = Math.abs(scripts[i].facultyMark! - scripts[j].facultyMark!);
      if (gap < MIN_PAIR_GAP) continue;
      const sim = cosine(vectors[i], vectors[j]);
      if (sim < SIM_THRESHOLD) continue;
      const [hi, lo] =
        scripts[i].facultyMark! >= scripts[j].facultyMark! ? [scripts[i], scripts[j]] : [scripts[j], scripts[i]];
      hits.push({
        gap,
        finding: {
          kind: 'similar-pair',
          headline: `${hi.label} and ${lo.label} gave similar answers but were marked ${round1(gap)} marks apart`,
          detail:
            `These two answers cover the same points in nearly the same way (${Math.round(sim * 100)}% similar), ` +
            `but received ${hi.facultyMark} and ${lo.facultyMark}. Worth comparing side by side — one may ` +
            `contain something the other does not.`,
          scriptIds: [hi.id, lo.id],
        },
      });
    }
  }
  // widest disagreement first — that is the pair the faculty member should open
  return hits.sort((a, b) => b.gap - a.gap).map((h) => h.finding);
}

// ------------------------------------------------------ stretch · class page

export type Misconception = { tag: NonNullable<Script['awards'][number]['errorTag']>; count: number; scriptIds: string[] };

/** Group the marking guide's error tags. The Class page, if there is time for it. */
export function misconceptions(scripts: Script[], min = 3): Misconception[] {
  const byTag = new Map<NonNullable<Script['awards'][number]['errorTag']>, string[]>();
  for (const s of scripts) {
    for (const a of s.awards) {
      if (!a.errorTag || a.awarded === a.max) continue;
      if (!byTag.has(a.errorTag)) byTag.set(a.errorTag, []);
      byTag.get(a.errorTag)!.push(s.id);
    }
  }
  return [...byTag.entries()]
    .map(([tag, ids]) => ({ tag, count: ids.length, scriptIds: ids }))
    .filter((m) => m.count >= min)
    .sort((a, b) => b.count - a.count);
}

// ------------------------------------------------------------------ all

/** Everything the You page shows, in the order it shows it. Drift leads — it is the hero. */
export function discover(scripts: Script[]): Finding[] {
  const out: Finding[] = [];
  const d = drift(scripts);
  if (d) out.push(d);
  const l = lengthEffect(scripts);
  if (l) out.push(l);
  out.push(...similarPairs(scripts));
  return out;
}
