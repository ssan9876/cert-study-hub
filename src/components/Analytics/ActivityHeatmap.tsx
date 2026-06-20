// ActivityHeatmap — a GitHub-style calendar heatmap of study activity over the
// last ~17 weeks, plus a current/longest streak readout. Pure SVG-free CSS grid;
// no extra dependencies.

const WEEKS = 17;
const DAY_MS = 86_400_000;

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function ActivityHeatmap({
  activeDays,
  currentStreak,
  longestStreak,
}: {
  activeDays: string[];
  currentStreak: number;
  longestStreak: number;
}) {
  const active = new Set(activeDays);

  // Build a grid ending today; align so the last column is the current week.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Start on the Sunday WEEKS-1 weeks before this week.
  const start = new Date(today.getTime() - (WEEKS - 1) * 7 * DAY_MS);
  start.setTime(start.getTime() - start.getDay() * DAY_MS);

  const columns: Date[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    const col: Date[] = [];
    for (let d = 0; d < 7; d++) {
      col.push(new Date(start.getTime() + (w * 7 + d) * DAY_MS));
    }
    columns.push(col);
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-4">
        <div>
          <p className="text-2xl font-bold text-azure-500">{currentStreak}🔥</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Current streak (days)</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">{longestStreak}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Longest streak</p>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-2">
        {columns.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-1">
            {col.map((day) => {
              const future = day.getTime() > today.getTime();
              const on = active.has(isoDay(day));
              return (
                <div
                  key={day.getTime()}
                  title={isoDay(day)}
                  className={`h-3 w-3 rounded-sm ${
                    future
                      ? 'bg-transparent'
                      : on
                        ? 'bg-azure-500'
                        : 'bg-slate-200 dark:bg-navy-700'
                  }`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
        <span>Less</span>
        <span className="h-3 w-3 rounded-sm bg-slate-200 dark:bg-navy-700" />
        <span className="h-3 w-3 rounded-sm bg-azure-500/50" />
        <span className="h-3 w-3 rounded-sm bg-azure-500" />
        <span>More</span>
      </div>
    </div>
  );
}
