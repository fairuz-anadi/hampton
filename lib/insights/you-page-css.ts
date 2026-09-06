// Styles for the You page. Imported by both the React page and the standalone preview,
// so what Dev 3 ships and what I tested cannot drift apart.
//
// Dark values are declared under both scopes on purpose: the media query covers the OS
// setting, the data-theme scope covers an explicit toggle, and the toggle has to win
// in both directions.

import { DRIFT_CHART_CSS } from './drift-chart.ts';

export const YOU_PAGE_CSS = `
:root {
  color-scheme: light;
  --surface-0: #f4f4f1;
  --surface-1: #fcfcfb;
  --text-primary: #0b0b0b;
  --text-secondary: #52514e;
  --text-muted: #78766f;
  --rule: #e3e2dd;
  --rule-strong: #c9c7bf;
  --series-1: #2a78d6;
  --series-2: #eb6834;
  --accent-soft: #eef4fc;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    --surface-0: #111110;
    --surface-1: #1a1a19;
    --text-primary: #ffffff;
    --text-secondary: #c3c2b7;
    --text-muted: #93918a;
    --rule: #2c2c2a;
    --rule-strong: #46453f;
    --series-1: #3987e5;
    --series-2: #d95926;
    --accent-soft: #16202c;
  }
}
:root[data-theme="dark"] {
  color-scheme: dark;
  --surface-0: #111110;
  --surface-1: #1a1a19;
  --text-primary: #ffffff;
  --text-secondary: #c3c2b7;
  --text-muted: #93918a;
  --rule: #2c2c2a;
  --rule-strong: #46453f;
  --series-1: #3987e5;
  --series-2: #d95926;
  --accent-soft: #16202c;
}

* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--surface-0);
  color: var(--text-primary);
  font: 16px/1.55 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.wrap { max-width: 900px; margin: 0 auto; padding: 32px 24px 64px; }

header.page { margin-bottom: 24px; }
.eyebrow { font-size: 13px; letter-spacing: .08em; text-transform: uppercase; color: var(--text-muted); margin: 0 0 6px; }
h1 { font-size: 30px; line-height: 1.15; margin: 0 0 6px; letter-spacing: -0.01em; }
.sub { font-size: 16px; color: var(--text-secondary); margin: 0; }

.chips { display: flex; gap: 10px; flex-wrap: wrap; margin: 20px 0 26px; }
.chip {
  background: var(--surface-1); border: 1px solid var(--rule); border-radius: 10px;
  padding: 10px 14px; min-width: 108px;
}
.chip b { display: block; font-size: 22px; line-height: 1.1; letter-spacing: -0.01em; }
.chip span { font-size: 12.5px; color: var(--text-muted); }

.card {
  background: var(--surface-1); border: 1px solid var(--rule); border-radius: 14px;
  padding: 22px 24px; margin-bottom: 18px;
}
.card.hero { border-color: var(--rule-strong); }
.card h2 { font-size: 20px; line-height: 1.25; margin: 0 0 8px; letter-spacing: -0.01em; }
.card p.detail { font-size: 15px; color: var(--text-secondary); margin: 0 0 14px; max-width: 68ch; }
.kind {
  display: inline-block; font-size: 11.5px; letter-spacing: .07em; text-transform: uppercase;
  color: var(--text-muted); border: 1px solid var(--rule); border-radius: 999px;
  padding: 2px 9px; margin-bottom: 10px;
}

.legend { display: flex; gap: 18px; align-items: center; margin: 4px 0 12px; font-size: 13px; color: var(--text-secondary); }
.legend i { width: 11px; height: 11px; border-radius: 3px; display: inline-block; margin-right: 7px; vertical-align: -1px; }
.legend .s1 { background: var(--series-1); }
.legend .s2 { background: var(--series-2); }

.scripts { font-size: 13px; color: var(--text-muted); margin-top: 12px; }
.scripts code {
  font: 12.5px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace;
  background: var(--accent-soft); border-radius: 4px; padding: 1px 5px; margin-right: 3px;
  color: var(--text-secondary);
}

ul.pairs { list-style: none; margin: 0; padding: 0; }
ul.pairs li { border-top: 1px solid var(--rule); padding: 12px 0; font-size: 15px; }
ul.pairs li:first-child { border-top: 0; padding-top: 4px; }
ul.pairs .why { font-size: 13.5px; color: var(--text-muted); margin-top: 3px; }

details { margin-top: 14px; }
details summary { cursor: pointer; font-size: 13.5px; color: var(--text-secondary); }
table { border-collapse: collapse; width: 100%; margin-top: 12px; font-size: 13px; }
th, td { text-align: right; padding: 5px 8px; border-bottom: 1px solid var(--rule); }
th:first-child, td:first-child { text-align: left; }
th { color: var(--text-muted); font-weight: 600; }

.empty { text-align: center; padding: 46px 20px; }
.empty h2 { font-size: 21px; margin: 0 0 8px; }
.empty p { color: var(--text-secondary); margin: 0 auto; max-width: 52ch; font-size: 15px; }

footer.note { margin-top: 28px; font-size: 13px; color: var(--text-muted); border-top: 1px solid var(--rule); padding-top: 14px; }

${DRIFT_CHART_CSS}
`;
