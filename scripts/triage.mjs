// NORM — triage (Dev 1).
//
// "How much should the faculty look at this one?" Asked directly, the model
// flags almost everything as review, which is useless as a filter. So we take
// only the one judgement a model is actually placed to make — "this answer uses
// a method my guide does not cover" — and derive the rest from the marking
// itself, where the rule is explainable and the same every run.

/**
 * @param {Array} awards        the per-criterion awards
 * @param {string} modelTriage  what the model said: clear | review | unusual
 */
export function deriveTriage(awards, modelTriage) {
  // The model's own flag survives: an answer that solves the problem by a route
  // the guide does not describe is exactly what a human should see.
  if (modelTriage === 'unusual') return 'unusual';

  // Partial credit is where marking is a judgement call rather than a check.
  const partial = awards.filter((a) => a.awarded > 0 && a.awarded < a.max).length;
  if (partial > 0) return 'review';

  // Marks awarded with nothing in the answer to point at. Should be rare —
  // if this fires often, the marking prompt is quoting loosely.
  const creditedWithoutEvidence = awards.filter((a) => a.awarded > 0 && a.evidence.length === 0).length;
  if (creditedWithoutEvidence > 0) return 'review';

  // Every criterion resolved to full marks or zero, each with something to
  // point at. Nothing to argue about.
  return 'clear';
}
