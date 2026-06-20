// ResultsPage — renders the most recently graded exam result. If there is no
// result yet (e.g. on a fresh visit), it points the user back to the exam.

import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { ResultsScreen } from '../../components/Results/ResultsScreen';
import { defaultConfig } from '../../services/ExamGenerator';
import { Card } from '../../components/common/ui';
import type { ExamLength } from '../../types/Exam';

export function ResultsPage() {
  const navigate = useNavigate();
  const lastResult = useAppStore((s) => s.lastResult);
  const startExam = useAppStore((s) => s.startExam);

  if (!lastResult) {
    return (
      <div className="mx-auto max-w-md">
        <Card className="p-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No results to show yet. Take a practice exam to see your detailed report here.
          </p>
          <button
            type="button"
            onClick={() => navigate('/exam')}
            className="mt-4 rounded-lg bg-azure-600 px-4 py-2 text-sm font-semibold text-white hover:bg-azure-500"
          >
            Start an exam
          </button>
        </Card>
      </div>
    );
  }

  const retry = () => {
    // Re-run an exam with the same configuration.
    const len = lastResult.totalQuestions as ExamLength;
    startExam({ ...defaultConfig(len, lastResult.config.durationSeconds > 0), ...lastResult.config });
    navigate('/exam');
  };

  return <ResultsScreen result={lastResult} onRetry={retry} />;
}
