// SingleChoice — radio-style selection for `single` and `casestudy` questions
// (exactly one correct answer).

import type { QuestionTypeProps } from './types';

export function SingleChoice({ question, response, onRespond, reveal, disabled }: QuestionTypeProps) {
  const selected = response?.selected ?? [];
  const correct = new Set(question.correct ?? []);

  const choose = (id: string) => {
    if (disabled) return;
    onRespond({ selected: [id] });
  };

  return (
    <ul className="space-y-3">
      {(question.answers ?? []).map((a, idx) => {
        const isSelected = selected.includes(a.id);
        const isCorrect = correct.has(a.id);

        // Determine the visual state once `reveal` is on.
        let stateClass =
          'border-slate-300 dark:border-navy-600 hover:border-azure-400 dark:hover:border-azure-500';
        if (reveal) {
          if (isCorrect)
            stateClass = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10';
          else if (isSelected)
            stateClass = 'border-rose-500 bg-rose-50 dark:bg-rose-500/10';
          else stateClass = 'border-slate-200 dark:border-navy-700 opacity-80';
        } else if (isSelected) {
          stateClass = 'border-azure-500 bg-azure-50 dark:bg-azure-500/10';
        }

        return (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => choose(a.id)}
              disabled={disabled}
              className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors ${stateClass} ${
                disabled ? 'cursor-default' : 'cursor-pointer'
              }`}
            >
              <span
                className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 text-xs font-semibold ${
                  isSelected
                    ? 'border-azure-500 bg-azure-500 text-white'
                    : 'border-slate-400 text-slate-500 dark:border-navy-500'
                }`}
              >
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="flex-1 text-sm leading-relaxed text-slate-800 dark:text-slate-100">
                {a.text}
              </span>
              {reveal && isCorrect && (
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  ✓
                </span>
              )}
              {reveal && isSelected && !isCorrect && (
                <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">✕</span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
