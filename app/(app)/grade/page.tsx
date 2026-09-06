import GradeSession from '@/components/GradeSession';
import { SCRIPTS, QUESTION, CRITERIA, MARKING_RUN } from '@/lib/data';

export const metadata = { title: 'Grade · NORM' };

export default function GradePage() {
  return (
    <GradeSession
      question={{ paper: QUESTION.paper, question: QUESTION.question, totalMarks: QUESTION.totalMarks }}
      criteria={CRITERIA}
      scripts={SCRIPTS}
      markingRun={MARKING_RUN}
    />
  );
}
