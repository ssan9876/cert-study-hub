// DashboardStats — at-a-glance KPIs on the home page, derived from the user's
// exam history and flashcard progress.

import type { AnalyticsSummary } from '../../types/Exam';
import { formatDuration } from '../../services/AnalyticsService';
import { StatTile } from '../common/ui';

export function DashboardStats({ analytics }: { analytics: AnalyticsSummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <StatTile label="Exams taken" value={analytics.totalExams} accent="#1a7aff" />
      <StatTile label="Avg score" value={`${analytics.averageScore}%`} accent="#22c1a6" />
      <StatTile label="Best score" value={`${analytics.bestScore}%`} accent="#10b981" />
      <StatTile
        label="Questions"
        value={analytics.totalQuestionsAnswered}
        accent="#a070ff"
      />
      <StatTile
        label="Time studied"
        value={formatDuration(analytics.totalTimeSeconds)}
        accent="#ff8a4d"
      />
      <StatTile
        label="Streak"
        value={`${analytics.currentStreak}🔥`}
        hint={`Best ${analytics.longestStreak}`}
        accent="#ffd24d"
      />
    </div>
  );
}
