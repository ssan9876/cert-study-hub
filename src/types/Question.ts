// Core domain model for an AZ-104 practice question.
//
// The schema is intentionally a discriminated-friendly shape: every question
// carries a `type` field that determines how it is rendered and scored. The
// `correct` array always holds *answer ids* (never indexes or raw text) so that
// answers can be safely shuffled without breaking grading.

/**
 * A skill-domain name. Kept as a free string so the platform can host multiple
 * certifications (each with its own domain blueprint). Values are validated at
 * runtime against the active certification's `domains.json`. Examples:
 * AZ-104 → "Compute", "Networking"; Security+ → "Security Operations".
 */
export type DomainName = string;

/** Difficulty buckets used for analytics and adaptive study suggestions. */
export type Difficulty = 'easy' | 'medium' | 'hard';

/**
 * Question interaction types.
 * - `single`   : one correct answer (radio)
 * - `multi`    : any number of correct answers (checkbox)
 * - `choose2`  : exactly two correct answers (checkbox, hard-capped at 2)
 * - `choose3`  : exactly three correct answers (checkbox, hard-capped at 3)
 * - `yesno`    : a configuration table; each row is answered Yes or No
 * - `ordering` : arrange steps into the correct sequence (drag and drop)
 * - `matching` : match terms to definitions (drag and drop)
 * - `casestudy`: a single/multi question that belongs to a case study scenario
 */
export type QuestionType =
  | 'single'
  | 'multi'
  | 'choose2'
  | 'choose3'
  | 'yesno'
  | 'ordering'
  | 'matching'
  | 'casestudy';

/** A selectable answer option. */
export interface Answer {
  id: string;
  text: string;
}

/**
 * A single row of a Yes/No configuration table.
 * `correct` is `true` when the correct response for the row is "Yes".
 */
export interface YesNoStatement {
  id: string;
  text: string;
  correct: boolean;
}

/**
 * A matching pair. `term` ids and `definition` ids are matched together.
 * The correct mapping is expressed via {@link Question.correctPairs}.
 */
export interface MatchPair {
  termId: string;
  definitionId: string;
}

export interface MatchTerm {
  id: string;
  text: string;
}

export interface MatchDefinition {
  id: string;
  text: string;
}

/**
 * The canonical question object used throughout the app. Optional fields are
 * only populated for the question types that need them, keeping the JSON seed
 * data compact while remaining strict-mode safe.
 */
export interface Question {
  id: string;
  domain: DomainName;
  /** Official AZ-104 weighting for the domain, expressed as a percentage. */
  domainWeight: number;
  difficulty: Difficulty;
  /** Specific sub-objective, e.g. "Configure Azure AD Conditional Access". */
  objective: string;
  type: QuestionType;
  question: string;

  /** Used by single / multi / choose2 / choose3 / casestudy. */
  answers?: Answer[];
  /** Correct answer ids (for choice-based questions). */
  correct?: string[];

  /** Used by `yesno` questions. */
  statements?: YesNoStatement[];

  /** Used by `ordering` questions — the steps in their CORRECT order. */
  steps?: Answer[];
  /** The correct order expressed as an ordered list of step ids. */
  correctOrder?: string[];

  /** Used by `matching` questions. */
  terms?: MatchTerm[];
  definitions?: MatchDefinition[];
  correctPairs?: MatchPair[];

  explanation: string;
  references: string[];
  tags: string[];
  /** Recommended time to spend, in seconds. */
  estimatedTime: number;
  /** Present when this question belongs to a case study. */
  caseStudyId?: string;
}

/** A user's response to a question while taking an exam. */
export interface UserResponse {
  questionId: string;
  /** Selected answer ids (choice questions). */
  selected?: string[];
  /** Yes/No answers keyed by statement id (true = "Yes"). */
  yesno?: Record<string, boolean>;
  /** Ordered list of step ids (ordering questions). */
  order?: string[];
  /** Matching answers: definitionId keyed by termId. */
  pairs?: Record<string, string>;
  /** 1–5 self-reported confidence. */
  confidence?: number;
  bookmarked?: boolean;
  flagged?: boolean;
  /** Seconds spent on this question. */
  timeSpent?: number;
}
