// DomainBreakdown — per-domain score breakdown for the results screen: a bar
// chart plus a detailed list showing each domain's percentage, raw score, and
// official exam weighting.

import type { DomainScore } from '../../types/Exam';
import { DomainBarChart } from '../Charts/Charts';
import { ProgressBar } from '../common/ui';
import { getDomainMeta } from '../../services/QuestionService';

export function DomainBreakdown({ scores }: { scores: DomainScore[] }) {
  const present = scores.filter((s) => s.total > 0);

  return (
    <div className="space-y-6">
      <DomainBarChart scores={scores} />

      <ul className="space-y-4">
        {present.map((s) => {
          const meta = getDomainMeta(s.domain);
          const color = meta?.color ?? '#1a7aff';
          return (
            <li key={s.domain}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-200">{s.domain}</span>
                <span className="font-semibold" style={{ color }}>
                  {s.percentage}%
                </span>
              </div>
              <ProgressBar value={s.percentage} max={100} color={color} />
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {s.correct} of {s.total} correct · exam weight ~{s.weight}%
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
