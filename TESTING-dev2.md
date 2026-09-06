# Dev 2 — Discovery & the You page

Everything runs with plain `node`. No build step, no API key, no internet.

## Where my code lives

Per the ownership boundary in `lib/types.ts`:

- `lib/insights/` — the three discovery functions, the drift chart, the page styles
- `app/you/page.tsx` — the You page

I do not write to `data/`, `scripts/`, `prompts/` (Dev 1) or `components/`, `styles/` (Dev 3).

## Run the checks

```bash
node tools/check_discovery.ts
```

Last line must read `ALL ASSERTIONS PASSED`. Three datasets, three jobs:

| Dataset | What it is | Expected |
|---|---|---|
| `data/graded-50.json` | Dev 1's real marked scripts | **reported, not asserted** |
| `fixtures/demo-control.json` | same scripts, effects re-planted so they survive | all three found |
| `fixtures/flat-control.json` | same scripts, faculty marks replaced by noise | **nothing found** |

The flat control is the important one. Finding things is easy; staying quiet when there is
nothing to find is what makes the findings believable. If a judge asks "does it just always
find something?", run this in front of them.

## Look at the page

```bash
node tools/build_preview.ts
```

Open any of these in a browser — no server needed:

- `preview/you.html` — all three findings
- `preview/you-real.html` — Dev 1's current real data (empty; see below)
- `preview/you-flat.html` — the empty state on clean data

## Rebuild the fixtures

```bash
node tools/make_flat_control.ts   # the honesty control
node tools/make_demo_control.ts   # the corrected control
```

Both are seeded, so they produce identical output on every machine.

## Known issue — the real data does not yet carry the effects

`data/graded-50.json` currently produces **no findings**. That is my code behaving correctly,
not failing. Three separate causes, all in the data:

1. **Drift, p = 0.25.** 16 of 50 faculty marks sit at 10.0. The generosity offset (+1.8 / +1.2)
   pushes marks into the ceiling, and the clamping eats the step.
   *Fix: keep the step, drop the baseline — roughly +1.0 / +0.15.*
2. **Length effect, p = 0.55.** Same ceiling, plus only 12 answers clear the 150-word threshold
   and the whole range is 22-226 words.
   *Fix: wider spread of answer lengths, and apply the bonus centred (+0.65 / -0.65).*
3. **Similar pairs, 0 found.** The planted pairs are 0.04-0.08 similar by text — they are
   unrelated answers that merely share criterion coverage. s01 is 51 words, s44 is 181.
   *Fix: plant a pair by copying one answer's text into the other, then split the marks.*

`tools/make_demo_control.ts` applies all three fixes to Dev 1's own file and is a working
reference for the parameters. Dev 1 still needs to re-run their own pipeline.
