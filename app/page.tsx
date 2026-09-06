import Landing from '@/components/Landing';
import { SCRIPTS, QUESTION, CRITERIA } from '@/lib/data';
import { detectDrift, detectLengthEffect, findSimilarPairs, findCommonErrors } from '@/lib/insights';

export default function Home() {
  const drift = detectDrift(SCRIPTS, QUESTION.totalMarks);
  const length = detectLengthEffect(SCRIPTS, QUESTION.totalMarks);
  const pairs = findSimilarPairs(SCRIPTS, 5);
  const errors = findCommonErrors(SCRIPTS);

  // The hero card shows a real marked script, not an invented one.
  const hero =
    SCRIPTS.find((s) => s.normMark === 6 && s.awards.some((a) => a.awarded === 0)) ??
    SCRIPTS.find((s) => (s.normMark ?? 0) > 4 && (s.normMark ?? 0) < QUESTION.totalMarks) ??
    SCRIPTS[0];

  return (
    <Landing
      totalMarks={QUESTION.totalMarks}
      scripts={SCRIPTS.length}
      drift={{
        step: drift.step,
        earlyMean: drift.earlyMean,
        lateMean: drift.lateMean,
        splitAt: drift.splitAt,
        points: drift.points.map((p) => ({ x: p.x, y: p.y })),
      }}
      length={{ advantage: length.advantage, exCeiling: length.advantageExCeiling, ceilingN: length.ceilingN }}
      pairCount={pairs.length}
      topError={errors[0] ? { label: errors[0].label, count: errors[0].count } : null}
      hero={{
        mark: hero.normMark ?? 0,
        awards: hero.awards.map((a) => ({
          label: CRITERIA.find((c) => c.id === a.criterionId)?.label ?? a.criterionId,
          awarded: a.awarded,
          max: a.max,
        })),
      }}
    />
  );
}
