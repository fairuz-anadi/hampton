import AppNav from '@/components/AppNav';
import { SCRIPTS, QUESTION, triageCounts } from '@/lib/data';
import { buildFindings, findCommonErrors } from '@/lib/insights';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const counts = triageCounts();
  const findings = buildFindings(SCRIPTS, QUESTION.totalMarks).length;
  const mistakes = findCommonErrors(SCRIPTS).length;

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-paper">
      <AppNav counts={counts} findings={findings} mistakes={mistakes} />
      <main className="main flex-1">{children}</main>
    </div>
  );
}
