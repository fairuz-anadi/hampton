import Link from 'next/link';
import StandardExport from '@/components/StandardExport';
import { SCRIPTS, CRITERIA, QUESTION, MARKING_RUN } from '@/lib/data';
import { criterionPerformance } from '@/lib/insights';

export const metadata = { title: 'Standards · Markable' };

export default function HistoryPage() {
  const rows = criterionPerformance(SCRIPTS, CRITERIA);
  const perf = (id: string) => rows.find((r) => r.id === id);

  // What is worth carrying forward is the guide plus how it actually behaved.
  // A rubric with no record of its own performance is just an opinion.
  const standard = {
    questionId: QUESTION.questionId,
    paper: QUESTION.paper,
    question: QUESTION.question,
    totalMarks: QUESTION.totalMarks,
    approvedBy: 'faculty',
    markedScripts: SCRIPTS.length,
    criteria: CRITERIA.map((c) => ({
      id: c.id,
      label: c.label,
      marks: c.marks,
      expects: c.expects,
      observed: {
        shareOfMarksEarned: Number((perf(c.id)?.facility ?? 0).toFixed(2)),
        fullCredit: perf(c.id)?.fullCredit ?? 0,
        noCredit: perf(c.id)?.noCredit ?? 0,
        verdict: perf(c.id)?.verdict ?? 'working',
      },
    })),
  };

  const json = JSON.stringify(standard, null, 2);

  return (
    <div className="stack">
      <div className="page-head">
        <div className="eyebrow">Marking standards</div>
        <h1>What to keep</h1>
        <p className="lede">
          The guide you approved, and what happened when it met 50 real answers. This is the part of a marking session
          that is worth more next semester than it was this one.
        </p>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>{QUESTION.paper}</h2>
          <span className="pill pill-clear">approved and used</span>
        </div>
        <div className="panel-body stack">
          <p className="finding-detail">{QUESTION.question}</p>
          <div className="stat-row">
            <div>
              <div className="stat-label">Scripts marked</div>
              <div className="stat-value">{SCRIPTS.length}</div>
            </div>
            <div>
              <div className="stat-label">Criteria</div>
              <div className="stat-value">{CRITERIA.length}</div>
            </div>
            <div>
              <div className="stat-label">Total marks</div>
              <div className="stat-value">{QUESTION.totalMarks}</div>
            </div>
            <div>
              <div className="stat-label">Marked with</div>
              <div className="stat-value" style={{ fontSize: 26 }}>{MARKING_RUN.model}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>The standard, and how it held</h2>
          <span className="pill pill-quiet">{CRITERIA.length} criteria</span>
        </div>
        <div className="panel-body">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Criterion</th>
                  <th className="num">Marks</th>
                  <th className="num">Earned</th>
                  <th>What a full-mark answer needs</th>
                </tr>
              </thead>
              <tbody>
                {CRITERIA.map((c) => {
                  const p = perf(c.id);
                  return (
                    <tr key={c.id}>
                      <td style={{ color: 'var(--ink)', fontWeight: 500 }}>{c.label}</td>
                      <td className="num mark">{c.marks}</td>
                      <td className="num mark mark-norm">{Math.round((p?.facility ?? 0) * 100)}%</td>
                      <td style={{ maxWidth: '38ch' }}>{c.expects}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Take it with you</h2>
        </div>
        <div className="panel-body stack">
          <p className="finding-detail">
            Reuse this next semester and Markable starts from a guide that has already been tested against real
            answers, instead of proposing a fresh one you have to check from scratch.
          </p>
          <StandardExport json={json} filename={`markable-${QUESTION.questionId}-standard.json`} />
          <p className="hedge">
            One session is recorded, this one. Markable keeps no database — the standard lives in the file you take
            away, which is also the only copy anybody can quietly change without you noticing.
          </p>
          <div className="row">
            <Link href="/grade" className="btn btn-ghost" style={{ textDecoration: 'none' }}>
              Back to the session
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
