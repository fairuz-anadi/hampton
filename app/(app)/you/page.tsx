import Link from 'next/link';
import DriftChart from '@/components/DriftChart';
import PairCompare from '@/components/PairCompare';
import { SCRIPTS, QUESTION, CRITERIA } from '@/lib/data';
import { detectDrift, detectLengthEffect, findSimilarPairs, consistencyScore } from '@/lib/insights';

export const metadata = { title: 'You · Markable' };

export default function YouPage() {
  const drift = detectDrift(SCRIPTS, QUESTION.totalMarks);
  const length = detectLengthEffect(SCRIPTS, QUESTION.totalMarks);
  const pairs = findSimilarPairs(SCRIPTS, 5);
  const consistency = consistencyScore(SCRIPTS);

  const longPct = length.longMean / QUESTION.totalMarks;
  const shortPct = length.shortMean / QUESTION.totalMarks;

  // Spread of the gaps, written as a range only when there is a range to write.
  // Math.min of an empty list is Infinity, and "3–3 marks" reads like a bug.
  const gaps = pairs.map((p) => p.gap);
  const gapLo = gaps.length ? Math.min(...gaps) : 0;
  const gapHi = gaps.length ? Math.max(...gaps) : 0;
  const gapRange = gapLo === gapHi ? `${gapLo}` : `${gapLo}–${gapHi}`;

  return (
    <div className="stack">
      <div className="page-head">
        <div className="eyebrow">What happened while you were marking</div>
        <h1>Your marking</h1>
        <p className="lede">
          Every number here is arithmetic over the marks you gave and the marks Markable gave against the guide you
          approved. Nothing on this page was written by a model, and each finding opens the scripts it came from.
        </p>
      </div>

      <section className="panel">
        <div className="panel-body">
          <div className="stat-row">
            <div>
              <div className="stat-label">Consistency</div>
              <div className="stat-value">{consistency.pct}%</div>
            </div>
            <div>
              <div className="stat-label">Pairs compared</div>
              <div className="stat-value">{consistency.compared}</div>
            </div>
            <div>
              <div className="stat-label">Diverging by 2+</div>
              <div className="stat-value">{consistency.diverging}</div>
            </div>
          </div>
          <p className="hedge" style={{ marginTop: 14 }}>
            Of every pair of answers Markable credited identically, {consistency.pct}% were marked within 2 marks of each
            other. That is a comparison of {consistency.compared} pairs, not a judgement about you.
          </p>
        </div>
      </section>

      {/* ----------------------------------------------------------- drift */}
      <section className="panel">
        <div className="panel-head">
          <h2>Your marking may have tightened as you went</h2>
          <span className={`pill ${drift.significant ? 'pill-unusual' : 'pill-quiet'}`}>
            {drift.significant ? 'worth reading' : 'nothing found'}
          </span>
        </div>
        <div className="panel-body stack">
          {drift.significant ? (
            <>
              <p className="finding-detail">
                Partial-credit answers before script {drift.splitAt} sat{' '}
                <strong>{drift.earlyMean.toFixed(2)} marks</strong> above Markable&rsquo;s reading of your guide. After it,{' '}
                <strong>{drift.lateMean.toFixed(2)}</strong>. That is a difference of{' '}
                <strong>{drift.step.toFixed(2)} marks</strong> in how much benefit of the doubt an incomplete answer
                got, depending on when you reached it.
              </p>
              <DriftChart
                points={drift.points}
                splitAt={drift.splitAt}
                earlyMean={drift.earlyMean}
                lateMean={drift.lateMean}
                totalScripts={SCRIPTS.length}
              />
              <div className="stat-row">
                <div>
                  <div className="stat-label">Scripts 1–{drift.splitAt}</div>
                  <div className="stat-value" style={{ color: 'var(--good)' }}>+{drift.earlyMean.toFixed(2)}</div>
                  <div className="stat-label">n = {drift.earlyN}</div>
                </div>
                <div>
                  <div className="stat-label">Scripts {drift.splitAt + 1}–{SCRIPTS.length}</div>
                  <div className="stat-value" style={{ color: 'var(--faculty)' }}>+{drift.lateMean.toFixed(2)}</div>
                  <div className="stat-label">n = {drift.lateN}</div>
                </div>
              </div>
              <p className="hedge">
                Full-mark answers are left out: you cannot mark someone above the total, so they cannot show generosity
                either way. This is a pattern in the data, not a diagnosis — you may have been right to tighten.
              </p>
            </>
          ) : (
            <p className="finding-detail">
              No usable difference between the first and second half of the pile. Marking held steady.
            </p>
          )}
        </div>
      </section>

      {/* ---------------------------------------------------------- length */}
      <section className="panel">
        <div className="panel-head">
          <h2>Were you rewarding good answers, or long ones?</h2>
          <span className={`pill ${length.significant ? 'pill-review' : 'pill-quiet'}`}>
            {length.significant ? 'worth reading' : 'nothing found'}
          </span>
        </div>
        <div className="panel-body stack">
          {length.significant ? (
            <>
              <p className="finding-detail">
                Across <strong>{length.groups} groups</strong> of answers Markable credited identically against every
                criterion, the ones over {length.threshold} words averaged{' '}
                <strong>{length.advantage.toFixed(2)} marks more</strong>.
              </p>
              <div className="stack" style={{ gap: 12, maxWidth: 520 }}>
                <div>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="stat-label">Over {length.threshold} words · {length.longN} answers</span>
                    <span className="mark mark-faculty">{length.longMean.toFixed(2)}</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${longPct * 100}%`, background: 'var(--faculty)' }} />
                  </div>
                </div>
                <div>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="stat-label">{length.threshold} words or fewer · {length.shortN} answers</span>
                    <span className="mark">{length.shortMean.toFixed(2)}</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${shortPct * 100}%`, background: 'var(--muted)' }} />
                  </div>
                </div>
              </div>
              <p className="hedge">
                The comparison happens inside each group of identically-credited answers, so &ldquo;these earned the
                same credit&rdquo; is held fixed and only length varies. Comparing long against short across the whole
                cohort would only rediscover that students who know more write more.
              </p>
            </>
          ) : (
            <>
              <p className="finding-detail">
                Longer answers did sit <strong>{length.advantage.toFixed(2)} marks</strong> above shorter ones with the
                same credited work. Markable is not reporting it as a finding, because the effect does not survive its own
                check.
              </p>
              <div className="stat-row">
                <div>
                  <div className="stat-label">All {length.longN + length.shortN} comparable answers</div>
                  <div className="stat-value">{length.advantage > 0 ? '+' : ''}{length.advantage.toFixed(2)}</div>
                </div>
                <div>
                  <div className="stat-label">Excluding the {length.ceilingN} at full marks</div>
                  <div className="stat-value" style={{ color: 'var(--good)' }}>
                    {length.advantageExCeiling > 0 ? '+' : ''}{length.advantageExCeiling.toFixed(2)}
                  </div>
                </div>
              </div>
              <p className="hedge">
                {length.ceilingN} answers were already at {QUESTION.totalMarks}/{QUESTION.totalMarks}, and a mark that
                cannot go higher cannot show generosity. Drop those and the gap reverses sign — so the apparent reward
                for length is the mark ceiling, not a habit. A finding that flips when you remove a known artefact is
                not a finding, and Markable would rather say so than hand you a number to repeat.
              </p>
            </>
          )}
        </div>
      </section>

      {/* ----------------------------------------------------------- pairs */}
      <section className="panel">
        <div className="panel-head">
          <h2>
            {pairs.length} {pairs.length === 1 ? 'pair' : 'pairs'} worth comparing
          </h2>
          <span className="pill pill-quiet">{consistency.diverging} found, {pairs.length} shown</span>
        </div>
        <div className="panel-body stack">
          {pairs.length === 0 ? (
            <p className="finding-detail">
              No two answers were close enough in wording, credited the same way, and marked far enough apart to be
              worth putting side by side.
            </p>
          ) : (
            <p className="finding-detail">
              Markable credited {pairs.length === 1 ? 'this pair' : 'each of these pairs'} the same way against every
              criterion, but your marks differ by{' '}
              {gapRange} marks. Open{' '}
              {pairs.length === 1 ? 'it' : 'one'} and decide whether the difference is justified — often it is.
            </p>
          )}
          <PairCompare pairs={pairs} criteria={CRITERIA} />
          <p className="hedge">
            Deduplicated so each script appears once. {consistency.diverging} raw combinations diverge by 2 or more,
            but inside a group of similarly-marked answers most of those are the same disagreement counted repeatedly.
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>So what do I do about it?</h3>
        </div>
        <div className="panel-body stack">
          <p className="hedge">
            Findings on their own are just uncomfortable reading. Markable turns each of these into the smallest thing
            that would change it next time.
          </p>
          <div className="row">
            <Link href="/improve" className="btn" style={{ textDecoration: 'none' }}>
              What happens next
            </Link>
            <Link href="/questions" className="btn btn-ghost" style={{ textDecoration: 'none' }}>
              Was the question fair?
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
