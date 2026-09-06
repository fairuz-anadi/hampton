'use client';

import { useState, useMemo } from 'react';
import type { Script, Criterion } from '@/lib/types';
import ScriptReader from './ScriptReader';

interface Props {
  question: { paper: string; question: string; totalMarks: number };
  criteria: Criterion[];
  scripts: Script[];
  markingRun: { model: string; scripts: number; seconds: number };
}

type Phase = 'intake' | 'proposing' | 'guide' | 'marking' | 'done';

export default function GradeSession({ question, criteria, scripts, markingRun }: Props) {
  const [phase, setPhase] = useState<Phase>('intake');
  const [rubric, setRubric] = useState<Criterion[]>(criteria);
  const [source, setSource] = useState<'live' | 'fallback' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'clear' | 'review' | 'unusual'>('all');

  const total = rubric.reduce((sum, c) => sum + (Number(c.marks) || 0), 0);
  const balanced = total === question.totalMarks;

  const counts = useMemo(
    () => ({
      clear: scripts.filter((s) => s.triage === 'clear').length,
      review: scripts.filter((s) => s.triage === 'review').length,
      unusual: scripts.filter((s) => s.triage === 'unusual').length,
    }),
    [scripts]
  );

  const visible = filter === 'all' ? scripts : scripts.filter((s) => s.triage === filter);
  const current = selected ? scripts.find((s) => s.id === selected) ?? null : null;

  async function propose() {
    setPhase('proposing');
    setError(null);
    try {
      const res = await fetch('/api/rubric', { method: 'POST' });
      const data = await res.json();
      setRubric(data.criteria);
      setSource(data.source);
      if (data.source === 'fallback') setError(data.reason ?? 'Model unavailable — showing the stored guide.');
    } catch {
      setRubric(criteria);
      setSource('fallback');
      setError('Could not reach the model. Showing the stored guide instead.');
    }
    setPhase('guide');
  }

  function approve() {
    setPhase('marking');
    setProgress(0);
    const started = Date.now();
    const span = 1400;
    const tick = setInterval(() => {
      const pct = Math.min(1, (Date.now() - started) / span);
      setProgress(pct);
      if (pct >= 1) {
        clearInterval(tick);
        setPhase('done');
      }
    }, 40);
  }

  function editCriterion(id: string, patch: Partial<Criterion>) {
    setRubric((r) => r.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  return (
    <div className="stack">
      <div className="page-head">
        <div className="eyebrow">{question.paper}</div>
        <h1>One marking session</h1>
        <p className="lede">{question.question}</p>
      </div>

      {/* ---------------------------------------------------------- step 1 */}
      <section className="panel">
        <div className="panel-head">
          <h2>The marking guide</h2>
          {phase === 'intake' ? (
            <span className="pill pill-quiet">Not yet proposed</span>
          ) : phase === 'guide' ? (
            <span className="pill pill-review">Awaiting your approval</span>
          ) : phase === 'proposing' ? (
            <span className="pill pill-quiet">Reading the question…</span>
          ) : (
            <span className="pill pill-clear">Approved by you</span>
          )}
        </div>

        <div className="panel-body stack">
          {phase === 'intake' && (
            <>
              <p className="lede">
                Markable reads the question and its mark allocation and proposes criteria. Nothing is marked until you have
                read them and pressed approve.
              </p>
              <div className="row">
                <button className="btn" onClick={propose}>
                  Propose a marking guide
                </button>
                <span className="hedge">50 scripts loaded, already marked by the faculty.</span>
              </div>
            </>
          )}

          {phase === 'proposing' && <div className="empty">Reading the question and its mark allocation…</div>}

          {(phase === 'guide' || phase === 'marking' || phase === 'done') && (
            <>
              {error && <p className="hedge">{error}</p>}
              <div className="criteria">
                {rubric.map((c) => (
                  <div className="criterion" key={c.id}>
                    <div className="criterion-label">
                      {phase === 'guide' ? (
                        <input
                          type="text"
                          value={c.label}
                          aria-label={`Criterion ${c.id} label`}
                          onChange={(e) => editCriterion(c.id, { label: e.target.value })}
                        />
                      ) : (
                        c.label
                      )}
                    </div>
                    <div className="criterion-mark">
                      {phase === 'guide' ? (
                        <input
                          type="number"
                          min={0}
                          max={question.totalMarks}
                          step={0.5}
                          value={c.marks}
                          aria-label={`Marks for ${c.label}`}
                          style={{ width: 68 }}
                          onChange={(e) => editCriterion(c.id, { marks: Number(e.target.value) })}
                        />
                      ) : (
                        `${c.marks} marks`
                      )}
                    </div>
                    <div className="criterion-note">{c.expects}</div>
                  </div>
                ))}
              </div>

              {phase === 'guide' && (
                <div className="row">
                  <button className="btn" onClick={approve} disabled={!balanced}>
                    Approve marking guide
                  </button>
                  <span className={balanced ? 'hedge' : 'hedge'} style={{ borderColor: balanced ? undefined : 'var(--critical)' }}>
                    {balanced
                      ? `Adds up to ${total} of ${question.totalMarks} marks.`
                      : `Adds up to ${total}. It has to be ${question.totalMarks} before this can be approved.`}
                  </span>
                  {source === 'live' && <span className="pill pill-quiet">Proposed live</span>}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ---------------------------------------------------------- step 2 */}
      {phase === 'marking' && (
        <section className="panel">
          <div className="panel-body stack">
            <h2>Applying your approved guide to 50 scripts</h2>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${Math.round(progress * 100)}%`, background: 'var(--accent)' }} />
            </div>
            <p className="hedge num">{Math.round(progress * scripts.length)} of {scripts.length} marked</p>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------- step 3 */}
      {phase === 'done' && (
        <>
          <section className="panel">
            <div className="panel-head">
              <h2>What came back</h2>
              <span className="hedge" style={{ border: 0, padding: 0 }}>
                Marked with {markingRun.model}, {markingRun.scripts} scripts in {markingRun.seconds}s. Replayed here from
                that run.
              </span>
            </div>
            <div className="panel-body">
              <div className="stat-row">
                {(['clear', 'review', 'unusual'] as const).map((k) => (
                  <button
                    key={k}
                    className="btn-ghost btn btn-sm"
                    data-selected={filter === k}
                    onClick={() => setFilter(filter === k ? 'all' : k)}
                    style={{
                      borderColor: filter === k ? 'var(--ink)' : undefined,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 2,
                      minWidth: 130,
                    }}
                  >
                    <span className="stat-value">{counts[k]}</span>
                    <span className="stat-label">
                      {k === 'clear' ? 'straightforward' : k === 'review' ? 'worth a look' : 'unusual'}
                    </span>
                  </button>
                ))}
              </div>
              <p className="hedge" style={{ marginTop: 14 }}>
                &ldquo;Worth a look&rdquo; means Markable gave partial credit somewhere — a judgement call rather than a
                check. &ldquo;Unusual&rdquo; means the answer took a route your guide does not describe.
              </p>
            </div>
          </section>

          <div className="split">
            <section className="panel">
              <div className="panel-head">
                <h3>{filter === 'all' ? 'All scripts' : `${visible.length} ${filter}`}</h3>
                {filter !== 'all' && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setFilter('all')}>
                    Show all
                  </button>
                )}
              </div>
              <div className="table-wrap" style={{ maxHeight: 560, overflowY: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student</th>
                      <th className="num">You</th>
                      <th className="num">Markable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((s) => (
                      <tr
                        key={s.id}
                        className="clickable"
                        data-selected={selected === s.id}
                        onClick={() => {
                          setSelected(s.id);
                          setFocus(null);
                        }}
                      >
                        <td className="num" style={{ color: 'var(--faint)' }}>{s.order}</td>
                        <td>
                          {s.label}
                          {s.triage !== 'clear' && (
                            <span className={`pill pill-${s.triage}`} style={{ marginLeft: 8 }}>
                              {s.triage}
                            </span>
                          )}
                        </td>
                        <td className="num mark mark-faculty">{s.facultyMark}</td>
                        <td className="num mark mark-norm">{s.normMark}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="panel">
              {!current ? (
                <div className="empty">Choose a script to see why it got the marks it did.</div>
              ) : (
                <>
                  <div className="panel-head">
                    <h3>
                      {current.label} <span style={{ color: 'var(--faint)', fontWeight: 400 }}>· script {current.order}</span>
                    </h3>
                    <div className="row">
                      <span className="mark mark-norm">Markable {current.normMark}</span>
                      <span className="mark mark-faculty">You {current.facultyMark}</span>
                    </div>
                  </div>
                  <div className="panel-body stack">
                    <ScriptReader script={current} focus={focus} />
                    <div className="criteria">
                      {current.awards.map((a) => {
                        const c = rubric.find((x) => x.id === a.criterionId);
                        const state = a.awarded >= a.max ? 'tick' : a.awarded > 0 ? 'part' : 'cross';
                        return (
                          <div
                            className="criterion"
                            key={a.criterionId}
                            onMouseEnter={() => setFocus(a.criterionId)}
                            onMouseLeave={() => setFocus(null)}
                            style={{ cursor: a.evidence.length ? 'pointer' : 'default' }}
                          >
                            <div className="criterion-label">
                              <span className={state}>{state === 'tick' ? '✓' : state === 'part' ? '±' : '✕'}</span>
                              {c?.label ?? a.criterionId}
                            </div>
                            <div className="criterion-mark">
                              {a.awarded}/{a.max}
                            </div>
                            <div className="criterion-note">
                              {a.note}
                              {a.evidence.length === 0 && a.awarded === 0 && ' Nothing in the answer addresses this.'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <a href={`/student?id=${current.id}`} className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', textDecoration: 'none' }}>
                      See what this student is shown
                    </a>
                  </div>
                </>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
