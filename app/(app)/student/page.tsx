import Link from 'next/link';
import ScriptReader from '@/components/ScriptReader';
import { SCRIPTS, CRITERIA, QUESTION, scriptById } from '@/lib/data';

export const metadata = { title: 'Your result · Markable' };

export default async function StudentPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const script = (id && scriptById(id)) || SCRIPTS.find((s) => (s.normMark ?? 0) < QUESTION.totalMarks) || SCRIPTS[0];

  const earned = script.awards.filter((a) => a.awarded > 0);
  const lost = script.awards.filter((a) => a.awarded < a.max);
  const lostMarks = lost.reduce((sum, a) => sum + (a.max - a.awarded), 0);
  const label = (cid: string) => CRITERIA.find((c) => c.id === cid)?.label ?? cid;

  const biggest = [...lost].sort((a, b) => b.max - b.awarded - (a.max - a.awarded))[0];

  return (
    <div className="stack">
      <div className="page-head">
        <div className="eyebrow">{QUESTION.paper} · Q4(b)</div>
        <h1>Your result</h1>
      </div>

      <section className="panel">
        <div className="panel-body stack">
          <div className="row" style={{ alignItems: 'baseline', gap: 14 }}>
            <span className="mark-big">{script.normMark}</span>
            <span style={{ color: 'var(--faint)', fontSize: 20 }}>/ {QUESTION.totalMarks}</span>
          </div>
          <p className="lede">
            {lostMarks === 0
              ? 'Full marks — every part of the marking guide is met in your answer.'
              : biggest
                ? `You were credited for ${earned.length} of the ${script.awards.length} things this question asks for. Most of what you lost was on ${label(biggest.criterionId).toLowerCase()}.`
                : ''}
          </p>
        </div>
      </section>

      <div className="two-col">
        <section className="panel">
          <div className="panel-head">
            <h2>What you got right</h2>
            <span className="pill pill-clear">{earned.reduce((s, a) => s + a.awarded, 0)} marks</span>
          </div>
          <div className="panel-body">
            {earned.length === 0 ? (
              <div className="empty">No criteria were met on this answer.</div>
            ) : (
              <div className="criteria">
                {earned.map((a) => (
                  <div className="criterion" key={a.criterionId}>
                    <div className="criterion-label">
                      <span className="tick">✓</span>
                      {label(a.criterionId)}
                    </div>
                    <div className="criterion-mark">
                      {a.awarded}/{a.max}
                    </div>
                    <div className="criterion-note">{a.note}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Where the marks went</h2>
            <span className="pill pill-unusual">−{lostMarks} marks</span>
          </div>
          <div className="panel-body">
            {lost.length === 0 ? (
              <div className="empty">Nothing lost.</div>
            ) : (
              <div className="criteria">
                {lost.map((a) => (
                  <div className="criterion" key={a.criterionId}>
                    <div className="criterion-label">
                      <span className={a.awarded > 0 ? 'part' : 'cross'}>{a.awarded > 0 ? '±' : '✕'}</span>
                      {label(a.criterionId)}
                    </div>
                    <div className="criterion-mark">−{a.max - a.awarded}</div>
                    <div className="criterion-note">
                      {a.note} <span style={{ color: 'var(--faint)' }}>Expected: {CRITERIA.find((c) => c.id === a.criterionId)?.expects}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>Your answer, with what was credited</h2>
          <span className="pill pill-quiet">{script.wordCount} words</span>
        </div>
        <div className="panel-body stack">
          <ScriptReader script={script} />
          <p className="hedge">
            Highlighted text is what earned marks against the guide your examiner approved before marking began. If you
            think a mark is wrong, quote the highlighted line — your examiner sees exactly this.
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>Look at another script</h3>
        </div>
        <div className="panel-body">
          <div className="row">
            {SCRIPTS.slice(0, 12).map((s) => (
              <Link
                key={s.id}
                href={`/student?id=${s.id}`}
                className="btn btn-ghost btn-sm"
                style={{ textDecoration: 'none', borderColor: s.id === script.id ? 'var(--ink)' : undefined }}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
