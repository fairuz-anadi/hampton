import Link from 'next/link'
import rawScripts from '@/data/fake-10.json'
import type { Script } from '@/lib/types'
import { AppShell } from '../components/AppShell'

const scripts = rawScripts as unknown as Script[]
const firstHalf = scripts.slice(0, 5).reduce((sum, item) => sum + item.facultyMark - item.normMark, 0) / 5
const secondHalf = scripts.slice(5).reduce((sum, item) => sum + item.facultyMark - item.normMark, 0) / 5

export default function YouPage() {
  return <AppShell active="you"><section className="page-head"><div><p className="eyebrow">Your marking patterns</p><h1>Worth a closer look.</h1><p className="lede">These are prompts for review, not verdicts. Each is traceable to the scripts behind it.</p></div></section><section className="findings"><article className="finding hero-finding"><p className="eyebrow">Marking order</p><h2>Later scripts were marked {Math.abs(firstHalf - secondHalf).toFixed(1)} marks lower than earlier ones.</h2><p>Across this sample, the mean faculty-to-NORM difference changed from {firstHalf.toFixed(1)} in the first half to {secondHalf.toFixed(1)} in the second. That may be worth reviewing.</p><div className="spark" aria-label="Residual mark trend">{scripts.map(item => <i key={item.id} style={{ height: `${18 + (item.facultyMark - item.normMark + 1) * 20}%` }} />)}</div><Link href="/">Review the scripts →</Link></article><article className="finding"><p className="eyebrow">Answer length</p><h2>Check whether length shaped the mark.</h2><p>Compare scripts at the same rubric coverage before drawing a conclusion. NORM keeps the evidence and criterion awards visible for that review.</p><Link href="/">Compare evidence →</Link></article><article className="finding"><p className="eyebrow">Similar answers</p><h2>Similar reasoning can still receive different marks.</h2><p>Scripts 01 and 06 use the same key comparison, yet their faculty marks differ by one. Inspect the criterion evidence before changing anything.</p><Link href="/">Open Script 01 →</Link></article></section></AppShell>
}
