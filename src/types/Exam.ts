// Exam session, results, settings and analytics types.

import type { DomainName, Difficulty, UserResponse } from './Question';
import type { CertId } from './Cert';

export type { UserResponse };

/** Number of questions the user can pick for a practice exam. */
export type ExamLength = 25 | 40 | 65 | 100;

export type ExamMode = 'practice' | 'timed' | 'review';

/** Configuration captured when an exam is generated. */
export interface ExamConfig {
  length: ExamLength;
  mode: ExamMode;
  /** Restrict to specific domains (empty = all domains, weighted). */
  domains: DomainName[];
  /** Restrict to specific difficulties (empty = all). */
  difficulties: Difficulty[];
  /** Include case study questions. */
  includeCaseStudies: boolean;
  /** Total time budget in seconds (0 = untimed). */
  durationSeconds: number;
}

/** A live or completed exam session, persisted to localStorage for resume. */
export interface ExamSession {
  id: string;
  config: ExamConfig;
  /** Ordered list of question ids for this attempt. */
  questionIds: string[];
  /** Responses keyed by question id. */
  responses: Record<string, UserResponse>;
  /** Index of the currently displayed question. */
  currentIndex: number;
  /** Epoch ms when the exam started. */
  startedAt: number;
  /** Epoch ms when submitted (undefined while in progress). */
  submittedAt?: number;
  /** Remaining time in seconds when last saved (for timed exams). */
  remainingSeconds: number;
  status: 'in-progress' | 'submitted';
}

/** Per-domain scoring detail produced when an exam is graded. */
export interface DomainScore {
  domain: DomainName;
  correct: number;
  total: number;
  /** 0–100. */
  percentage: number;
  weight: number;
}

/** Detailed grade for a single question. */
export interface QuestionResult {
  questionId: string;
  correct: boolean;
  /** Partial credit 0–1 (used by multi/yesno/ordering/matching). */
  score: number;
  domain: DomainName;
  objective: string;
  timeSpent: number;
}

/** The graded outcome of a completed exam, persisted in history. */
export interface ExamResult {
  id: string;
  examId: string;
  /** Which certification this exam belonged to. */
  certId: CertId;
  config: ExamConfig;
  takenAt: number;
  /** Raw correct count. */
  rawCorrect: number;
  totalQuestions: number;
  /** 0–100 overall percentage (partial credit aware). */
  percentage: number;
  /** Scaled score (vendor-specific range, see scaledMax). */
  scaledScore: number;
  /** Top of the scaled range for this cert (e.g. 1000 for AZ-104, 900 for Sec+). */
  scaledMax: number;
  /** Scaled score required to pass for this cert. */
  passMark: number;
  passed: boolean;
  domainScores: DomainScore[];
  questionResults: QuestionResult[];
  /** Average seconds spent per question. */
  avgTimePerQuestion: number;
  totalTimeSeconds: number;
  /** Objectives where the user performed worst, most-failed first. */
  weakObjectives: string[];
  /** Ordered question ids as presented, for per-question review. */
  questionIds: string[];
  /** Snapshot of the user's responses, so results can replay each question. */
  responses: Record<string, UserResponse>;
}

/** User-facing settings, persisted across sessions. */
export interface Settings {
  theme: 'dark' | 'light';
  timerEnabled: boolean;
  fontScale: 'sm' | 'md' | 'lg';
  /** Show explanations immediately in practice mode. */
  instantFeedback: boolean;
}

/** Aggregate analytics computed from exam history. */
export interface AnalyticsSummary {
  totalExams: number;
  totalQuestionsAnswered: number;
  totalTimeSeconds: number;
  averageScore: number;
  bestScore: number;
  currentStreak: number;
  longestStreak: number;
  /** Mastery 0–100 per domain (weighted average across exams). */
  domainMastery: { domain: DomainName; mastery: number }[];
  /** Score over time, oldest first. */
  scoreTrend: { date: string; score: number }[];
  /** Days on which at least one exam/flashcard session happened. */
  activeDays: string[];
  flashcardsMastered: number;
}
