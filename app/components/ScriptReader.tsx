import type { Award, Script } from '@/lib/types'

function segment(text: string, awards: Award[]) {
  const ranges = awards.filter(({ evidence }) => evidence[1] > evidence[0]).map(({ evidence }) => evidence).sort((a, b) => a[0] - b[0])
  const pieces: React.ReactNode[] = []; let position = 0
  ranges.forEach(([start, end], i) => { if (start > position) pieces.push(text.slice(position, start)); pieces.push(<mark key={`${start}-${end}-${i}`}>{text.slice(start, end)}</mark>); position = Math.max(position, end) })
  if (position < text.length) pieces.push(text.slice(position)); return pieces
}

export function ScriptReader({ script }: { script: Script }) {
  return <article className="reader" aria-label={`${script.label}'s answer`}><div className="reader-meta"><span>{script.label}</span><span>Script {String(script.order).padStart(2, '0')}</span></div><p>{segment(script.text, script.awards)}</p><small>Highlighted passages are the evidence used for this mark.</small></article>
}
