import type { Rubric } from '@/lib/types'

export const sampleRubric: Rubric = {
  totalMarks: 10,
  approved: false,
  criteria: [
    { id: 'identify', label: 'Correct approach', marks: 3, expects: 'Identifies a, b and f(n).' },
    { id: 'case', label: 'Base case', marks: 3, expects: 'Compares f(n) with n^(log_b a).' },
    { id: 'conclude', label: 'Conclusion', marks: 4, expects: 'States the correct asymptotic bound.' }
  ]
}
