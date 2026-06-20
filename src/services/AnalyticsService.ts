// AnalyticsService — grades a completed exam session into an ExamResult, and
// computes cross-exam analytics (trends, mastery, streaks) for the stats page.

import type {
  ExamSession,
  ExamResult,
  DomainScore,
  QuestionResult,
  AnalyticsSummary,
} from '../types/Exam';
import type { DomainName } from '../types/Question';
import type { CardProgress } from '../types/Flashcard';
import {
  getQuestionById,
  getDomains,
  gradeQuestion,
  getActiveCertMeta,
} from './QuestionService';

/** Convert a 0–1 fraction into a vendor-specific scaled score. */
export function toScaledScore(fraction: number, scaledMax: number): number {
  return Math.round(fraction * scaledMax);
}

/** Format seconds as `m:ss` or `h:mm:ss`. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function isoDay(epochMs: number): string {
  return new Date(epochMs).toISOString().slice(0, 10);
}

/**
 * Grades a submitted exam session, producing a full ExamResult with per-domain
 * breakdowns, weakest objectives, and a scaled score. Partial credit from
 * multi/yesno/ordering/matching questions feeds the overall percentage.
 */
export function gradeSession(session: ExamSession): ExamResult {
  const questionResults: QuestionResult[] = [];
  const domainAgg = new Map<DomainName, { score: number; total: number }>();

  let totalScore = 0;
  let rawCorrect = 0;
  let totalTime = 0;

  // Track failed score per objective to surface the weakest topics.
  const objectiveMiss = new Map<string, number>();

  for (const qId of session.questionIds) {
    const q = getQuestionById(qId);
    if (!q) continue;
    const response = session.responses[qId];
    const { score, correct } = gradeQuestion(q, response);
    const timeSpent = response?.timeSpent ?? 0;

    totalScore += score;
    if (correct) rawCorrect += 1;
    totalTime += timeSpent;

    const agg = domainAgg.get(q.domain) ?? { score: 0, total: 0 };
    agg.score += score;
    agg.total += 1;
    domainAgg.set(q.domain, agg);

    if (score < 1) {
      objectiveMiss.set(q.objective, (objectiveMiss.get(q.objective) ?? 0) + (1 - score));
    }

    questionResults.push({
      questionId: qId,
      correct,
      score,
      domain: q.domain,
      objective: q.objective,
      timeSpent,
    });
  }

  const meta = getActiveCertMeta();
  const totalQuestions = session.questionIds.length;
  const fraction = totalQuestions > 0 ? totalScore / totalQuestions : 0;
  const percentage = Math.round(fraction * 1000) / 10; // one decimal place
  const scaledScore = toScaledScore(fraction, meta.scaledMax);

  const domainScores: DomainScore[] = getDomains().map((d) => {
    const agg = domainAgg.get(d.name) ?? { score: 0, total: 0 };
    const pct = agg.total > 0 ? (agg.score / agg.total) * 100 : 0;
    return {
      domain: d.name,
      correct: Math.round(agg.score * 10) / 10,
      total: agg.total,
      percentage: Math.round(pct * 10) / 10,
      weight: d.weight,
    };
  });

  const weakObjectives = [...objectiveMiss.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([objective]) => objective);

  return {
    id: `result-${session.id}`,
    examId: session.id,
    certId: meta.id,
    config: session.config,
    takenAt: session.submittedAt ?? Date.now(),
    rawCorrect,
    totalQuestions,
    percentage,
    scaledScore,
    scaledMax: meta.scaledMax,
    passMark: meta.passMark,
    passed: scaledScore >= meta.passMark,
    domainScores,
    questionResults,
    avgTimePerQuestion: totalQuestions > 0 ? Math.round(totalTime / totalQuestions) : 0,
    totalTimeSeconds: totalTime,
    weakObjectives,
    questionIds: session.questionIds,
    responses: session.responses,
  };
}

/**
 * Computes the longest run of consecutive calendar days ending today (current
 * streak) and the longest streak ever, from a set of active ISO day strings.
 */
function computeStreaks(activeDays: string[]): { current: number; longest: number } {
  if (activeDays.length === 0) return { current: 0, longest: 0 };
  const days = [...new Set(activeDays)].sort();
  const dayMs = 86_400_000;

  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]!).getTime();
    const cur = new Date(days[i]!).getTime();
    if (cur - prev === dayMs) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  // Current streak: walk backwards from today (or yesterday) while days are present.
  const set = new Set(days);
  let current = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  // Allow the streak to count if the user studied today or, if not yet today, yesterday.
  if (!set.has(isoDay(cursor.getTime()))) {
    cursor.setTime(cursor.getTime() - dayMs);
  }
  while (set.has(isoDay(cursor.getTime()))) {
    current += 1;
    cursor.setTime(cursor.getTime() - dayMs);
  }

  return { current, longest: Math.max(longest, current) };
}

/** Aggregates exam history and flashcard progress into dashboard analytics. */
export function computeAnalytics(
  history: ExamResult[],
  flashProgress: Record<string, CardProgress>,
): AnalyticsSummary {
  const sorted = [...history].sort((a, b) => a.takenAt - b.takenAt);

  const totalQuestionsAnswered = sorted.reduce((s, r) => s + r.totalQuestions, 0);
  const totalTimeSeconds = sorted.reduce((s, r) => s + r.totalTimeSeconds, 0);
  const averageScore =
    sorted.length > 0 ? sorted.reduce((s, r) => s + r.percentage, 0) / sorted.length : 0;
  const bestScore = sorted.reduce((m, r) => Math.max(m, r.percentage), 0);

  // Domain mastery = average domain percentage across all exams that included it.
  const domainTotals = new Map<DomainName, { sum: number; count: number }>();
  sorted.forEach((r) => {
    r.domainScores.forEach((ds) => {
      if (ds.total === 0) return;
      const cur = domainTotals.get(ds.domain) ?? { sum: 0, count: 0 };
      cur.sum += ds.percentage;
      cur.count += 1;
      domainTotals.set(ds.domain, cur);
    });
  });

  const domainMastery = getDomains().map((d) => {
    const t = domainTotals.get(d.name);
    return { domain: d.name, mastery: t && t.count > 0 ? Math.round(t.sum / t.count) : 0 };
  });

  const scoreTrend = sorted.map((r) => ({
    date: new Date(r.takenAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    score: r.percentage,
  }));

  const examDays = sorted.map((r) => isoDay(r.takenAt));
  const flashDays = Object.values(flashProgress)
    .filter((c) => c.lastReviewedAt)
    .map((c) => isoDay(c.lastReviewedAt!));
  const activeDays = [...new Set([...examDays, ...flashDays])].sort();

  const { current, longest } = computeStreaks(activeDays);
  const flashcardsMastered = Object.values(flashProgress).filter((c) => c.stage === 'mastered').length;

  return {
    totalExams: sorted.length,
    totalQuestionsAnswered,
    totalTimeSeconds,
    averageScore: Math.round(averageScore * 10) / 10,
    bestScore: Math.round(bestScore * 10) / 10,
    currentStreak: current,
    longestStreak: longest,
    domainMastery,
    scoreTrend,
    activeDays,
    flashcardsMastered,
  };
}
