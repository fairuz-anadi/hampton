import Link from 'next/link';
import { SCRIPTS, CRITERIA, QUESTION } from '@/lib/data';
import { buildActions, AREA_COPY, type ActionArea } from '@/lib/actions';

export const metadata = { title: 'Improve · Markable' };

const ORDER: ActionArea[] = ['teaching', 'assessment', 'marking'];

export default function ImprovePage() {
  const actions = buildActions(SCRIPTS, CRITERIA, QUESTION.totalMarks);

  return (
    <div className="stack">
      <div className="page-head">
        <div className="eyebrow">What to do with all of it</div>
        <h1>What happens next</h1>
        <p className="lede">
          Everything Markable found, turned into things you could actually do — each one carrying the number it came
          from, so you can decide whether it is worth your time.
        </p>
      </div>

      <section className="panel">
        <div className="panel-body">
          <div className="stat-row">
            <div>
              <div className="stat-label">Things to consider</div>
              <div className="stat-value">{actions.length}</div>
            </div>
            {ORDER.map((area) => (
              <div key={area}>
                <div className="stat-label">{area}</div>
                <div className="stat-value">{actions.filter((a) => a.area === area).length}</div>
              </div>
            ))}
          </div>
          <p className="hedge" style={{ marginTop: 22 }}>
            There is nothing here that Markable did not measure. When a check found nothing, it produced no advice —
            a page of suggestions padded out with things nobody verified is worse than a short one.
          </p>
        </div>
      </section>

      {ORDER.map((area) => {
        const group = actions.filter((a) => a.area === area);
        if (group.length === 0) return null;

        return (
          <section className="panel" key={area}>
            <div className="panel-head">
              <h2>{AREA_COPY[area].title}</h2>
              <span className="pill pill-quiet">{group.length}</span>
            </div>
            <div className="panel-body">
              <p className="hedge" style={{ marginBottom: 10 }}>{AREA_COPY[area].blurb}</p>

              {group.map((a) => (
                <div className="action" key={a.id}>
                  <p className="action-finding">{a.finding}</p>
                  <p className="action-do">{a.suggestion}</p>
                  <div className="action-side">
                    <span className="pill pill-review">{a.weightLabel}</span>
                    <Link href={a.href} className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
                      {a.hrefLabel}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {actions.length === 0 && (
        <section className="panel">
          <div className="empty">
            Nothing was found that Markable is willing to turn into advice. That is a result, not an empty page.
          </div>
        </section>
      )}

      <section className="panel">
        <div className="panel-head">
          <h3>Keep the standard</h3>
        </div>
        <div className="panel-body stack">
          <p className="hedge">
            The guide you approved is the part of this session worth carrying forward. It is on the standards page,
            with how each criterion actually performed against 50 real answers.
          </p>
          <div className="row">
            <Link href="/history" className="btn" style={{ textDecoration: 'none' }}>
              Open the marking standard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
