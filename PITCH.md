# Markable — pitch script

**10 minutes · 20% why · 30% how · 50% what**

Live: https://markable-hampton.vercel.app

---

## PART 1 — WHY (2 minutes)

> Do not describe the problem statement. Give them a way of seeing it they did not walk in with.

### Open cold. Say this before anything else:

> "Last night, somewhere in this university, a teacher sat down with fifty exam scripts.
>
> By script thirty, they were tired. They did not know it. Nobody told them.
>
> So the last twenty students in that pile were graded by a slightly different person than the first thirty were. And not one of them will ever find out."

Pause. Then:

> "That teacher was not careless. They were human. And grading is the one part of teaching that never tells you how you did."

### The reinterpretation — this is the 20%

Everything else in teaching has a mirror:

- You give a lecture — you see the faces.
- You set an exam — you see the marks.
- **You grade fifty scripts alone at midnight — and you find out nothing. Ever.**

A teacher hands back a column of numbers and walks away. They never learn whether they were consistent, whether they got harsher as the night went on, whether two students who wrote the same answer got the same mark.

> "The problem is not that teachers grade badly. It is that grading is invisible, even to the person doing it."

### Why it matters beyond one classroom

A mark is not a number. It is a CGPA, a scholarship, a job interview.

> "We accept that a human decides it. We just never check whether that human was the same person on script 50 as on script 1."

**Land the line:**

> "We did not build an AI that grades. We built the mirror."

---

## PART 2 — HOW IT CREATES VALUE (3 minutes)

> Not features yet. Why this approach is right where others are wrong.

### Start by naming what everyone else builds

> "Every AI grading tool asks the same question: can the machine give the mark instead of the teacher?
>
> We think that is the wrong question — and it is why no faculty member uses those tools."

Two reasons, say both:

**1. No teacher will hand over the grade.** They are accountable for it. Nobody accountable for a decision delegates it to something they cannot question.

**2. To grade for you, the AI has to be right. That is a very high bar.**

> "So we changed the question. Markable never decides a student's grade. It applies one fixed standard to every script, and shows the teacher where their own marking moved away from it.
>
> That means Markable does not have to be *right*. It only has to be *consistent*. And a consistent ruler is all you need to measure whether something moved."

*(This is the strongest idea in the pitch. Say it slowly.)*

### The three things that creates

**Fairness you can check instead of assume.** Right now "I marked fairly" is a feeling. Markable turns it into something with a number next to it.

**The teacher learns something about themselves.** Not about the students — about their own habits. Nothing else in their career does this.

**The standard stops dying with the session.** Once the marking guide is written down and approved, it can be handed to a junior colleague next semester.

> "Twenty years of judgment that lived only in one person's head — now a new teacher can inherit it."

### The line that separates you from the room

> "We are not automating the teacher's job. We are giving them the one thing their job never gave them: feedback on their own work."

---

## PART 3 — WHAT IT ACTUALLY DOES (5 minutes)

> Now be concrete and brave. Show, do not describe. Real screen, real numbers.

### Set up in one sentence

> "One exam question. Fifty scripts a teacher has already marked. Watch."

### Beat 1 — Markable learns their standard (45 sec)

Markable reads the scripts they already marked and writes down the marking guide they were **actually** using — not one you typed in.

> "Nobody wrote this rubric. We reverse-engineered it out of their own marking."

**Then say the sentence that keeps the room on your side:**

> "And the teacher edits it and approves it. The human stays in charge. Nothing gets marked until they press approve."

### Beat 2 — it re-marks all fifty (30 sec)

Every script, criterion by criterion, with the exact sentence in the student's answer that earned each mark highlighted.

> "Not a score out of ten. A score, and the evidence for it."

### Beat 3 — 🔥 THE DRIFT 🔥 (60 sec)

Open the **You** page.

> "Now the question no teacher has ever been able to ask: what happened to *you* while you were marking?"

Show the chart. Blue dots early, orange dots late.

> "Your marking may have tightened as you went. The scripts you marked early sat higher above the standard than the ones you marked late."

**Pause here. Let them look.**

> "Nobody in this room could have found that by hand. And the teacher who did it had no idea."

### Beat 4 — 🔥 THE PAIR 🔥 (90 sec — your best moment)

> "Then there is this. Two students. Read them yourself."

**Read Student 20 out loud:**

> "Given T(n) = 3T(n/4) + n log n, identify a=3, b=4, f(n)=n log n. Calculate n^(log₄3)=n^0.79. Apply Case 3."

**Read Student 17 out loud:**

> "T(n) = 3T(n/4) + n log n. We identify a=3, b=4, f(n)=n log n. Then n^(log₄3)=n^0.79. So choose Case 3."

Pause. Then:

> "Same recurrence. Same values. Same case. Same conclusion. Eighty percent of the wording is identical.
>
> **One got 10. The other got 7.5.**
>
> Out of two hundred and thirty-two comparable pairs, this is the one where the gap was bigger than that teacher's own natural variation. It was sitting in their marking all along, and nobody would ever have found it."

### Beat 5 — the honesty (45 sec) — do not skip this

Point at the panel that says **nothing found**.

> "One more thing. This panel checks whether longer answers get better marks. It says: nothing found.
>
> We tested it. We ran four hundred sets of marking with nothing wrong in them. It stayed quiet in over ninety percent."

> "Most AI tools always find something, because always finding something looks impressive. Ours will tell a teacher their marking was fine. That is the only reason to believe it when it says otherwise."

### Close (20 sec)

> "A grade tells you how a student did.
>
> **Markable tells a teacher what happened to them while they were deciding.**"

---

## If they ask

**"Is the AI grading students?"**
> No. It applies one fixed standard so we can measure movement against it. The teacher's mark is the one that counts. Markable never changes a grade.

**"How do you know the marking guide is right?"**
> We don't need it to be right — only constant. Drift is movement against a fixed ruler. And the teacher approves the guide before anything is marked.

**"Is this real data?"**
> The scripts are generated, and we say so. The analysis is real arithmetic on them — no model call, so every number is reproducible and we can show you the formula.

**"What if it finds nothing?"**
> Then it says nothing. That is the feature.

---

## Run of show

| Time | Beat |
|---|---|
| 0:00–2:00 | Why — the invisible night of marking |
| 2:00–5:00 | How — we don't grade, we mirror |
| 5:00–5:45 | Learns the guide · teacher approves |
| 5:45–6:15 | Re-marks 50 with evidence |
| 6:15–7:15 | **Drift** — pause |
| 7:15–8:45 | **The pair** — read both aloud |
| 8:45–9:30 | Nothing found — why that earns trust |
| 9:30–10:00 | Close |

**Rules:** one person drives. Say "approve" out loud. Pause after drift and after the pair — the silence does the work.
