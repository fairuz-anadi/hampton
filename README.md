# NORM

Fairer grading. Clearer feedback. NORM marks against a guide the faculty
approved, then shows the faculty what happened to their own marking while they
did it.

3-hour build, 3 people. Full plan: see the build plan artifact.

## File boundaries — do not cross

Two people editing the same file at speed is where the merge conflicts come
from. Agreed at 0:15:

| Owner | Owns |
|---|---|
| **Dev 1** — data & marking | `scripts/**` `prompts/**` `data/**` |
| **Dev 2** — discovery | `app/you/**` `lib/insights/**` |
| **Dev 3** — screens | `app/grade/**` `app/student/**` `components/**` `styles/**` |
| everyone, by agreement | `lib/types.ts` |

Dev 2 needs something visual → ask Dev 3, or ship it unstyled. Dev 3 never
touches `lib/insights/**`.

## Setup

Node 20+. No dependencies for the data scripts — they use built-in `fetch`.

```powershell
$env:OPENAI_API_KEY = "sk-..."
$env:OPENAI_MODEL = "gpt-4o"   # optional; set to whatever your key can reach
```

`scripts/llm.mjs` is the only file that knows which API we call. Swapping
provider means editing that one file. If the model rejects `temperature`,
`max_tokens` or JSON mode, the first call detects it from the error and retries
without them.

## Dev 1 runbook

```bash
npm run seed     # ~1 min   50 answers, faculty marks with planted effects
npm run verify   # instant  proves the effects are actually in the data
npm run mark     # ~2 min   NORM marks all 50, writes data/graded-50.json
npm run verify   # again    now against real NORM marks
```

Then spot-check five highlights by hand before telling anyone the data is ready.

### What each file is

| File | What it holds |
|---|---|
| `data/question.json` | The exam question and the approved rubric (`referenceCriteria`) |
| `data/scripts-50.json` | 50 answers + faculty marks. No NORM marks yet |
| `data/planted-effects.json` | The ground truth: drift step, length bonus, which pairs are inconsistent |
| `data/graded-50.json` | **The file the app ships.** Everything the UI reads |
| `fixtures/fake-10.json` | 10 hand-written rows in the same shape, for Dev 2 and Dev 3 to build against from minute 20 |

### Two decisions baked into the scripts

**The model writes the answers; JavaScript computes the faculty marks.** If the
model assigned marks we could not guarantee the drift step exists, and the demo
rests on it existing. `generate-seed.mjs` plants it deterministically from a
fixed seed, and `planted-effects.json` records exactly what was planted — so
Dev 2 can check their detectors against known ground truth instead of hoping.

**Evidence offsets are computed here, not asked for.** Models are unreliable at
counting characters. The marking prompt asks for an exact quote from the
answer; `locate()` turns it into `[start, end]` with `indexOf`. If the quote
isn't found verbatim, the award ships with no evidence rather than a highlight
in the wrong place.

## What the data actually says

Measured on `data/graded-50.json` by `npm run verify`. **Quote these numbers,
not the ones in the pitch deck** — a judge who reads the axis will check.

| | |
|---|---|
| Drift step after script 25 | **0.59 marks** (+1.74 for scripts 1–25, +1.15 for 26–50, n=21 / n=23) |
| Length advantage at equal coverage | **+0.80 marks** for answers over 150 words, across all 6 coverage groups |
| Similar pairs ≥2 marks apart | 28 raw — **surface the top 4–5 by gap**, deduped so a script appears once |
| Triage | 43 clear · 4 review · 3 unusual |
| Most common error | `missed-regularity-check`, **36 students** |
| Evidence | 163 credited awards, **0 without a located highlight** |
| NORM vs ground truth | exact on 41/50, within 1 mark on 45/50 |

## Marking order is data

`script.order` is the sequence the faculty marked in. It is set once at
generation and **never re-sorted**. Every drift number is a function of it. Sort
the display however you like; never sort the array in place.

## Production has no API key

Only rubric induction calls the model live (see `prompts/induce-rubric.md`).
Marking is replayed from `data/graded-50.json`. The deployed app needs no
secret and cannot fail on venue wifi.
