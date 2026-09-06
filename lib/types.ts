export type Criterion = {
  id: string
  label: string
  marks: number
  expects: string
}

export type Rubric = {
  totalMarks: number
  criteria: Criterion[]
  approved: boolean
}

export type Award = {
  criterionId: string
  awarded: number
  max: number
  evidence: [number, number]
  errorTag?: string
}

export type Triage = 'clear' | 'review' | 'unusual'

export type Script = {
  id: string
  order: number
  label: string
  text: string
  wordCount: number
  facultyMark: number
  normMark: number
  awards: Award[]
  triage: Triage
}

export type Finding = {
  kind: 'drift' | 'length' | 'similar-pair'
  headline: string
  detail: string
  scriptIds: string[]
  series?: number[]
}
