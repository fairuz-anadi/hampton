// NORM — the You page. Dev 2.
//
// Drop-in for Dev 3: `<YouPage scripts={data.scripts} />`. Ships its own styles so it renders
// correctly the moment it is mounted; if you want it on your tokens, delete the <style> tag and
// map the CSS variables in lib/you-page-css.ts to yours. Do not restyle by editing this file —
// the standalone preview reads the same stylesheet, and they need to stay identical.
//
// Every number on this page comes from lib/discovery.ts. No fetch, no API key, no network.

'use client';

import { drift, lengthEffect, similarPairs, misconceptions } from '../../lib/insights/discovery';
import { driftChartData, driftChartSVG } from '../../lib/insights/drift-chart';
import { YOU_PAGE_CSS } from '../../lib/insights/you-page-css';
import type { Script, Finding } from '../../lib/types';

const signed = (n: number, dp = 1) => (n >= 0 ? '+' : '') + n.toFixed(dp);

/** The scripts a finding was drawn from. Every claim on this page names its evidence. */
function ScriptRefs({ ids, prefix }: { ids: string[]; prefix?: string }) {
  const shown = ids.slice(0, 10);
  return (
    <div className="scripts">
      {prefix}
      {shown.map((id) => (
        <code key={id}>{id}</code>
      ))}
      {ids.length > shown.length ? ` +${ids.length - shown.length} more` : null}
    </div>
  );
}

function DriftCard({ finding }: { finding: Finding }) {
  const d = driftChartData(finding);
  return (
    <section className="card hero">
      <span className="kind">Marking drift</span>
      <h2>{finding.headline}</h2>
      <p className="detail">{finding.detail}</p>
      {d ? (
        <>
          <div className="legend">
            <span>
              <i className="s1" />
              earlier scripts
            </span>
            <span>
              <i className="s2" />
              later scripts
            </span>
            <span style={{ color: 'var(--text-muted)' }}>each dot is one script</span>
          </div>
          {/* Our own generated SVG string — shared with the standalone preview so the
              projector shows exactly what was tested. No user input reaches this. */}
          <div dangerouslySetInnerHTML={{ __html: driftChartSVG(d) }} />
          <details>
            <summary>Show the numbers as a table</summary>
            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Scripts</th>
                  <th>Average vs standard</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Earlier</td>
                  <td>{d.points.filter((p) => p.x < d.cut).length}</td>
                  <td>{signed(d.earlyMean, 2)}</td>
                </tr>
                <tr>
                  <td>Later</td>
                  <td>{d.points.filter((p) => p.x >= d.cut).length}</td>
                  <td>{signed(d.lateMean, 2)}</td>
                </tr>
              </tbody>
            </table>
          </details>
        </>
      ) : null}
    </section>
  );
}

function LengthCard({ finding }: { finding: Finding }) {
  return (
    <section className="card">
      <span className="kind">Answer length</span>
      <h2>{finding.headline}</h2>
      <p className="detail">{finding.detail}</p>
      <ScriptRefs ids={finding.scriptIds} prefix={`Based on ${finding.scriptIds.length} long answers: `} />
    </section>
  );
}

function PairsCard({ findings }: { findings: Finding[] }) {
  return (
    <section className="card">
      <span className="kind">Similar answers</span>
      <h2>
        {findings.length} pair{findings.length === 1 ? '' : 's'} of similar answers were marked differently
      </h2>
      <p className="detail">
        These answers cover the same ground but received different marks. Worth opening side by side —
        one may contain something the other does not.
      </p>
      <ul className="pairs">
        {findings.map((f) => (
          <li key={f.scriptIds.join('-')}>
            {f.headline}
            <div className="why">{f.detail}</div>
            <ScriptRefs ids={f.scriptIds} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * The empty state is not a fallback, it is a feature. If the marking was clean, saying so is
 * the honest answer — and being willing to say it is what makes the other three findings
 * worth believing.
 */
function NothingFound() {
  return (
    <section className="card empty">
      <h2>Nothing worth flagging in this session</h2>
      <p>
        NORM checked for marking drift, an answer-length effect, and similar answers marked
        differently. None of them showed up above the level you would expect from ordinary
        variation, so there is nothing to report.
      </p>
    </section>
  );
}

export default function YouPage({ scripts }: { scripts: Script[] }) {
  const driftFinding = drift(scripts);
  const lengthFinding = lengthEffect(scripts);
  const pairs = similarPairs(scripts);
  const patterns = (driftFinding ? 1 : 0) + (lengthFinding ? 1 : 0) + (pairs.length ? 1 : 0);
  const shared = misconceptions(scripts);

  return (
    <div className="wrap">
      <style dangerouslySetInnerHTML={{ __html: YOU_PAGE_CSS }} />

      <header className="page">
        <p className="eyebrow">NORM · You</p>
        <h1>What happened while you were marking</h1>
        <p className="sub">
          {scripts.length} scripts, one question. NORM re-marked every script against the guide you
          approved, then looked at how your own marks moved.
        </p>
      </header>

      <div className="chips">
        <div className="chip">
          <b>{scripts.length}</b>
          <span>scripts marked</span>
        </div>
        <div className="chip">
          <b>{patterns}</b>
          <span>pattern{patterns === 1 ? '' : 's'} found</span>
        </div>
        <div className="chip">
          <b>{pairs.length}</b>
          <span>pair{pairs.length === 1 ? '' : 's'} to review</span>
        </div>
        <div className="chip">
          <b>{shared.length}</b>
          <span>shared mistakes</span>
        </div>
      </div>

      {patterns === 0 ? (
        <NothingFound />
      ) : (
        <>
          {driftFinding ? <DriftCard finding={driftFinding} /> : null}
          {lengthFinding ? <LengthCard finding={lengthFinding} /> : null}
          {pairs.length ? <PairsCard findings={pairs} /> : null}
        </>
      )}

      <footer className="note">
        NORM&rsquo;s marks are not claimed to be correct — only consistent. Everything above measures
        your marking against one fixed standard, so a shift means the standard you applied moved, not
        that any single mark was wrong.
      </footer>
    </div>
  );
}
