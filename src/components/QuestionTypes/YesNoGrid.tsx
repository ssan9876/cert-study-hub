// YesNoGrid — renders a configuration table where each requirement (row) is
// answered Yes or No. All rows must be answered before the question counts as
// complete (enforced by QuestionService.isAnswered).

import type { QuestionTypeProps } from './types';

export function YesNoGrid({ question, response, onRespond, reveal, disabled }: QuestionTypeProps) {
  const answers = response?.yesno ?? {};

  const setRow = (statementId: string, value: boolean) => {
    if (disabled) return;
    onRespond({ yesno: { ...answers, [statementId]: value } });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 dark:border-navy-600">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-100 text-left dark:bg-navy-800">
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Statement</th>
            <th className="w-24 px-2 py-3 text-center font-semibold text-slate-700 dark:text-slate-200">
              Yes
            </th>
            <th className="w-24 px-2 py-3 text-center font-semibold text-slate-700 dark:text-slate-200">
              No
            </th>
          </tr>
        </thead>
        <tbody>
          {(question.statements ?? []).map((s) => {
            const chosen = answers[s.id];
            const userCorrect = chosen === s.correct;

            return (
              <tr
                key={s.id}
                className="border-t border-slate-200 dark:border-navy-700"
              >
                <td className="px-4 py-3 text-slate-800 dark:text-slate-100">
                  {s.text}
                  {reveal && (
                    <span
                      className={`ml-2 text-xs font-semibold ${
                        userCorrect
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      (Correct: {s.correct ? 'Yes' : 'No'})
                    </span>
                  )}
                </td>
                {[true, false].map((val) => {
                  const active = chosen === val;
                  const isCorrectCell = reveal && s.correct === val;
                  return (
                    <td key={String(val)} className="px-2 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setRow(s.id, val)}
                        disabled={disabled}
                        className={`h-9 w-16 rounded-lg border-2 text-xs font-semibold transition-colors ${
                          isCorrectCell
                            ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : active
                              ? 'border-azure-500 bg-azure-500 text-white'
                              : 'border-slate-300 text-slate-600 hover:border-azure-400 dark:border-navy-500 dark:text-slate-300'
                        } ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        {val ? 'Yes' : 'No'}
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
