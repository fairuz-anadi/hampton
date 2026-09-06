import Link from 'next/link';
import { SCRIPTS, CRITERIA, QUESTION, scriptById } from '@/lib/data';
import { criterionPerformance, POOR_SEPARATION, MIN_STRONG_COHORT } from '@/lib/insights';

export const metadata = { title: 'Questions · Markable' };

const VERDICT = {
  'review-the-question': { pill: 'pill-unusual', word: 'worth reviewing' },
  'genuinely-hard': { pill: 'pill-review', word: 'hard, but working' },
  working: { pill: 'pill-clear', word: 'working' },
} as const;

function barColour(facility: number) {
  if (facility < 0.3) return 'var(--critical)';
  if (facility < 0.6) return 'var(--faculty)';
  return 'var(--good)';
}

export default function QuestionsPage() {
  const rows = criterionPerformance(SCRIPTS, CRITERIA);
  const flagged = rows.filter((r) => r.verdict === 'review-the-question');
  const hardest = [...rows].sort((a, b) => a.facility - b.facility)[0];

  return (
    <div className="stack">
      <div className="page-head">
        <div className="eyebrow">{QUESTION.paper} · Q4(b)</div>
        <h1>Was the question the problem?</h1>
        <p className="lede">
          A low mark can mean the class did not understand the material, or it can mean the question did not ask
          clearly for what it wanted. These are not the same problem, and they have opposite fixes.
        </p>
      </div>

      {/* ------------------------------------------------------- the answer */}
      <section className="panel">
        <div className="panel-head">
          <h2>{flagged.length > 0 ? 'One step is worth reviewing' : 'Nothing here needs rewriting'}</h2>
          <span className={`pill ${flagged.length ? 'pill-unusual' : 'pill-clear'}`}>
            {flagged.length} of {rows.length} steps flagged
          </span>
        </div>
        <div className="panel-body stack">
          {flagged.length === 0 ? (
            <p className="finding-detail">
              Every step of this question separated the answers that understood the material from the ones that did
              not. Where students lost marks, the strongest answers did not lose them.
            </p>
          ) : (
            flagged.map((r) => (
              <div key={r.id} className="stack" style={{ gap: 22 }}>
                <p className="finding-detail">
                  <strong>{r.strongFailed} of the {r.strongN} students</strong> who earned full marks on{' '}
                  <em>every other part</em> of this question still missed{' '}
                  <strong>{r.label.toLowerCase()}</strong>.
                </p>
                <p className="finding-detail">
                  Those students proved they could do everything else this question asks. That{' '}
                  <strong>{Math.round(r.strongFailRate * 100)}%</strong> of them missed this one step anyway does not
                  look like a class that failed to understand the material — it looks like a step nobody knew was
                  being asked for.
                </p>
                <p className="hedge">
                  It is not that the step separates nobody: {Math.round(r.weakFailRate * 100)}% of the weaker answers
                  missed it too, so it does sort the pile a little. The reason it is flagged is that missing it has
                  become the normal outcome even for the answers that got everything else right, and a step almost
                  everyone fails is not carrying the {r.maxMarks} marks it was given.
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* -------------------------------------------------- the breakdown */}
      <section className="panel">
        <div className="panel-head">
          <h2>Where the question held, step by step</h2>
          <span className="pill pill-quiet">share of marks earned</span>
        </div>
        <div className="panel-body">
          {rows.map((r) => (
            <div className="verdict" key={r.id}>
              <div className="verdict-head">
                <span className="verdict-name">{r.label}</span>
                <span className="row" style={{ gap: 14 }}>
                  <span className="mark" style={{ fontSize: 'var(--t-h3)', color: barColour(r.facility) }}>
                    {Math.round(r.facility * 100)}%
                  </span>
                  <span className={`pill ${VERDICT[r.verdict].pill}`}>{VERDICT[r.verdict].word}</span>
                </span>
              </div>

              <div className="facility-track">
                <div
                  className="facility-fill"
                  style={{ width: `${Math.max(r.facility * 100, 1.5)}%`, background: barColour(r.facility) }}
                />
              </div>

              <p className="hedge" style={{ marginTop: 18, borderLeftColor: barColour(r.facility) }}>
                {r.fullCredit} of {SCRIPTS.length} answers earned all {r.maxMarks} marks here, {r.noCredit} earned
                none.{' '}
                {r.strongN >= MIN_STRONG_COHORT ? (
                  <>
                    Among the {r.strongN} answers that were perfect everywhere else, {r.strongFailed} missed this
                    step
                    {r.strongFailed === 0
                      ? ' — so it separates cleanly.'
                      : r.strongFailRate >= POOR_SEPARATION
                        ? ' — which is why it is flagged.'
                        : ' — few enough that it is still telling answers apart.'}
                  </>
                ) : (
                  <>
                    Only {r.strongN} answers were perfect on every other step, which is too few to say anything about
                    whether this one separates them. Nothing is claimed here.
                  </>
                )}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------ the scripts */}
      {flagged.map((r) => (
        <section className="panel" key={`ev-${r.id}`}>
          <div className="panel-head">
            <h2>The {r.strongFailed} answers behind that</h2>
            <span className="pill pill-review">perfect everywhere else</span>
          </div>
          <div className="panel-body stack">
            <p className="finding-detail">
              Every student below scored {QUESTION.totalMarks - r.maxMarks} out of{' '}
              {QUESTION.totalMarks - r.maxMarks} on the rest of the question. Read two or three and decide whether
              they failed to understand {r.label.toLowerCase()}, or were never told it was wanted.
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th className="num">Marked</th>
                    <th className="num">Words</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {r.strongFailedIds.map((id) => {
                    const s = scriptById(id);
                    if (!s) return null;
                    return (
                      <tr key={id}>
                        <td>{s.label}</td>
                        <td className="num mark mark-faculty">{s.facultyMark}</td>
                        <td className="num" style={{ color: 'var(--faint)' }}>{s.wordCount}</td>
                        <td>
                          <Link className="btn btn-ghost btn-sm" href={`/student?id=${id}`} style={{ textDecoration: 'none' }}>
                            Read it
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ))}

      {/* --------------------------------------------------------- method */}
      <section className="panel">
        <div className="panel-head">
          <h3>How this was worked out</h3>
        </div>
        <div className="panel-body stack">
          <p className="hedge">
            The usual way to ask this compares a question against a student&rsquo;s score on the whole paper. One
            marking session does not have that, so Markable takes the strength signal from inside the question
            instead: a student at full marks on every other step has shown they can do the work this step sits on.
          </p>
          <p className="hedge">
            A step is flagged when students earn under half its marks <em>and</em> at least{' '}
            {Math.round(POOR_SEPARATION * 100)}% of that strong group miss it too. Hard is fine — the hardest step
            here, {hardest.label.toLowerCase()}, is meant to be hard. A step that the strongest answers also miss is
            a different thing, and it is the only kind Markable will ask you to look at.
          </p>
          <div className="row">
            <Link href="/improve" className="btn" style={{ textDecoration: 'none' }}>
              What to do about it
            </Link>
            <Link href="/class" className="btn btn-ghost" style={{ textDecoration: 'none' }}>
              What the class got wrong
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
