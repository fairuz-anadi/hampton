# Rubric induction — the one live model call

Owned by Dev 1 (prompt), wired by Dev 3 (route). This is the only call the
deployed app makes. Everything else ships as committed JSON.

- `POST https://api.openai.com/v1/chat/completions`
- Model: whatever `OPENAI_MODEL` is set to (default `gpt-4o`)
- `temperature: 0`, `max_tokens: 1500`, `response_format: { type: "json_object" }`
- Typical latency: 3–8 s. Show a real loading state; do not let it look hung.
- Dev 3: import `callJSON` from `scripts/llm.mjs` rather than writing a second
  fetch — the param fallbacks live there and you want them on this call too.
- The key stays server-side. Never ship it to the browser.

## System

```
You turn an exam question and its mark allocation into a marking guide a faculty member can approve or edit. You propose criteria that are observable in a student's answer — never vague qualities like "understanding" or "presentation". The criteria marks must sum exactly to the total. Return JSON only.
```

## User

```
Question (${totalMarks} marks):
${question}

Propose 4-6 marking criteria. Each one must be something you could point to in a student's answer and say "this is there" or "this is not".

Return ONLY this JSON, no prose, no code fence:
{
  "criteria": [
    { "id": "c1", "label": "short noun phrase, 3-6 words", "marks": 2, "expects": "one sentence: what a full-mark answer must contain" }
  ]
}

The marks must sum to exactly ${totalMarks}.
```

## Server-side checks before returning to the UI

1. `criteria.length` between 3 and 8 — otherwise retry once.
2. Marks sum to `totalMarks` exactly. If not, retry once; on a second failure
   fall back to `data/question.json → referenceCriteria` and log it.
3. Ids normalised to `c1..cn` in order — the model sometimes invents its own.
4. `approved: false` on the way out. **Nothing marks until the faculty presses
   approve.** That flag is the product's whole claim to being faculty-led.

## Demo fallback

If the venue wifi dies, the Grade screen loads `referenceCriteria` with
`approved: false` and the flow is identical from the approval screen onward.
Wire this fallback on the first pass, not as a rescue at 2:30.
