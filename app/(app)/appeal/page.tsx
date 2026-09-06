import Link from 'next/link';
import ScriptReader from '@/components/ScriptReader';
import { SCRIPTS, CRITERIA, QUESTION, scriptById, awardNote } from '@/lib/data';
import { detectDrift, coverageKey } from '@/lib/insights';

export const metadata = { title: 'The record behind a mark · Markable' };

export default async function AppealPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const script = (id && scriptById(id)) || SCRIPTS[0];

  const drift = detectDrift(SCRIPTS, QUESTION.totalMarks);
  const markedAfterShift = drift.significant && script.order > drift.splitAt;

  // "Why did they get more than me?" is the question this page exists to
  // answer, so the comparable answers are found the same way the You page
  // finds them: identical credit against every criterion.
  const peers = SCRIPTS.filter(
    (s) => s.id !== script.id && coverageKey(s) === coverageKey(script)
  ).sort((a, b) => (b.facultyMark ?? 0) - (a.facultyMark ?? 0));

  const label = (cid: string) => CRITERIA.find((c) => c.id === cid)?.label ?? cid;
  const expects = (cid: string) => CRITERIA.find((c) => c.id === cid)?.expects ?? '';

  return (
    <div className="stack">
      <div className="page-head">
        <div className="eyebrow">{QUESTION.paper} · {script.label} · script {script.order}</div>
        <h1>The record behind this mark</h1>
        <p className="lede">
          Everything you would need to explain this mark to the student who received it — the standard you approved
          before marking began, and what was found in their answer against it.
        </p>
      </div>

      <section className="panel">
        <div className="panel-body">
          <div className="stat-row">
            <div>
              <div className="stat-label">You marked</div>
              <div className="stat-value mark-faculty">{script.facultyMark}</div>
            </div>
            <div>
              <div className="stat-label">Against the guide</div>
              <div className="stat-value mark-norm">{script.normMark}</div>
            </div>
            <div>
              <div className="stat-label">Marked</div>
              <div className="stat-value">{script.order}<span style={{ color: 'var(--faint)', fontSize: 24 }}>/{SCRIPTS.length}</span></div>
            </div>
            <div>
              <div className="stat-label">Length</div>
              <div className="stat-value">{script.wordCount}<span style={{ color: 'var(--faint)', fontSize: 24 }}> words</span></div>
            </div>
          </div>

          {markedAfterShift && (
            <p className="hedge" style={{ marginTop: 24, borderLeftColor: 'var(--critical)' }}>
              Worth knowing before you answer: this script was marked at position {script.order}, after the point where
              your marking tightened by {drift.step.toFixed(2)} marks on partial credit. That does not make this mark
              wrong — but if the student compares themselves to someone marked early, this is the difference they
              found.
            </p>
          )}
        </div>
      </section>

      {/* ------------------------------------------------ criterion by criterion */}
      <section className="panel">
        <div className="panel-head">
          <h2>Criterion by criterion</h2>
          <span className="pill pill-quiet">the guide you approved</span>
        </div>
        <div className="panel-body">
          {script.awards.map((a) => {
            const quotes = a.evidence.map(([s, e]) => script.text.slice(s, e).trim()).filter(Boolean);
            const state = a.awarded >= a.max ? 'tick' : a.awarded > 0 ? 'part' : 'cross';

            return (
              <div className="verdict" key={a.criterionId}>
                <div className="verdict-head">
                  <span className="verdict-name">
                    <span className={state} style={{ marginRight: 12 }}>
                      {state === 'tick' ? '✓' : state === 'part' ? '±' : '✕'}
                    </span>
                    {label(a.criterionId)}
                  </span>
                  <span className="mark" style={{ fontSize: 'var(--t-h3)' }}>
                    {a.awarded} / {a.max}
                  </span>
                </div>

                <p className="hedge" style={{ marginTop: 16 }}>
                  <strong style={{ color: 'var(--ink)' }}>Required:</strong> {expects(a.criterionId)}
                </p>

                <p className="hedge" style={{ marginTop: 12 }}>
                  <strong style={{ color: 'var(--ink)' }}>Found in the answer:</strong>{' '}
                  {quotes.length ? (
                    quotes.map((q, i) => (
                      <span key={i}>
                        {i > 0 && ' … '}
                        <mark style={{ background: 'var(--highlight)', padding: '2px 4px', borderRadius: 3 }}>
                          {q}
                        </mark>
                      </span>
                    ))
                  ) : (
                    <em>nothing addressing this criterion</em>
                  )}
                </p>

                <p className="hedge" style={{ marginTop: 12 }}>
                  <strong style={{ color: 'var(--ink)' }}>Recorded:</strong> {awardNote(a)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ----------------------------------------------------------- peers */}
      <section className="panel">
        <div className="panel-head">
          <h2>&ldquo;Why did they get more than me?&rdquo;</h2>
          <span className="pill pill-quiet">{peers.length} credited identically</span>
        </div>
        <div className="panel-body stack">
          {peers.length === 0 ? (
            <p className="finding-detail">
              No other answer in this pile was credited the same way against every criterion, so there is no
              like-for-like comparison to answer with.
            </p>
          ) : (
            <>
              <p className="finding-detail">
                These answers met exactly the same criteria as {script.label}. Any difference in their marks is a
                judgement you made, not a difference the guide describes — which is the honest thing to say out loud
                if you are asked.
              </p>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th className="num">Marked</th>
                      <th className="num">Difference</th>
                      <th className="num">Words</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {peers.map((p) => {
                      const gap = (p.facultyMark ?? 0) - (script.facultyMark ?? 0);
                      return (
                        <tr key={p.id}>
                          <td>{p.label}</td>
                          <td className="num mark mark-faculty">{p.facultyMark}</td>
                          <td
                            className="num mark"
                            style={{ color: gap === 0 ? 'var(--faint)' : gap > 0 ? 'var(--critical)' : 'var(--good)' }}
                          >
                            {gap > 0 ? '+' : ''}{gap.toFixed(1)}
                          </td>
                          <td className="num" style={{ color: 'var(--faint)' }}>{p.wordCount}</td>
                          <td>
                            <Link className="btn btn-ghost btn-sm" href={`/appeal?id=${p.id}`} style={{ textDecoration: 'none' }}>
                              Open
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>The answer as it was read</h3>
          <span className="pill pill-quiet">{script.wordCount} words</span>
        </div>
        <div className="panel-body stack">
          <ScriptReader script={script} />
          <div className="row">
            <Link href={`/student?id=${script.id}`} className="btn btn-ghost" style={{ textDecoration: 'none' }}>
              See what the student is shown
            </Link>
            <Link href="/grade" className="btn btn-ghost" style={{ textDecoration: 'none' }}>
              Back to the session
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
