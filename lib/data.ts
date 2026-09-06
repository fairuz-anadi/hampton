// Markable — the marking session the app ships with.
//
// Read straight off the committed JSON. No database, no API key, nothing to
// fail on venue wifi: the marking already happened and this is its record.

import type { Script, Criterion } from './types';
import graded from '../data/graded-50.json';
import question from '../data/question.json';

export interface Question {
  questionId: string;
  paper: string;
  question: string;
  totalMarks: number;
  referenceCriteria: Criterion[];
}

export const QUESTION: Question = {
  questionId: question.questionId,
  paper: question.paper,
  question: question.question,
  totalMarks: question.totalMarks,
  referenceCriteria: question.referenceCriteria as Criterion[],
};

/** Marking order is data: sorted once, here, and never re-sorted downstream. */
export const SCRIPTS: Script[] = (graded as unknown as Script[])
  .slice()
  .sort((a, b) => a.order - b.order);

export const CRITERIA = QUESTION.referenceCriteria;

export function criterion(id: string): Criterion | undefined {
  return CRITERIA.find((c) => c.id === id);
}

export function scriptById(id: string): Script | undefined {
  return SCRIPTS.find((s) => s.id === id);
}

export function triageCounts(scripts: Script[] = SCRIPTS) {
  return {
    clear: scripts.filter((s) => s.triage === 'clear').length,
    review: scripts.filter((s) => s.triage === 'review').length,
    unusual: scripts.filter((s) => s.triage === 'unusual').length,
  };
}

/** When the shipped marking run happened, for the line under the results.
 *  Replaying a completed run is the honest thing to show; pretending the model
 *  is being called live is not. */
export const MARKING_RUN = {
  model: 'gpt-4o',
  scripts: SCRIPTS.length,
  seconds: 21,
};

/** What the marker recorded against one criterion.
 *
 *  24 of the 250 awards in the shipped run came back with no note — the model
 *  had nothing to say about a criterion the answer never went near. Rendering
 *  that as an empty line reads like the record is missing, which is the one
 *  impression a page defending a mark cannot afford. So the empty case states
 *  the only thing that is actually known: nothing in the answer addressed it. */
export function awardNote(award: { note: string; awarded: number; evidence: unknown[] }): string {
  if (award.note?.trim()) return award.note;
  if (award.awarded === 0 && award.evidence.length === 0) {
    return 'Nothing in the answer addresses this criterion.';
  }
  return 'No note was recorded against this criterion.';
}
