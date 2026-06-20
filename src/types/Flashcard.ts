// Flashcard model and the per-card spaced-repetition state (SM-2 simplified).

import type { DomainName } from './Question';

export interface Flashcard {
  id: string;
  domain: DomainName;
  front: string;
  back: string;
  tags: string[];
}

/** Lifecycle stage derived from repetition count and interval. */
export type CardStage = 'new' | 'learning' | 'review' | 'mastered';

/**
 * Persisted SM-2 scheduling state for a single card.
 * `easiness` follows the classic SM-2 ease factor (min 1.3).
 */
export interface CardProgress {
  cardId: string;
  stage: CardStage;
  /** Consecutive successful recalls. */
  repetitions: number;
  /** Current inter-repetition interval in days. */
  interval: number;
  /** SM-2 ease factor. */
  easiness: number;
  /** Epoch ms when the card is next due. */
  dueAt: number;
  /** Epoch ms of the last review. */
  lastReviewedAt?: number;
}
