// Timer — displays the remaining exam time and turns amber/red as time runs
// low. It is a presentational component; the countdown logic lives in useTimer
// and the value is persisted by the exam store.

import { formatDuration } from '../../services/AnalyticsService';

export function Timer({
  remaining,
  total,
  paused,
}: {
  remaining: number;
  total: number;
  paused?: boolean;
}) {
  const ratio = total > 0 ? remaining / total : 1;
  let tone = 'text-slate-700 dark:text-slate-200 border-slate-300 dark:border-navy-600';
  if (ratio <= 0.1) tone = 'text-rose-600 dark:text-rose-400 border-rose-400 animate-pulse';
  else if (ratio <= 0.25) tone = 'text-amber-600 dark:text-amber-400 border-amber-400';

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border-2 bg-white px-3 py-1.5 font-mono text-sm font-semibold tabular-nums dark:bg-navy-800 ${tone}`}
      title="Time remaining"
    >
      <span aria-hidden>⏱</span>
      <span>{formatDuration(remaining)}</span>
      {paused && <span className="text-xs font-sans font-normal text-slate-400">(paused)</span>}
    </div>
  );
}
