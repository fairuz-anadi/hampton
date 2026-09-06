'use client'

import { useState } from 'react'
import rawScripts from '@/data/fake-10.json'
import { sampleRubric } from '@/data/rubric'
import type { Script, Triage } from '@/lib/types'
import { AppShell } from './components/AppShell'
import { ScriptReader } from './components/ScriptReader'

const scripts = rawScripts as unknown as Script[]
const triageOrder: Triage[] = ['clear', 'review', 'unusual']

export default function GradePage() {
  const [loaded, setLoaded] = useState(false); const [approved, setApproved] = useState(sampleRubric.approved); const [selected, setSelected] = useState(scripts[0].id)
  const script = scripts.find(item => item.id === selected) ?? scripts[0]
  const counts = triageOrder.map(kind => [kind, scripts.filter(item => item.triage === kind).length] as const)
  return <AppShell active="grade"><section className="page-head"><div><p className="eyebrow">Marking audit</p><h1>One question.<br />Every mark explained.</h1><p className="lede">Review evidence criterion by criterion, then see where a decision deserves another look.</p></div><button className="primary" onClick={() => setLoaded(true)}>{loaded ? 'Sample exam loaded' : 'Load sample exam'}</button></section>
    {loaded && <><section className="rubric panel"><div><p className="eyebrow">Proposed marking guide</p><h2>Master Theorem · 10 marks</h2></div><div className="criteria">{sampleRubric.criteria.map(criterion => <div key={criterion.id}><strong>{criterion.label}</strong><span>{criterion.expects}</span><b>{criterion.marks}</b></div>)}</div><button className={approved ? 'approved' : 'secondary'} onClick={() => setApproved(true)}>{approved ? 'Approved' : 'Approve guide'}</button></section>
      <section className="triage" aria-label="Triage counts">{counts.map(([kind, count]) => <div className={`count ${kind}`} key={kind}><b>{count}</b><span>{kind === 'clear' ? 'clear' : kind === 'review' ? 'worth a second look' : 'unusual'}</span></div>)}</section>
      <section className="workbench"><aside className="script-list"><div><p className="eyebrow">Scripts</p><span>{scripts.length} marked answers</span></div>{scripts.map(item => <button key={item.id} onClick={() => setSelected(item.id)} className={item.id === selected ? 'selected' : ''}><span>{item.label}</span><b>{item.normMark}/10</b><i className={item.triage} /></button>)}</aside><div><ScriptReader script={script} /><div className="awards panel">{sampleRubric.criteria.map(criterion => { const award = script.awards.find(item => item.criterionId === criterion.id)!; return <div key={criterion.id}><span>{criterion.label}</span><strong>{award.awarded}/{award.max}</strong><small>{award.errorTag ?? 'Evidence found in answer'}</small></div> })}</div></div></section></>}
    {!loaded && <section className="empty panel"><span>01</span><div><h2>Start with a prepared exam</h2><p>Fifty already-marked scripts are represented by this local sample. No upload, account, or live grading run is required.</p></div></section>}
  </AppShell>
}
