// QuestionPalette — a color-coded grid overview of every question in the exam.
// Clicking a cell jumps to that question. Used in the exam sidebar and the
// review screen.

import type { Question, UserResponse } from '../../types/Question';
import { isAnswered } from '../../services/QuestionService';

interface PaletteProps {
  questions: Question[];
  responses: Record<string, UserResponse>;
  currentIndex: number;
  onJump: (index: number) => void;
}

export function QuestionPalette({ questions, responses, currentIndex, onJump }: PaletteProps) {
  return (
    <div>
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-5 lg:grid-cols-6">
        {questions.map((q, index) => {
          const r = responses[q.id];
          const answered = isAnswered(q, r);
          const isCurrent = index === currentIndex;

          let base =
            'border-slate-300 bg-slate-100 text-slate-600 dark:border-navy-600 dark:bg-navy-800 dark:text-slate-300';
          if (answered)
            base =
              'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
          if (r?.flagged)
            base = 'border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300';

          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onJump(index)}
              className={`relative flex h-10 items-center justify-center rounded-lg border-2 text-xs font-semibold transition-transform hover:scale-105 ${base} ${
                isCurrent ? 'ring-2 ring-azure-500 ring-offset-1 dark:ring-offset-navy-900' : ''
              }`}
              title={`Question ${index + 1}${q.caseStudyId ? ' (case study)' : ''}`}
            >
              {index + 1}
              {r?.bookmarked && (
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-azure-500" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-slate-500 dark:text-slate-400">
        <LegendDot className="border-emerald-500 bg-emerald-500/15" label="Answered" />
        <LegendDot className="border-slate-300 bg-slate-100 dark:border-navy-600 dark:bg-navy-800" label="Unanswered" />
        <LegendDot className="border-amber-500 bg-amber-500/15" label="Flagged" />
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-azure-500" /> Bookmarked
        </span>
      </div>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded border-2 ${className}`} />
      {label}
    </span>
  );
}
