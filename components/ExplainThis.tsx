'use client';

import { useState } from 'react';

interface Props {
  scriptId: string;
  criterionId: string;
  criterionLabel: string;
}

/** One button per lost criterion. Closed by default: a student looking at a
 *  disappointing result should meet a short page, not five expanded lectures
 *  they did not ask for. */
export default function ExplainThis({ scriptId, criterionId, criterionLabel }: Props) {
  const [text, setText] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  async function explain() {
    if (text) {
      setOpen((o) => !o);
      return;
    }
    setBusy(true);
    setOpen(true);
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ scriptId, criterionId }),
      });
      const data = await res.json();
      setText(data.explanation);
    } catch {
      setText('Could not reach Markable just now. What the guide expects is written above.');
    }
    setBusy(false);
  }

  return (
    <div style={{ gridColumn: 1, marginTop: 14 }}>
      <button className="btn btn-ghost btn-sm" onClick={explain} aria-expanded={open}>
        {busy ? 'Working…' : open && text ? 'Hide the explanation' : 'Help me understand this'}
      </button>

      {open && (
        <div
          style={{
            marginTop: 16,
            padding: '22px 26px',
            borderRadius: 'var(--radius)',
            background: 'var(--surface-2)',
            border: '1px solid var(--rule)',
            maxWidth: 'var(--measure)',
          }}
        >
          <p className="stat-label" style={{ marginBottom: 10 }}>{criterionLabel}</p>
          <p style={{ color: 'var(--ink-soft)', whiteSpace: 'pre-wrap' }}>
            {busy ? 'Markable is writing an explanation…' : text}
          </p>
        </div>
      )}
    </div>
  );
}
