// SpacedRepetition — a simplified SM-2 scheduler for flashcards.
//
// The UI exposes two outcomes: "Got it" (a good recall) and "Review again"
// (a failed recall). These map onto SM-2 quality grades and update the card's
// repetition count, ease factor, interval (in days) and next due date. The
// lifecycle stage is derived from the resulting interval.

import type { CardProgress, CardStage } from '../types/Flashcard';

const DAY_MS = 86_400_000;
const MIN_EASE = 1.3;

/** Fresh scheduling state for a card the user has never seen. */
export function initialProgress(cardId: string): CardProgress {
  return {
    cardId,
    stage: 'new',
    repetitions: 0,
    interval: 0,
    easiness: 2.5,
    dueAt: Date.now(),
  };
}

/** Derive a human-friendly lifecycle stage from repetitions and interval. */
function deriveStage(repetitions: number, interval: number): CardStage {
  if (repetitions === 0) return 'new';
  if (interval >= 21) return 'mastered';
  if (interval >= 1 && repetitions >= 2) return 'review';
  return 'learning';
}

/**
 * Apply an SM-2 review.
 *
 * @param prev    the card's current progress (use {@link initialProgress} if new).
 * @param success true for "Got it", false for "Review again".
 */
export function review(prev: CardProgress, success: boolean): CardProgress {
  const now = Date.now();
  // Map the binary outcome onto an SM-2 quality grade (0–5).
  const quality = success ? 5 : 2;

  let { repetitions, interval, easiness } = prev;

  if (!success) {
    // Lapse: restart the repetition cycle and review again in ~10 minutes.
    repetitions = 0;
    interval = 0;
    const dueAt = now + 10 * 60 * 1000;
    easiness = Math.max(MIN_EASE, easiness - 0.2);
    return {
      ...prev,
      repetitions,
      interval,
      easiness,
      dueAt,
      stage: 'learning',
      lastReviewedAt: now,
    };
  }

  // Successful recall: advance the interval using the SM-2 progression.
  repetitions += 1;
  if (repetitions === 1) interval = 1;
  else if (repetitions === 2) interval = 6;
  else interval = Math.round(interval * easiness);

  // Update ease factor per the classic SM-2 formula.
  easiness = Math.max(
    MIN_EASE,
    easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  );

  return {
    ...prev,
    repetitions,
    interval,
    easiness,
    dueAt: now + interval * DAY_MS,
    stage: deriveStage(repetitions, interval),
    lastReviewedAt: now,
  };
}

/** True when a card is due for review (or has never been seen). */
export function isDue(progress: CardProgress | undefined): boolean {
  if (!progress) return true;
  return progress.dueAt <= Date.now();
}
