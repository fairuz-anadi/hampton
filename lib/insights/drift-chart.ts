// The drift chart, as a pure SVG string.
//
// Shared deliberately: the React page and the standalone preview both render this, so the
// thing on the projector cannot quietly differ from the thing I tested.
//
// One series split into two periods (early / late). That split IS the finding, so it is
// what carries the colour. Legend plus direct labels on both mean lines, so identity is
// never colour alone.

import type { Finding } from '../types';

const PAD = { top: 18, right: 92, bottom: 40, left: 54 };
const W = 720;
const H = 260;

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const fmt = (n: number): string => (n >= 0 ? '+' : '') + n.toFixed(1);

export type DriftChartData = {
  points: { x: number; y: number }[];
  cut: number;          // first marking order belonging to the late period
  earlyMean: number;
  lateMean: number;
};

/** Pull everything the chart needs out of a drift Finding. */
export function driftChartData(f: Finding): DriftChartData | null {
  if (f.kind !== 'drift' || !f.series || f.series.length === 0) return null;
  const points = [...f.series].sort((a, b) => a.x - b.x);
  const cutIndex = Math.floor(points.length / 2);
  const cut = points[cutIndex].x;
  const avg = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length;
  return {
    points,
    cut,
    earlyMean: avg(points.slice(0, cutIndex).map((p) => p.y)),
    lateMean: avg(points.slice(cutIndex).map((p) => p.y)),
  };
}

export function driftChartSVG(d: DriftChartData): string {
  const xs = d.points.map((p) => p.x);
  const ys = d.points.map((p) => p.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  // always include zero: the whole quantity is "distance from the fixed standard"
  const yLo = Math.min(0, ...ys) - 0.4;
  const yHi = Math.max(0, ...ys) + 0.4;

  const px = (x: number) => PAD.left + ((x - xMin) / (xMax - xMin || 1)) * (W - PAD.left - PAD.right);
  const py = (y: number) => PAD.top + (1 - (y - yLo) / (yHi - yLo || 1)) * (H - PAD.top - PAD.bottom);

  const parts: string[] = [];

  // --- recessive grid + y ticks
  const step = (yHi - yLo) / 4;
  for (let i = 0; i <= 4; i++) {
    const v = yLo + i * step;
    const y = py(v);
    parts.push(
      `<line x1="${PAD.left}" y1="${y.toFixed(1)}" x2="${W - PAD.right}" y2="${y.toFixed(1)}" class="dc-grid"/>`,
      `<text x="${PAD.left - 10}" y="${(y + 4).toFixed(1)}" class="dc-tick dc-tick-y">${fmt(v)}</text>`,
    );
  }

  // --- zero line, slightly stronger: this is the reference, not a gridline
  parts.push(
    `<line x1="${PAD.left}" y1="${py(0).toFixed(1)}" x2="${W - PAD.right}" y2="${py(0).toFixed(1)}" class="dc-zero"/>`,
  );

  // --- x ticks
  for (const t of [xMin, Math.round((xMin + xMax) / 2), xMax]) {
    parts.push(`<text x="${px(t).toFixed(1)}" y="${H - PAD.bottom + 20}" class="dc-tick dc-tick-x">${t}</text>`);
  }

  // --- the changepoint
  const cx = px(d.cut) - (px(xMax) - px(xMin)) / (d.points.length - 1) / 2;
  parts.push(
    `<line x1="${cx.toFixed(1)}" y1="${PAD.top}" x2="${cx.toFixed(1)}" y2="${H - PAD.bottom}" class="dc-cut"/>`,
    `<text x="${(cx + 6).toFixed(1)}" y="${PAD.top + 11}" class="dc-cut-label">script ${d.cut}</text>`,
  );

  // --- the two period means, with direct labels at the right edge
  const meanLine = (value: number, from: number, to: number, cls: string, label: string) => {
    const y = py(value);
    parts.push(
      `<line x1="${px(from).toFixed(1)}" y1="${y.toFixed(1)}" x2="${px(to).toFixed(1)}" y2="${y.toFixed(1)}" class="dc-mean ${cls}"/>`,
    );
    parts.push(
      `<text x="${(W - PAD.right + 10).toFixed(1)}" y="${(y + 4).toFixed(1)}" class="dc-mean-label ${cls}">${label}</text>`,
    );
  };
  meanLine(d.earlyMean, xMin, d.cut - 1, 'dc-early', `${fmt(d.earlyMean)} avg`);
  meanLine(d.lateMean, d.cut, xMax, 'dc-late', `${fmt(d.lateMean)} avg`);

  // --- the marks. Surface-coloured ring so overlapping dots stay countable.
  for (const p of d.points) {
    const cls = p.x < d.cut ? 'dc-early' : 'dc-late';
    const period = p.x < d.cut ? 'earlier' : 'later';
    parts.push(
      `<circle cx="${px(p.x).toFixed(1)}" cy="${py(p.y).toFixed(1)}" r="5" class="dc-dot ${cls}">` +
        `<title>${esc(`Script ${p.x} (${period}) — ${fmt(p.y)} marks vs the fixed standard`)}</title>` +
        `</circle>`,
    );
  }

  // --- axis titles
  parts.push(
    `<text x="${((PAD.left + W - PAD.right) / 2).toFixed(1)}" y="${H - 6}" class="dc-axis-title">order the scripts were marked in</text>`,
    `<text transform="translate(14,${((PAD.top + H - PAD.bottom) / 2).toFixed(1)}) rotate(-90)" class="dc-axis-title">marks vs standard</text>`,
  );

  return (
    `<svg viewBox="0 0 ${W} ${H}" class="dc" role="img" ` +
    `aria-label="Each script's mark compared with the fixed standard, in the order they were marked. ` +
    `The earlier scripts average ${fmt(d.earlyMean)} and the later scripts average ${fmt(d.lateMean)}.">` +
    parts.join('') +
    `</svg>`
  );
}

/** Styles for the SVG above. Injected once by whoever renders the chart. */
export const DRIFT_CHART_CSS = `
.dc { width: 100%; height: auto; display: block; overflow: visible; }
.dc-grid { stroke: var(--rule); stroke-width: 1; }
.dc-zero { stroke: var(--rule-strong); stroke-width: 1.5; }
.dc-cut { stroke: var(--rule-strong); stroke-width: 1.5; stroke-dasharray: 3 4; }
.dc-cut-label { fill: var(--text-muted); font-size: 12px; }
.dc-tick { fill: var(--text-muted); font-size: 12px; }
.dc-tick-y { text-anchor: end; }
.dc-tick-x { text-anchor: middle; }
.dc-axis-title { fill: var(--text-muted); font-size: 12px; text-anchor: middle; }
.dc-dot { stroke: var(--surface-1); stroke-width: 2; }
.dc-dot.dc-early { fill: var(--series-1); }
.dc-dot.dc-late  { fill: var(--series-2); }
.dc-mean { stroke-width: 2.5; stroke-linecap: round; }
.dc-mean.dc-early { stroke: var(--series-1); }
.dc-mean.dc-late  { stroke: var(--series-2); }
.dc-mean-label { font-size: 13px; font-weight: 600; fill: var(--text-secondary); }
`;
