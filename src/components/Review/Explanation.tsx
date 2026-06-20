// Explanation — a reusable correctness summary for a graded question. Shows
// whether the response was correct (with partial-credit awareness), the full
// explanation text, and MS Learn references. Used for instant feedback and on
// the results screen.

import type { Question, UserResponse } from '../../types/Question';
import { gradeQuestion } from '../../services/QuestionService';

export function Explanation({
  question,
  response,
}: {
  question: Question;
  response?: UserResponse;
}) {
  const { score, correct } = gradeQuestion(question, response);
  const partial = !correct && score > 0;

  const tone = correct
    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
    : partial
      ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10'
      : 'border-rose-500 bg-rose-50 dark:bg-rose-500/10';

  const label = correct
    ? 'Correct'
    : partial
      ? `Partially correct (${Math.round(score * 100)}%)`
      : 'Incorrect';

  const labelTone = correct
    ? 'text-emerald-700 dark:text-emerald-300'
    : partial
      ? 'text-amber-700 dark:text-amber-300'
      : 'text-rose-700 dark:text-rose-300';

  return (
    <div className={`rounded-xl border-2 p-4 ${tone}`}>
      <p className={`mb-2 text-sm font-bold ${labelTone}`}>
        {correct ? '✓' : partial ? '◐' : '✕'} {label}
      </p>
      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
        {question.explanation}
      </p>
      {question.references.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            References
          </p>
          <ul className="space-y-1">
            {question.references.map((ref) => (
              <li key={ref}>
                <a
                  href={ref}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-xs text-azure-600 underline hover:text-azure-500 dark:text-azure-300"
                >
                  {ref}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {question.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {question.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] text-slate-600 dark:bg-navy-700 dark:text-slate-300"
            >
              #{t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
