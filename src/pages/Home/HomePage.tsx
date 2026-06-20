// HomePage — the dashboard. Summarizes progress, offers quick-start exams,
// shows the official domain weighting, and lists recent exam attempts.

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { computeAnalytics } from '../../services/AnalyticsService';
import { defaultConfig, EXAM_LENGTHS } from '../../services/ExamGenerator';
import { getDomains, getActiveCertMeta } from '../../services/QuestionService';
import { DashboardStats } from '../../components/Dashboard/DashboardStats';
import { RecentExams } from '../../components/Dashboard/RecentExams';
import { Card } from '../../components/common/ui';
import type { ExamLength, ExamResult } from '../../types/Exam';

export function HomePage() {
  const navigate = useNavigate();
  const history = useAppStore((s) => s.history);
  const flashProgress = useAppStore((s) => s.flashProgress);
  const activeSession = useAppStore((s) => s.activeSession);
  const startExam = useAppStore((s) => s.startExam);

  const analytics = useMemo(
    () => computeAnalytics(history, flashProgress),
    [history, flashProgress],
  );
  const domains = useMemo(() => getDomains(), []);
  const meta = getActiveCertMeta();

  const quickStart = (length: ExamLength) => {
    startExam(defaultConfig(length, true));
    navigate('/exam');
  };

  const viewResult = (result: ExamResult) => {
    // Surface the chosen result on the results page.
    useAppStore.setState({ lastResult: result });
    navigate('/results');
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          {meta.shortName} Study Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {meta.name} — practice exams, case studies, flashcards, and analytics.
        </p>
      </header>

      <DashboardStats analytics={analytics} />

      {/* Resume banner */}
      {activeSession && (
        <Card className="flex flex-col items-start justify-between gap-3 border-azure-400 bg-azure-50 p-5 dark:bg-azure-500/10 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-bold text-azure-700 dark:text-azure-200">
              You have an exam in progress
            </p>
            <p className="text-xs text-azure-600 dark:text-azure-300">
              {activeSession.questionIds.length} questions ·{' '}
              {Object.keys(activeSession.responses).length} answered
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/exam')}
            className="rounded-lg bg-azure-600 px-4 py-2 text-sm font-semibold text-white hover:bg-azure-500"
          >
            Resume exam →
          </button>
        </Card>
      )}

      {/* Quick start */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">Start a practice exam</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {EXAM_LENGTHS.map((len) => (
            <button
              key={len}
              type="button"
              onClick={() => quickStart(len)}
              className="group rounded-xl border-2 border-slate-200 bg-white p-5 text-center transition-colors hover:border-azure-500 dark:border-navy-700 dark:bg-navy-800"
            >
              <p className="text-3xl font-bold text-slate-900 transition-colors group-hover:text-azure-500 dark:text-white">
                {len}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">questions · timed</p>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
          Want to choose domains or difficulty? Open the{' '}
          <button onClick={() => navigate('/exam')} className="font-semibold text-azure-500 underline">
            Exam page
          </button>{' '}
          to customize.
        </p>
      </section>

      {/* Domain weighting */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">
          Official exam domains
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {domains.map((d) => (
            <Card key={d.name} className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800 dark:text-white">
                  {d.shortName}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-bold"
                  style={{ backgroundColor: `${d.color}22`, color: d.color }}
                >
                  {d.minWeight}–{d.maxWeight}%
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {d.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Recent exams */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">Recent exams</h2>
        <RecentExams history={history} onSelect={viewResult} />
      </section>
    </div>
  );
}
