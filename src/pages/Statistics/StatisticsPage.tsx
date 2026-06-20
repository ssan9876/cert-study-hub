// StatisticsPage — cross-exam analytics: score trend, per-domain mastery radar,
// the study streak heatmap, and headline totals including flashcards mastered.

import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { computeAnalytics, formatDuration } from '../../services/AnalyticsService';
import { ScoreTrendChart, DomainRadarChart } from '../../components/Charts/Charts';
import { ActivityHeatmap } from '../../components/Analytics/ActivityHeatmap';
import { getDomainMeta } from '../../services/QuestionService';
import { Card, StatTile, ProgressBar } from '../../components/common/ui';

export function StatisticsPage() {
  const history = useAppStore((s) => s.history);
  const flashProgress = useAppStore((s) => s.flashProgress);

  const analytics = useMemo(
    () => computeAnalytics(history, flashProgress),
    [history, flashProgress],
  );

  // The two lowest-mastery domains are highlighted as focus areas.
  const weakestDomains = useMemo(
    () =>
      [...analytics.domainMastery]
        .filter(() => history.length > 0)
        .sort((a, b) => a.mastery - b.mastery)
        .slice(0, 2)
        .map((d) => d.domain),
    [analytics.domainMastery, history.length],
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Statistics</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Track your progress across every practice exam and flashcard session.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Exams" value={analytics.totalExams} accent="#1a7aff" />
        <StatTile label="Avg score" value={`${analytics.averageScore}%`} accent="#22c1a6" />
        <StatTile label="Best" value={`${analytics.bestScore}%`} accent="#10b981" />
        <StatTile label="Questions" value={analytics.totalQuestionsAnswered} accent="#a070ff" />
        <StatTile label="Time" value={formatDuration(analytics.totalTimeSeconds)} accent="#ff8a4d" />
        <StatTile
          label="Cards mastered"
          value={analytics.flashcardsMastered}
          accent="#ffd24d"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Score trend</h2>
          <ScoreTrendChart data={analytics.scoreTrend} />
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Domain mastery</h2>
          <DomainRadarChart data={analytics.domainMastery} />
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Study streak</h2>
        <ActivityHeatmap
          activeDays={analytics.activeDays}
          currentStreak={analytics.currentStreak}
          longestStreak={analytics.longestStreak}
        />
      </Card>

      <Card className="p-5">
        <h2 className="mb-1 text-lg font-bold text-slate-900 dark:text-white">Domain mastery detail</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          {weakestDomains.length > 0
            ? `Focus area${weakestDomains.length > 1 ? 's' : ''}: ${weakestDomains.join(' and ')}.`
            : 'Complete an exam to populate your mastery breakdown.'}
        </p>
        <ul className="space-y-4">
          {analytics.domainMastery.map((d) => {
            const color = getDomainMeta(d.domain)?.color ?? '#1a7aff';
            const isWeak = weakestDomains.includes(d.domain);
            return (
              <li key={d.domain}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    {d.domain}
                    {isWeak && (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                        focus
                      </span>
                    )}
                  </span>
                  <span className="font-semibold" style={{ color }}>
                    {d.mastery}%
                  </span>
                </div>
                <ProgressBar value={d.mastery} max={100} color={color} />
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
