import AppNav from '@/components/AppNav';
import { SCRIPTS, QUESTION, CRITERIA, triageCounts } from '@/lib/data';
import { buildFindings, findCommonErrors, criterionPerformance } from '@/lib/insights';
import { buildActions } from '@/lib/actions';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const counts = triageCounts();
  const findings = buildFindings(SCRIPTS, QUESTION.totalMarks).length;
  const mistakes = findCommonErrors(SCRIPTS).length;
  const flaggedSteps = criterionPerformance(SCRIPTS, CRITERIA).filter(
    (c) => c.verdict === 'review-the-question'
  ).length;
  const actions = buildActions(SCRIPTS, CRITERIA, QUESTION.totalMarks).length;

  return (
    <div className="app-ground flex min-h-screen flex-col md:flex-row">
      <AppNav
        counts={counts}
        findings={findings}
        mistakes={mistakes}
        flaggedSteps={flaggedSteps}
        actions={actions}
      />
      <main className="main flex-1">{children}</main>
    </div>
  );
}
