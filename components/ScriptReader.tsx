import type { Script } from '@/lib/types';

interface Props {
  script: Script;
  /** Highlight only this criterion's evidence; others dim to a dotted underline. */
  focus?: string | null;
}

interface Span {
  start: number;
  end: number;
  criterionId: string;
}

/**
 * The student's answer with the marker's evidence showing.
 *
 * Offsets were computed when the script was marked, by finding the model's
 * quote in this exact text — so a highlight either sits on the words that
 * earned the marks or is absent. There is no third case.
 */
export default function ScriptReader({ script, focus = null }: Props) {
  const spans: Span[] = script.awards
    .flatMap((a) => a.evidence.map(([start, end]) => ({ start, end, criterionId: a.criterionId })))
    .filter((s) => s.start >= 0 && s.end <= script.text.length && s.end > s.start)
    .sort((a, b) => a.start - b.start);

  // Evidence for two criteria can quote the same sentence; keep the first and
  // drop what overlaps it rather than nesting <mark> inside <mark>.
  const kept: Span[] = [];
  for (const s of spans) {
    if (kept.length && s.start < kept[kept.length - 1].end) continue;
    kept.push(s);
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  kept.forEach((s, i) => {
    if (s.start > cursor) parts.push(script.text.slice(cursor, s.start));
    parts.push(
      <mark key={`${s.criterionId}-${i}`} data-dim={focus !== null && focus !== s.criterionId}>
        {script.text.slice(s.start, s.end)}
      </mark>
    );
    cursor = s.end;
  });

  if (cursor < script.text.length) parts.push(script.text.slice(cursor));

  return <div className="reader">{parts}</div>;
}
