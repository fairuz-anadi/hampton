'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowDown, Check, Minus } from 'lucide-react';
import KineticGrid from '@/components/ui/kinetic-grid';
import { FlowButton } from '@/components/ui/flow-button';
import DriftChart from '@/components/DriftChart';
import HeroAsk from '@/components/HeroAsk';

interface Props {
  totalMarks: number;
  scripts: number;
  drift: {
    step: number;
    earlyMean: number;
    lateMean: number;
    splitAt: number;
    points: { x: number; y: number }[];
  };
  length: { advantage: number; exCeiling: number; ceilingN: number };
  pairCount: number;
  topError: { label: string; count: number } | null;
  hero: { mark: number; awards: { label: string; awarded: number; max: number }[] };
}

const EASE = [0.16, 1, 0.3, 1] as const;

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.7, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionMark({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-baseline gap-4 font-mono text-[15px] uppercase tracking-[0.18em] text-faint">
      <span>{n}</span>
      <span className="h-px w-10 bg-rule-strong" />
      <span>{label}</span>
    </div>
  );
}

export default function Landing({
  totalMarks,
  scripts,
  drift,
  length,
  pairCount,
  topError,
  hero,
}: Props) {
  const words = ['Fairer', 'grading.'];

  return (
    <KineticGrid globalColor="light">
      {/* ─────────────────────────────────────────────────────────── nav */}
      <header className="mx-auto flex max-w-[1240px] items-center justify-between px-6 py-7 md:px-10">
        <span className="text-[23px] font-bold tracking-tight">Markable</span>
        <nav className="flex items-center gap-7 text-sm text-muted-ink">
          <a href="#how" className="underline-sweep hidden sm:inline">
            How it works
          </a>
          <a href="#discover" className="underline-sweep hidden sm:inline">
            What it finds
          </a>
          <Link href="/grade" className="underline-sweep font-medium text-ink">
            Open Markable
          </Link>
        </nav>
      </header>

      {/* ─────────────────────────────────────────────────── 01 · hero */}
      <section className="mx-auto max-w-[1240px] px-6 pb-28 pt-10 md:px-10 md:pt-16">
        {/* hero-h1 caps at 120/128 on desktop and scales down on narrow screens, so the
            three lines never break mid-phrase. */}
        <h1 className="display rise hero-h1 text-center">
          {words.map((w, i) => (
            <span key={w} style={{ animationDelay: `${i * 0.08}s` }}>
              {w}&nbsp;
            </span>
          ))}
          <br />
          <span style={{ animationDelay: '0.16s' }}>Clearer&nbsp;</span>
          <span style={{ animationDelay: '0.24s' }}>feedback.</span>
          <br />
          <span
            style={{ animationDelay: '0.32s' }}
            className="bg-butter box-decoration-clone px-2 py-1"
          >
            Better teaching.
          </span>
        </h1>

        <div className="fade-up" style={{ animationDelay: '0.5s' }}>
          <HeroAsk />
        </div>

        <div className="mt-14 grid gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:items-end">
          <div className="fade-up" style={{ animationDelay: '0.45s' }}>
            <p className="max-w-[46ch] text-[23px] leading-relaxed text-ink-soft md:text-[26px]">
              Grading shouldn&rsquo;t end with a number. Markable helps faculty understand how they grade, why students
              lose marks, and what the results reveal about their class.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link href="/grade">
                <FlowButton text="Start grading" />
              </Link>
              <a
                href="#problem"
                className="group flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium text-muted-ink transition-colors hover:text-ink"
              >
                See how it works
                <ArrowDown className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-1" />
              </a>
            </div>

            <p className="mt-9 font-mono text-[15px] uppercase tracking-[0.16em] text-faint">
              Built for educators · Designed to keep them in control
            </p>
          </div>

          {/* Hero visual — a real marked script, and the thing Markable noticed */}
          <div className="fade-up relative" style={{ animationDelay: '0.6s' }}>
            <div className="rounded-2xl border border-rule bg-white p-7 shadow-[0_18px_50px_-28px_rgba(17,17,17,0.35)]">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[15px] uppercase tracking-[0.14em] text-faint">
                  Script 18 · Q4(b)
                </span>
                <span className="text-[40px] font-bold leading-none tracking-tight">
                  {hero.mark}
                  <span className="text-[26px] text-faint"> / {totalMarks}</span>
                </span>
              </div>

              <div className="mt-6 flex flex-col">
                {hero.awards.map((a) => {
                  const full = a.awarded >= a.max;
                  return (
                    <div
                      key={a.label}
                      className="flex items-center justify-between gap-4 border-b border-rule py-2.5 last:border-b-0"
                    >
                      <span className="flex items-center gap-2.5 text-[22px]">
                        {full ? (
                          <Check className="h-4 w-4 text-good" />
                        ) : (
                          <Minus className="h-4 w-4 text-critical" />
                        )}
                        <span className={full ? 'text-ink' : 'text-muted-ink'}>{a.label}</span>
                      </span>
                      <span className="font-mono text-[18px] tabular-nums text-muted-ink">
                        {a.awarded}/{a.max}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 14, rotate: -3 }}
              animate={{ opacity: 1, y: 0, rotate: -3 }}
              transition={{ duration: 0.8, ease: EASE, delay: 1.1 }}
              className="absolute -bottom-10 -left-4 w-[290px] rounded-2xl bg-lilac p-5 shadow-[0_18px_40px_-24px_rgba(17,17,17,0.4)] md:-left-14"
            >
              <p className="font-mono text-[15px] uppercase tracking-[0.14em] text-ink/50">
                Something worth noticing
              </p>
              <p className="mt-2 text-[22px] font-medium leading-snug text-ink">
                Your marking became {drift.step.toFixed(2)} marks stricter after script {drift.splitAt}.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────── 02 · problem */}
      <section id="problem" className="border-t border-rule bg-paper/60 backdrop-blur-[2px]">
        <div className="mx-auto max-w-[1240px] px-6 py-28 md:px-10 md:py-36">
          <Reveal>
            <SectionMark n="01" label="The problem" />
          </Reveal>

          <Reveal delay={0.05}>
            <h2 className="display landing-h2 mt-8 max-w-[16ch]">
              A grade tells you what happened. It doesn&rsquo;t tell you why.
            </h2>
          </Reveal>

          <div className="mt-20 grid gap-y-14 md:grid-cols-3 md:gap-x-12">
            {[
              {
                n: '01',
                title: 'Grading changes',
                body: 'After dozens of scripts, fatigue can quietly change how marks are awarded — and nothing in the pile tells you it happened.',
                tint: 'bg-blush',
              },
              {
                n: '02',
                title: "Students don't know why",
                body: `A ${hero.mark}/${totalMarks} doesn't tell a student what they did right, or what would have earned the rest.`,
                tint: 'bg-peach',
              },
              {
                n: '03',
                title: 'The class leaves clues',
                body: `After ${scripts} papers you have marks — but the patterns hiding inside them are thrown away.`,
                tint: 'bg-mint',
              },
            ].map((item, i) => (
              <Reveal key={item.n} delay={0.08 * i}>
                <div>
                  <span className={`inline-block h-9 w-9 rounded-full ${item.tint}`} />
                  <h3 className="mt-6 text-[24px] font-bold tracking-tight md:text-[28px]">{item.title}</h3>
                  <p className="mt-3 max-w-[34ch] text-[22px] leading-relaxed text-muted-ink">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <p className="mt-24 max-w-[24ch] text-[clamp(26px,3.4vw,44px)] font-bold leading-[1.1] tracking-tight">
              Markable turns the grading process into something you can learn from.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ─────────────────────────────────────────── 03 · how it works */}
      <section id="how" className="border-t border-rule bg-white/70 backdrop-blur-[2px]">
        <div className="mx-auto max-w-[1240px] px-6 py-28 md:px-10 md:py-36">
          <Reveal>
            <SectionMark n="02" label="How Markable works" />
          </Reveal>

          <Reveal delay={0.05}>
            <h2 className="display landing-h2 mt-8">
              Grade once.
              <br />
              Learn more from it.
            </h2>
          </Reveal>

          <div className="mt-20 grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule md:grid-cols-4">
            {[
              {
                n: '01',
                title: 'Show Markable how you mark',
                body: 'Upload a question and the answers you have already graded.',
              },
              {
                n: '02',
                title: 'Grade with your standard',
                body: 'Markable proposes a marking guide. You edit it, you approve it, and nothing is marked until you do.',
              },
              {
                n: '03',
                title: 'See what you might have missed',
                body: 'Inconsistent answers, shifts in your own marking, and patterns across the whole class.',
              },
              {
                n: '04',
                title: 'Turn marks into action',
                body: 'Understand where students went wrong, fix the question, and give feedback they can act on.',
              },
            ].map((step, i) => (
              <Reveal key={step.n} delay={0.06 * i}>
                <div className="group h-full bg-white p-7 transition-colors duration-500 hover:bg-paper-2 md:p-8">
                  <span className="font-mono text-[15px] tracking-[0.16em] text-faint">{step.n}</span>
                  <h3 className="mt-5 text-[26px] font-bold leading-tight tracking-tight">{step.title}</h3>
                  <p className="mt-3 text-[22px] leading-relaxed text-muted-ink">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <div className="mt-14 flex flex-wrap items-center gap-x-5 gap-y-3 font-mono text-[18px] uppercase tracking-[0.16em] text-muted-ink">
              {[
                { s: 'Grade', href: '/grade' },
                { s: 'Understand', href: '/class' },
                { s: 'Discover', href: '/you' },
                { s: 'Improve', href: '/improve' },
              ].map(({ s, href }, i) => (
                <span key={s} className="flex items-center gap-5">
                  <Link href={href} className={`underline-sweep ${i === 3 ? 'text-ink' : ''}`}>
                    {s}
                  </Link>
                  {i < 3 && <span className="text-faint">&rarr;</span>}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────────────────────────────────────────── 04 · discovery */}
      <section id="discover" className="border-t border-rule bg-paper/70 backdrop-blur-[2px]">
        <div className="mx-auto max-w-[1240px] px-6 py-28 md:px-10 md:py-36">
          <Reveal>
            <SectionMark n="03" label="What Markable finds" />
          </Reveal>

          <Reveal delay={0.05}>
            <h2 className="display landing-h2 mt-8 max-w-[18ch]">
              Markable finds things you can&rsquo;t see while grading.
            </h2>
          </Reveal>

          <div className="mt-20 grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
            <Reveal>
              <div className="h-full rounded-2xl border border-rule bg-white p-7 md:p-9">
                <p className="font-mono text-[15px] uppercase tracking-[0.14em] text-faint">Your grading</p>
                <h3 className="mt-3 text-[26px] font-bold leading-tight tracking-tight md:text-[32px]">
                  Possible shift detected
                </h3>
                <p className="mt-3 max-w-[46ch] text-[22px] leading-relaxed text-muted-ink">
                  After script {drift.splitAt}, you became{' '}
                  <span className="font-medium text-ink">{drift.step.toFixed(2)} marks stricter</span> on partial
                  credit — {drift.earlyMean.toFixed(2)} above Markable&rsquo;s reading of your guide before it,{' '}
                  {drift.lateMean.toFixed(2)} after.
                </p>
                <div className="mt-7">
                  <DriftChart
                    points={drift.points}
                    splitAt={drift.splitAt}
                    earlyMean={drift.earlyMean}
                    lateMean={drift.lateMean}
                    totalScripts={scripts}
                  />
                </div>
              </div>
            </Reveal>

            <div className="grid gap-6">
              <Reveal delay={0.08}>
                <div className="rounded-2xl bg-peach p-7 md:p-8">
                  <p className="font-mono text-[15px] uppercase tracking-[0.14em] text-ink/50">
                    Another thing worth noticing
                  </p>
                  <p className="mt-3 text-[25px] font-bold leading-snug tracking-tight md:text-[29px]">
                    {pairCount} pairs of answers were credited identically but marked differently.
                  </p>
                  <p className="mt-3 text-[22px] leading-relaxed text-ink/65">
                    Same criteria met, different totals. Markable shows them side by side and lets you decide.
                  </p>
                </div>
              </Reveal>

              <Reveal delay={0.14}>
                <div className="rounded-2xl bg-mint p-7 md:p-8">
                  <p className="font-mono text-[15px] uppercase tracking-[0.14em] text-ink/50">And one more</p>
                  <p className="mt-3 text-[25px] font-bold leading-snug tracking-tight md:text-[29px]">
                    {topError ? `${topError.count} students made the same mistake.` : 'One mistake, many students.'}
                  </p>
                  <p className="mt-3 text-[22px] leading-relaxed text-ink/65">
                    {topError ? topError.label + '.' : ''} Not &ldquo;they found it hard&rdquo; — the exact step, and
                    the scripts behind it.
                  </p>
                </div>
              </Reveal>

              <Reveal delay={0.2}>
                <div className="rounded-2xl border border-rule bg-white p-7 md:p-8">
                  <p className="font-mono text-[15px] uppercase tracking-[0.14em] text-faint">
                    And what it refuses to claim
                  </p>
                  <p className="mt-3 text-[25px] font-bold leading-snug tracking-tight md:text-[29px]">
                    Longer answers scored {length.advantage > 0 ? '+' : ''}
                    {length.advantage.toFixed(2)} higher — and Markable reported nothing.
                  </p>
                  <p className="mt-3 text-[22px] leading-relaxed text-muted-ink">
                    Drop the {length.ceilingN} answers already at full marks and the gap reverses to{' '}
                    {length.exCeiling.toFixed(2)}. A finding that flips when you remove a known artefact is not a
                    finding.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>

          <Reveal delay={0.1}>
            <div className="mt-16 flex flex-wrap items-center gap-6">
              <Link href="/you">
                <FlowButton text="Explore your grading" />
              </Link>
              <p className="text-[22px] text-muted-ink">
                Markable doesn&rsquo;t judge your decisions. It helps you see your patterns.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ──────────────────────────────────────────────── 05 · footer */}
      <footer className="border-t border-rule bg-white/80 backdrop-blur-[2px]">
        <div className="mx-auto max-w-[1240px] px-6 py-16 md:px-10">
          <div className="flex flex-col justify-between gap-12 md:flex-row">
            <div>
              <span className="text-[22px] font-bold tracking-tight">Markable</span>
              <p className="mt-3 max-w-[34ch] text-[22px] leading-relaxed text-muted-ink">
                Fairer grading. Clearer feedback. Better teaching. Turn grading into something you can learn from.
              </p>
            </div>

            <nav className="flex gap-14 text-[22px]">
              <div className="flex flex-col gap-3">
                <span className="font-mono text-[15px] uppercase tracking-[0.14em] text-faint">Product</span>
                <Link href="/grade" className="underline-sweep self-start text-muted-ink hover:text-ink">
                  Grade
                </Link>
                <Link href="/you" className="underline-sweep self-start text-muted-ink hover:text-ink">
                  Your grading
                </Link>
                <Link href="/class" className="underline-sweep self-start text-muted-ink hover:text-ink">
                  Class
                </Link>
                <Link href="/questions" className="underline-sweep self-start text-muted-ink hover:text-ink">
                  Questions
                </Link>
              </div>
              <div className="flex flex-col gap-3">
                <span className="font-mono text-[15px] uppercase tracking-[0.14em] text-faint">More</span>
                <Link href="/improve" className="underline-sweep self-start text-muted-ink hover:text-ink">
                  What to do next
                </Link>
                <Link href="/history" className="underline-sweep self-start text-muted-ink hover:text-ink">
                  Marking standards
                </Link>
                <a href="#how" className="underline-sweep self-start text-muted-ink hover:text-ink">
                  How it works
                </a>
                <Link href="/student" className="underline-sweep self-start text-muted-ink hover:text-ink">
                  For students
                </Link>
              </div>
            </nav>
          </div>

          <div className="mt-14 flex flex-col justify-between gap-3 border-t border-rule pt-7 font-mono text-[15px] uppercase tracking-[0.14em] text-faint md:flex-row">
            <span>Built for AUST CSE Carnival 8.0</span>
            <span>&copy; {new Date().getFullYear()} Markable</span>
          </div>
        </div>
      </footer>
    </KineticGrid>
  );
}
