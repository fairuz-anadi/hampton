// NORM — shared types. Agreed 0:15. Change only by agreement in the room.
//
// Ownership boundary (do not cross):
//   Dev 1  scripts/**  prompts/**  data/**
//   Dev 2  app/you/**  lib/insights/**
//   Dev 3  app/grade/**  app/student/**  components/**  styles/**

export type CriterionId = string;

export interface Criterion {
  id: CriterionId;
  label: string;      // "Identifies a, b and f(n)"
  marks: number;      // 2
  expects: string;    // what a full-mark answer must contain
}

export interface Rubric {
  questionId: string;
  totalMarks: number;
  criteria: Criterion[];
  approved: boolean;  // nothing marks until this is true
}

/** Short, groupable error label. Fixed vocabulary — the marking prompt may
 *  only emit one of these, or null. Free text does not group. */
export type ErrorTag =
  | 'wrong-case-selected'
  | 'missed-regularity-check'
  | 'arithmetic-slip'
  | 'no-justification'
  | 'misidentified-parameters'
  | 'incomplete-working'
  | 'correct-but-unexplained'
  | null;

export interface Award {
  criterionId: CriterionId;
  awarded: number;
  max: number;
  /** Character offsets into Script.text. Computed in JS from an exact quote
   *  returned by the model — never asked for directly. [] when nothing matched. */
  evidence: [number, number][];
  note: string;       // one line the faculty can read
  errorTag: ErrorTag;
}

export type Triage = 'clear' | 'review' | 'unusual';

export interface Script {
  id: string;
  /** Marking sequence, 1-based. Set once at intake, NEVER re-sorted.
   *  Every drift number is a function of this. */
  order: number;
  label: string;      // "Student 18" — no real names
  text: string;
  wordCount: number;
  facultyMark: number | null;
  normMark: number | null;
  awards: Award[];
  triage: Triage;
}

export interface Finding {
  kind: 'drift' | 'length' | 'similar-pair';
  headline: string;   // hedged: "possible", "worth reviewing" — never "detected bias"
  detail: string;     // must contain the real numbers
  scriptIds: string[];
  series?: { x: number; y: number }[];
}
