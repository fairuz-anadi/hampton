'use client'

import { useState } from 'react'
import rawScripts from '@/data/fake-10.json'
import { sampleRubric } from '@/data/rubric'
import type { Script } from '@/lib/types'
import { AppShell } from '../components/AppShell'
import { ScriptReader } from '../components/ScriptReader'

const scripts = rawScripts as unknown as Script[]

export default function StudentPage() {
  const [scriptId, setScriptId] = useState('s03'); const script = scripts.find(item => item.id === scriptId) ?? scripts[2]
  const total = script.awards.reduce((sum, award) => sum + award.awarded, 0)
  return <AppShell active="student"><section className="student-head"><div><p className="eyebrow">Your result</p><h1>{total}<small>/10</small></h1><p className="lede">Your answer is strongest when it names the recurrence terms. The comparison step is where marks were lost.</p></div><label className="select-label">View a sample answer<select value={scriptId} onChange={event => setScriptId(event.target.value)}>{scripts.map(item => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label></section>
    <section className="student-grid"><div className="panel scorecard"><p className="eyebrow">Criterion by criterion</p>{sampleRubric.criteria.map(criterion => { const award = script.awards.find(item => item.criterionId === criterion.id)!; const lost = award.max - award.awarded; return <div key={criterion.id}><div><strong>{criterion.label}</strong><span>{award.awarded}/{award.max}</span></div><p>{lost ? `${lost} mark${lost > 1 ? 's' : ''} lost — ${award.errorTag ?? 'add a more explicit explanation.'}` : 'All marks awarded.'}</p><meter min="0" max={award.max} value={award.awarded} /></div> })}</div><ScriptReader script={script} /></section>
    <section className="next-step panel"><span>Next time</span><p>Show the comparison <strong>f(n) = n</strong> against <strong>n^(log_b a) = n</strong> before you name the Master Theorem case.</p></section>
  </AppShell>
}
