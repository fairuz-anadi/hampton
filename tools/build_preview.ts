// Builds a standalone preview of the You page from the real discovery output.
//
// This exists so Dev 2's work is visible and checkable before Dev 3's app is up. It runs the
// same functions the app will run, so if the preview is right, the page is right.
//
//   node tools/build_preview.ts
//   -> preview/you.html        (fake-50: three findings)
//   -> preview/you-flat.html   (flat-50: nothing found — the honesty check)

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { drift, lengthEffect, similarPairs, misconceptions } from '../lib/insights/discovery.ts';
import { driftChartData, driftChartSVG } from '../lib/insights/drift-chart.ts';
import { YOU_PAGE_CSS } from '../lib/insights/you-page-css.ts';
import type { Script, Finding } from '../lib/types.ts';

/** Dev 1 ships graded-50.json as a bare array; my fixtures wrap it. Accept either. */
const load = (f: string): Script[] => {
  const raw = JSON.parse(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'));
  return Array.isArray(raw) ? raw : raw.scripts;
};

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function driftCard(f: Finding): string {
  const d = driftChartData(f);
  return `
  <section class="card hero">
    <span class="kind">Marking drift</span>
    <h2>${esc(f.headline)}</h2>
    <p class="detail">${esc(f.detail)}</p>
    ${
      d
        ? `<div class="legend">
             <span><i class="s1"></i>earlier scripts</span>
             <span><i class="s2"></i>later scripts</span>
             <span style="color:var(--text-muted)">each dot is one script</span>
           </div>
           ${driftChartSVG(d)}
           <details>
             <summary>Show the numbers as a table</summary>
             <table>
               <thead><tr><th>Period</th><th>Scripts</th><th>Average vs standard</th></tr></thead>
               <tbody>
                 <tr><td>Earlier</td><td>${d.points.filter((p: {x:number;y:number}) => p.x < d.cut).length}</td><td>${d.earlyMean >= 0 ? '+' : ''}${d.earlyMean.toFixed(2)}</td></tr>
                 <tr><td>Later</td><td>${d.points.filter((p: {x:number;y:number}) => p.x >= d.cut).length}</td><td>${d.lateMean >= 0 ? '+' : ''}${d.lateMean.toFixed(2)}</td></tr>
               </tbody>
             </table>
           </details>`
        : ''
    }
  </section>`;
}

function lengthCard(f: Finding): string {
  return `
  <section class="card">
    <span class="kind">Answer length</span>
    <h2>${esc(f.headline)}</h2>
    <p class="detail">${esc(f.detail)}</p>
    <div class="scripts">Based on ${f.scriptIds.length} long answers: ${f.scriptIds
      .slice(0, 10)
      .map((id) => `<code>${esc(id)}</code>`)
      .join('')}${f.scriptIds.length > 10 ? ` +${f.scriptIds.length - 10} more` : ''}</div>
  </section>`;
}

function pairsCard(fs: Finding[]): string {
  return `
  <section class="card">
    <span class="kind">Similar answers</span>
    <h2>${fs.length} pair${fs.length === 1 ? '' : 's'} of similar answers were marked differently</h2>
    <p class="detail">These answers cover the same ground but received different marks. Worth opening side by side — one may contain something the other does not.</p>
    <ul class="pairs">
      ${fs
        .map(
          (f) => `<li>${esc(f.headline)}
            <div class="why">${esc(f.detail)}</div>
            <div class="scripts">${f.scriptIds.map((id) => `<code>${esc(id)}</code>`).join('')}</div>
          </li>`,
        )
        .join('')}
    </ul>
  </section>`;
}

function build(file: string, title: string): string {
  const scripts = load(file);
  const d = drift(scripts);
  const l = lengthEffect(scripts);
  const pairs = similarPairs(scripts);
  const total = (d ? 1 : 0) + (l ? 1 : 0) + (pairs.length ? 1 : 0);
  const mis = misconceptions(scripts);

  const body =
    total === 0
      ? `<section class="card empty">
           <h2>Nothing worth flagging in this session</h2>
           <p>NORM checked for marking drift, an answer-length effect, and similar answers marked
           differently. None of them showed up above the level you would expect from ordinary
           variation, so there is nothing to report.</p>
         </section>`
      : [d ? driftCard(d) : '', l ? lengthCard(l) : '', pairs.length ? pairsCard(pairs) : '']
          .filter(Boolean)
          .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} — NORM</title>
<style>${YOU_PAGE_CSS}</style>
</head>
<body>
<div class="wrap">
  <header class="page">
    <p class="eyebrow">NORM · You</p>
    <h1>What happened while you were marking</h1>
    <p class="sub">${scripts.length} scripts, one question. NORM re-marked every script against the guide you approved, then looked at how your own marks moved.</p>
  </header>

  <div class="chips">
    <div class="chip"><b>${scripts.length}</b><span>scripts marked</span></div>
    <div class="chip"><b>${total}</b><span>pattern${total === 1 ? '' : 's'} found</span></div>
    <div class="chip"><b>${pairs.length}</b><span>pair${pairs.length === 1 ? '' : 's'} to review</span></div>
    <div class="chip"><b>${mis.length}</b><span>shared mistakes</span></div>
  </div>

  ${body}

  <footer class="note">
    NORM's marks are not claimed to be correct — only consistent. Everything above measures your
    marking against one fixed standard, so a shift means the standard you applied moved, not that
    any single mark was wrong. Preview built from <code>${esc(file)}</code>.
  </footer>
</div>
</body>
</html>`;
}

mkdirSync(new URL('../preview/', import.meta.url), { recursive: true });

/** A landing page, so the deployed URL opens on something rather than a file listing. */
function index(): string {
  const card = (href: string, title: string, blurb: string) =>
    `<a class="card" href="${href}"><h2>${title}</h2><p class="detail">${blurb}</p></a>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>NORM — You</title><style>${YOU_PAGE_CSS}
a.card { display:block; text-decoration:none; color:inherit; }
a.card:hover { border-color: var(--rule-strong); }
</style></head><body><div class="wrap">
<header class="page">
  <p class="eyebrow">NORM</p>
  <h1>What happened while you were marking</h1>
  <p class="sub">NORM re-marks every script against the guide the faculty member approved, then
  looks at how their own marks moved. It never decides a student's grade.</p>
</header>
${card('you.html', 'The You page', 'Marking drift, an answer-length effect, and four pairs of similar answers marked differently.')}
${card('you-real.html', 'On the current seed data', 'The same page where the planted effects have not survived. Nothing is reported.')}
${card('you-flat.html', 'On clean data', 'Faculty marks replaced with noise. Nothing is planted, so nothing is found — the honesty check.')}
</div></body></html>`;
}
writeFileSync(new URL('../preview/index.html', import.meta.url), index(), 'utf8');
console.log('wrote preview/index.html');
for (const [fixture, out, title] of [
  ['fixtures/demo-control.json', 'you.html', 'You'],
  ['data/graded-50.json', 'you-real.html', 'You (Dev 1 real data)'],
  ['fixtures/flat-control.json', 'you-flat.html', 'You (nothing found)'],
] as const) {
  const html = build(fixture, title);
  writeFileSync(new URL(`../preview/${out}`, import.meta.url), html, 'utf8');
  console.log(`wrote preview/${out}  (${(html.length / 1024).toFixed(1)} kB)  from ${fixture}`);
}
