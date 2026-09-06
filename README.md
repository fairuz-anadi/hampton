# NORM

Dev 3 screen implementation for the NORM marking-audit demo.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Routes

- `/` — Grade: sample loader, rubric approval, triage, script list and evidence reader
- `/you` — faculty review findings screen
- `/student` — criterion-by-criterion student result

## Data hand-off

The screens read the hand-written `data/fake-10.json` fixture while the batch is unavailable. Replace that import with Dev 1's committed `graded-50.json` when it lands; the shared shape is in `lib/types.ts`.

There is intentionally no upload, database, authentication, API route, or deployment configuration.
