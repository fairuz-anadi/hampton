import Link from 'next/link';
import { SCRIPTS, CRITERIA, QUESTION, scriptById, awardNote } from '@/lib/data';
import { findCommonErrors } from '@/lib/insights';
import AskMarkable from '@/components/AskMarkable';

export const metadata = { title: 'Class · Markable' };

export default function ClassPage() {
  const errors = findCommonErrors(SCRIPTS);
  const marks = SCRIPTS.map((s) => s.normMark ?? 0);
  const mean = marks.reduce((a, b) => a + b, 0) / marks.length;

  return (
    <div className="stack">
      <div className="page-head">
        <div className="eyebrow">{QUESTION.paper}</div>
        <h1>What the class struggled with</h1>
        <p className="lede">
          Not &ldquo;students found recursion hard&rdquo;. These are specific steps a specific number of students
          missed, grouped from the reason recorded against each lost mark — and every one opens the scripts behind it.
        </p>
      </div>

      <section className="panel">
        <div className="panel-body">
          <div className="stat-row">
            <div>
              <div className="stat-label">Scripts</div>
              <div className="stat-value">{SCRIPTS.length}</div>
            </div>
            <div>
              <div className="stat-label">Mean mark</div>
              <div className="stat-value">{mean.toFixed(1)}<span style={{ color: 'var(--faint)', fontSize: 24 }}>/{QUESTION.totalMarks}</span></div>
            </div>
            <div>
              <div className="stat-label">Patterns found</div>
              <div className="stat-value">{errors.length}</div>
            </div>
          </div>
        </div>
      </section>

      <AskMarkable />

      {errors.map((e, i) => {
        const criteriaHit = e.criterionIds
          .map((id) => CRITERIA.find((c) => c.id === id)?.label)
          .filter(Boolean)
          .join(', ');

        return (
          <section className="panel" key={e.tag}>
            <div className="panel-head">
              <h2>
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 15, color: 'var(--faint)', marginRight: 14 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                {e.label}
              </h2>
              <span className="pill pill-review">{e.count} students</span>
            </div>
            <div className="panel-body stack">
              <p className="finding-detail">
                <strong>{e.count} of {SCRIPTS.length}</strong> students lost marks here, on{' '}
                {criteriaHit || 'this criterion'}.
              </p>

              <details>
                <summary style={{ cursor: 'pointer', color: 'var(--accent)', fontSize: 22, fontWeight: 500, padding: '6px 0' }}>
                  Show the {e.count} scripts
                </summary>
                <div className="table-wrap" style={{ marginTop: 12 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th className="num">Marked</th>
                        <th>What was said</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {e.scriptIds.map((id) => {
                        const s = scriptById(id);
                        if (!s) return null;
                        const award = s.awards.find((a) => a.errorTag === e.tag);
                        return (
                          <tr key={id}>
                            <td>{s.label}</td>
                            <td className="num mark mark-faculty">{s.facultyMark}</td>
                            <td style={{ maxWidth: '34ch' }}>{award ? awardNote(award) : ''}</td>
                            <td>
                              <Link className="btn btn-ghost btn-sm" href={`/student?id=${id}`} style={{ textDecoration: 'none' }}>
                                Open
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>
          </section>
        );
      })}

      {errors.length === 0 && (
        <section className="panel">
          <div className="empty">No mistake was made by enough students to call it a pattern.</div>
        </section>
      )}

      <section className="panel">
        <div className="panel-head">
          <h3>Before you re-teach any of it</h3>
        </div>
        <div className="panel-body stack">
          <p className="hedge">
            One of these patterns may not be a teaching problem at all. Markable checks whether the students who
            understood everything else still got it wrong — and if they did, the question is the thing to fix.
          </p>
          <div className="row">
            <Link href="/questions" className="btn" style={{ textDecoration: 'none' }}>
              Check the question first
            </Link>
            <Link href="/improve" className="btn btn-ghost" style={{ textDecoration: 'none' }}>
              What happens next
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
