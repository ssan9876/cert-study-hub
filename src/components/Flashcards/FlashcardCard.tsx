// FlashcardCard — a single card with a 3D flip animation (CSS transform). The
// front shows the prompt; clicking flips to reveal the answer. The card's
// spaced-repetition stage is shown as a colored chip.

import type { Flashcard, CardStage } from '../../types/Flashcard';
import { DomainBadge } from '../common/ui';

const stageTone: Record<CardStage, string> = {
  new: 'bg-slate-200 text-slate-600 dark:bg-navy-700 dark:text-slate-300',
  learning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  review: 'bg-azure-100 text-azure-700 dark:bg-azure-500/15 dark:text-azure-300',
  mastered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
};

export function FlashcardCard({
  card,
  stage,
  flipped,
  onFlip,
}: {
  card: Flashcard;
  stage: CardStage;
  flipped: boolean;
  onFlip: () => void;
}) {
  return (
    <div className="[perspective:1200px]">
      <button
        type="button"
        onClick={onFlip}
        className="relative h-72 w-full text-left"
        style={{ transformStyle: 'preserve-3d' }}
        aria-label="Flip card"
      >
        <div
          className="relative h-full w-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-fluent dark:border-navy-700 dark:bg-navy-800"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="flex items-center justify-between">
              <DomainBadge domain={card.domain} />
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${stageTone[stage]}`}>
                {stage}
              </span>
            </div>
            <div className="flex flex-1 items-center justify-center">
              <p className="text-center text-lg font-semibold text-slate-900 dark:text-white">
                {card.front}
              </p>
            </div>
            <p className="text-center text-xs text-slate-400 dark:text-slate-500">
              Click to reveal the answer
            </p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 flex flex-col rounded-2xl border border-azure-300 bg-azure-50 p-6 shadow-fluent dark:border-azure-700 dark:bg-navy-900"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-azure-600 dark:text-azure-300">
              Answer
            </p>
            <div className="flex flex-1 items-center justify-center">
              <p className="text-center text-base leading-relaxed text-slate-800 dark:text-slate-100">
                {card.back}
              </p>
            </div>
            <p className="text-center text-xs text-slate-400 dark:text-slate-500">
              How well did you know it?
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}
