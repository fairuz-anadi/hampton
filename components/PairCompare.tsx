'use client';

import { useState } from 'react';
import type { Script, Criterion } from '@/lib/types';
import ScriptReader from './ScriptReader';

interface Pair {
  a: Script;
  b: Script;
  gap: number;
}

export default function PairCompare({ pairs, criteria }: { pairs: Pair[]; criteria: Criterion[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="stack">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Marked higher</th>
              <th>Marked lower</th>
              <th className="num">Gap</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {pairs.map((p) => {
              const id = `${p.a.id}-${p.b.id}`;
              return (
                <tr key={id}>
                  <td>
                    {p.a.label} <span className="mark mark-faculty">{p.a.facultyMark}</span>{' '}
                    <span style={{ color: 'var(--faint)' }}>· script {p.a.order}</span>
                  </td>
                  <td>
                    {p.b.label} <span className="mark mark-faculty">{p.b.facultyMark}</span>{' '}
                    <span style={{ color: 'var(--faint)' }}>· script {p.b.order}</span>
                  </td>
                  <td className="num mark">{p.gap}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => setOpen(open === id ? null : id)}>
                      {open === id ? 'Hide' : 'Compare'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pairs.map((p) => {
        const id = `${p.a.id}-${p.b.id}`;
        if (open !== id) return null;
        return (
          <div className="two-col" key={id}>
            {[p.a, p.b].map((s) => (
              <div className="panel" key={s.id}>
                <div className="panel-head">
                  <h3>
                    {s.label} <span style={{ color: 'var(--faint)', fontWeight: 400 }}>· script {s.order}</span>
                  </h3>
                  <span className="mark mark-faculty">{s.facultyMark}</span>
                </div>
                <div className="panel-body stack">
                  <ScriptReader script={s} />
                  <div className="criteria">
                    {s.awards.map((a) => (
                      <div className="criterion" key={a.criterionId}>
                        <div className="criterion-label">
                          <span className={a.awarded >= a.max ? 'tick' : a.awarded > 0 ? 'part' : 'cross'}>
                            {a.awarded >= a.max ? '✓' : a.awarded > 0 ? '±' : '✕'}
                          </span>
                          {criteria.find((c) => c.id === a.criterionId)?.label ?? a.criterionId}
                        </div>
                        <div className="criterion-mark">
                          {a.awarded}/{a.max}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="hedge">{s.wordCount} words</p>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
