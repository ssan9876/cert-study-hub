// RecentExams — a list of the most recent completed exams with score, verdict,
// and timing. Selecting one reopens its full results report.

import type { ExamResult } from '../../types/Exam';
import { formatDuration } from '../../services/AnalyticsService';
import { Card } from '../common/ui';

export function RecentExams({
  history,
  onSelect,
}: {
  history: ExamResult[];
  onSelect: (result: ExamResult) => void;
}) {
  const recent = [...history].sort((a, b) => b.takenAt - a.takenAt).slice(0, 6);

  if (recent.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No exams yet. Start your first practice exam to see your history here.
        </p>
      </Card>
    );
  }

  return (
    <Card className="divide-y divide-slate-200 dark:divide-navy-700">
      {recent.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => onSelect(r)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-navy-800"
        >
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-white">
              {r.totalQuestions}-question exam
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {new Date(r.takenAt).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}{' '}
              · {formatDuration(r.totalTimeSeconds)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-slate-800 dark:text-white">
              {r.percentage}%
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                r.passed
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
              }`}
            >
              {r.passed ? 'Pass' : 'Fail'}
            </span>
          </div>
        </button>
      ))}
    </Card>
  );
}
