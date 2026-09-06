'use client';

// The hero's prompt box.
//
// It is wired to the same /api/ask endpoint the in-app Ask panel uses, so a question typed
// here is answered from this marking session's real numbers — not a decorative input that
// scrolls you somewhere. The answer appears in place, under the box.
//
// `grounded: false` comes back when the question needs something the session cannot answer.
// We show that state rather than hiding it: a box that answers everything is not credible.

import { useState } from 'react';
import { PromptInput } from '@/components/ui/ai-chat-input';

const SUGGESTIONS = [
  'Did my marking drift?',
  'Which mistake did most students make?',
  'Was the question fair?',
];

export default function HeroAsk() {
  const [answer, setAnswer] = useState<string | null>(null);
  const [grounded, setGrounded] = useState(true);
  const [pending, setPending] = useState(false);

  async function ask(question: string) {
    if (!question.trim()) return;
    setPending(true);
    setAnswer(null);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setAnswer(data.answer ?? 'No answer came back. Try again?');
      setGrounded(data.grounded !== false);
    } catch {
      setAnswer('Could not reach Markable just now. The findings are all on the You page.');
      setGrounded(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-12 flex flex-col items-center">
      <div className="flex w-full justify-center">
        <PromptInput
          onSubmit={(value) => ask(value)}
          placeholder="Ask about this marking session…"
          models={['gpt-4o']}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => ask(s)}
            className="rounded-full border border-rule px-4 py-2 text-[13px] text-muted-ink transition-colors hover:border-rule-strong hover:text-ink"
          >
            {s}
          </button>
        ))}
      </div>

      {(pending || answer) && (
        <div className="mt-7 w-full max-w-[620px] rounded-2xl border border-rule bg-paper/70 px-6 py-5 text-left backdrop-blur-[2px]">
          {pending ? (
            <p className="text-[15px] text-faint">Reading this session&rsquo;s numbers…</p>
          ) : (
            <>
              <p className="text-[16px] leading-relaxed text-ink-soft">{answer}</p>
              <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.16em] text-faint">
                {grounded
                  ? 'Answered from this session’s measured numbers'
                  : 'Not something this session can answer'}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
