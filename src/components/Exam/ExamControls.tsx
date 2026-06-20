// ExamControls — bottom navigation bar for the exam: previous/next, a progress
// bar, and a button to open the review screen before final submission.

import { ProgressBar } from '../common/ui';

interface ExamControlsProps {
  index: number;
  total: number;
  answered: number;
  onPrev: () => void;
  onNext: () => void;
  onReview: () => void;
}

export function ExamControls({
  index,
  total,
  answered,
  onPrev,
  onNext,
  onReview,
}: ExamControlsProps) {
  const isFirst = index === 0;
  const isLast = index === total - 1;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="w-28 flex-none text-xs font-medium text-slate-500 dark:text-slate-400">
          {answered}/{total} answered
        </span>
        <ProgressBar value={answered} max={total} />
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={isFirst}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:border-navy-600 dark:text-slate-300 dark:hover:bg-navy-800"
        >
          ← Previous
        </button>

        <button
          type="button"
          onClick={onReview}
          className="rounded-lg border border-azure-500 px-4 py-2 text-sm font-semibold text-azure-600 transition-colors hover:bg-azure-500/10 dark:text-azure-300"
        >
          Review &amp; Submit
        </button>

        {isLast ? (
          <button
            type="button"
            onClick={onReview}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
          >
            Finish →
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            className="rounded-lg bg-azure-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-azure-500"
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}
