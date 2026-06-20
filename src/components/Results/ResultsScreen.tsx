// ResultsScreen — the post-exam report. Shows the overall scaled score and
// pass/fail verdict, key timing stats, the per-domain breakdown, weakest
// objectives with study recommendations, and a full per-question review with
// the user's answer, the correct answer, and the explanation. Supports retry
// and JSON export.

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { ExamResult } from '../../types/Exam';
import { formatDuration } from '../../services/AnalyticsService';
import { getQuestionById, getDomainMeta } from '../../services/QuestionService';
import { QuestionRenderer } from '../QuestionTypes/QuestionRenderer';
import { Explanation } from '../Review/Explanation';
import { DomainBreakdown } from './DomainBreakdown';
import { Card, StatTile, DomainBadge, DifficultyBadge } from '../common/ui';

function ScoreRing({ percentage, passed }: { percentage: number; passed: boolean }) {
  const radius = 64;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (Math.min(100, percentage) / 100) * circ;
  const color = passed ? '#10b981' : '#f43f5e';
  return (
    <div className="relative flex h-44 w-44 items-center justify-center">
      <svg className="h-44 w-44 -rotate-90" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} className="fill-none stroke-slate-200 dark:stroke-navy-700" strokeWidth="12" />
        <motion.circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-3xl font-bold text-slate-900 dark:text-white">{percentage}%</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">score</p>
      </div>
    </div>
  );
}

export function ResultsScreen({
  result,
  onRetry,
}: {
  result: ExamResult;
  onRetry: () => void;
}) {
  const [openReview, setOpenReview] = useState(false);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `az104-result-${new Date(result.takenAt).toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Verdict banner */}
      <Card className="overflow-hidden">
        <div
          className={`flex flex-col items-center gap-6 p-6 sm:flex-row sm:justify-between ${
            result.passed
              ? 'bg-emerald-50 dark:bg-emerald-500/10'
              : 'bg-rose-50 dark:bg-rose-500/10'
          }`}
        >
          <div className="flex items-center gap-6">
            <ScoreRing percentage={result.percentage} passed={result.passed} />
            <div>
              <span
                className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${
                  result.passed
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}
              >
                {result.passed ? 'PASS' : 'FAIL'}
              </span>
              <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                {result.scaledScore}
                <span className="text-base font-normal text-slate-400"> / {result.scaledMax}</span>
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Passing score is {result.passMark}. You answered {result.rawCorrect} of{' '}
                {result.totalQuestions} questions fully correct.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onRetry}
              className="rounded-lg bg-azure-600 px-4 py-2 text-sm font-semibold text-white hover:bg-azure-500"
            >
              Retry exam
            </button>
            <button
              type="button"
              onClick={exportJson}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-navy-600 dark:text-slate-300 dark:hover:bg-navy-800"
            >
              Export JSON
            </button>
          </div>
        </div>
      </Card>

      {/* Timing stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Total time" value={formatDuration(result.totalTimeSeconds)} accent="#1a7aff" />
        <StatTile label="Avg / question" value={`${result.avgTimePerQuestion}s`} accent="#a070ff" />
        <StatTile label="Questions" value={result.totalQuestions} accent="#22c1a6" />
        <StatTile label="Raw correct" value={result.rawCorrect} accent="#10b981" />
      </div>

      {/* Domain breakdown */}
      <Card className="p-5">
        <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
          Domain breakdown
        </h2>
        <DomainBreakdown scores={result.domainScores} />
      </Card>

      {/* Study recommendations */}
      {result.weakObjectives.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-1 text-lg font-bold text-slate-900 dark:text-white">
            Study these topics
          </h2>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Objectives where you lost the most points, weakest first.
          </p>
          <ul className="space-y-2">
            {result.weakObjectives.map((obj) => (
              <li
                key={obj}
                className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200"
              >
                <span aria-hidden>📌</span>
                {obj}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Per-question review */}
      <Card className="p-5">
        <button
          type="button"
          onClick={() => setOpenReview((v) => !v)}
          className="flex w-full items-center justify-between text-lg font-bold text-slate-900 dark:text-white"
        >
          Review all {result.totalQuestions} questions
          <span className="text-azure-500">{openReview ? '▲' : '▼'}</span>
        </button>

        {openReview && (
          <div className="mt-5 space-y-8">
            {result.questionIds.map((qId, i) => {
              const q = getQuestionById(qId);
              if (!q) return null;
              const response = result.responses[qId];
              const meta = getDomainMeta(q.domain);
              return (
                <div
                  key={qId}
                  className="border-t border-slate-200 pt-6 first:border-t-0 first:pt-0 dark:border-navy-700"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-400">Q{i + 1}</span>
                    <DomainBadge domain={q.domain} />
                    <DifficultyBadge difficulty={q.difficulty} />
                    {q.caseStudyId && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={{ backgroundColor: `${meta?.color ?? '#1a7aff'}22`, color: meta?.color }}
                      >
                        Case study
                      </span>
                    )}
                  </div>
                  <p className="mb-3 text-sm font-medium text-slate-900 dark:text-white">
                    {q.question}
                  </p>
                  <QuestionRenderer
                    question={q}
                    response={response}
                    onRespond={() => {}}
                    reveal
                    disabled
                  />
                  <div className="mt-3">
                    <Explanation question={q} response={response} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
