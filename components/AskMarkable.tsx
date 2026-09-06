'use client';

import { useState } from 'react';
import { PromptInput } from '@/components/ui/ai-chat-input';

const SUGGESTIONS = [
  'Which criterion cost students the most marks?',
  'Did my marking change as I went?',
  'Which two answers should I compare first?',
];

export default function AskMarkable() {
  const [asked, setAsked] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [seed, setSeed] = useState('');

  async function ask(question: string) {
    if (!question.trim()) return;
    setAsked(question);
    setAnswer(null);
    setBusy(true);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setAnswer(data.answer);
    } catch {
      setAnswer('Something went wrong reaching Markable. The numbers are all on this page regardless.');
    }
    setBusy(false);
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Ask about this session</h2>
        <span className="pill pill-quiet">answers only from what Markable computed</span>
      </div>

      <div className="panel-body stack">
        <PromptInput
          placeholder="Ask about this marking session…"
          value={seed}
          onChange={setSeed}
          models={['This session']}
          onSubmit={(v) => {
            ask(v);
            setSeed('');
          }}
        />

        <div className="row" style={{ gap: 8 }}>
          {SUGGESTIONS.map((s) => (
            <button key={s} className="btn btn-ghost btn-sm" onClick={() => ask(s)} disabled={busy}>
              {s}
            </button>
          ))}
        </div>

        {asked && (
          <div className="rounded-xl border border-rule bg-paper p-5">
            <p className="font-mono text-[15px] uppercase tracking-[0.14em] text-faint">You asked</p>
            <p className="mt-2 text-[25px] font-medium leading-snug">{asked}</p>

            <p className="mt-5 font-mono text-[15px] uppercase tracking-[0.14em] text-faint">Markable</p>
            <p className="mt-2 max-w-[58ch] text-[22px] leading-relaxed text-ink-soft">
              {busy ? 'Reading the session…' : answer}
            </p>
          </div>
        )}

        <p className="hedge">
          Markable answers from the numbers on these pages and nothing else. Ask it something it has not computed and it
          will tell you so rather than guess.
        </p>
      </div>
    </section>
  );
}
