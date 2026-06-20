// MultiSelect — checkbox selection for `multi`, `choose2`, and `choose3`.
// choose2/choose3 hard-cap the number of selections; multi allows any number.

import type { QuestionTypeProps } from './types';
import type { QuestionType } from '../../types/Question';

/** Returns the hard selection cap for a question type, or null for unlimited. */
function selectionCap(type: QuestionType): number | null {
  if (type === 'choose2') return 2;
  if (type === 'choose3') return 3;
  return null;
}

export function MultiSelect({ question, response, onRespond, reveal, disabled }: QuestionTypeProps) {
  const selected = response?.selected ?? [];
  const correct = new Set(question.correct ?? []);
  const cap = selectionCap(question.type);

  const toggle = (id: string) => {
    if (disabled) return;
    const isOn = selected.includes(id);
    let next: string[];
    if (isOn) {
      next = selected.filter((x) => x !== id);
    } else {
      // Enforce the cap for choose2/choose3 by ignoring extra clicks.
      if (cap !== null && selected.length >= cap) return;
      next = [...selected, id];
    }
    onRespond({ selected: next });
  };

  return (
    <div>
      {cap !== null && (
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-azure-600 dark:text-azure-300">
          Select exactly {cap} — {selected.length}/{cap} chosen
        </p>
      )}
      <ul className="space-y-3">
        {(question.answers ?? []).map((a, idx) => {
          const isSelected = selected.includes(a.id);
          const isCorrect = correct.has(a.id);
          const atCap = cap !== null && selected.length >= cap && !isSelected;

          let stateClass =
            'border-slate-300 dark:border-navy-600 hover:border-azure-400 dark:hover:border-azure-500';
          if (reveal) {
            if (isCorrect) stateClass = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10';
            else if (isSelected) stateClass = 'border-rose-500 bg-rose-50 dark:bg-rose-500/10';
            else stateClass = 'border-slate-200 dark:border-navy-700 opacity-80';
          } else if (isSelected) {
            stateClass = 'border-azure-500 bg-azure-50 dark:bg-azure-500/10';
          }

          return (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => toggle(a.id)}
                disabled={disabled || atCap}
                className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors ${stateClass} ${
                  disabled || atCap ? 'cursor-default' : 'cursor-pointer'
                } ${atCap ? 'opacity-60' : ''}`}
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-md border-2 text-xs font-semibold ${
                    isSelected
                      ? 'border-azure-500 bg-azure-500 text-white'
                      : 'border-slate-400 text-slate-500 dark:border-navy-500'
                  }`}
                >
                  {isSelected ? '✓' : String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1 text-sm leading-relaxed text-slate-800 dark:text-slate-100">
                  {a.text}
                </span>
                {reveal && isCorrect && (
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    ✓
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
