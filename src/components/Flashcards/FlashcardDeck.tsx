// FlashcardDeck — orchestrates a spaced-repetition study session. It builds the
// study queue (due cards first), supports domain filtering and shuffling, shows
// mastery progress, and records each review via the store's SM-2 scheduler.

import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { getFlashcards, getDomains } from '../../services/QuestionService';
import { initialProgress, isDue } from '../../services/SpacedRepetition';
import { FlashcardCard } from './FlashcardCard';
import { Card, ProgressBar } from '../common/ui';
import type { DomainName } from '../../types/Question';
import { shuffle } from '../../services/ExamGenerator';

export function FlashcardDeck() {
  const flashProgress = useAppStore((s) => s.flashProgress);
  const reviewFlashcard = useAppStore((s) => s.reviewFlashcard);

  const allCards = useMemo(() => getFlashcards(), []);
  const domains = useMemo(() => getDomains(), []);

  const [domainFilter, setDomainFilter] = useState<DomainName | 'all'>('all');
  const [flipped, setFlipped] = useState(false);
  const [position, setPosition] = useState(0);
  // A reshuffle token lets the user force a new order without changing the filter.
  const [shuffleToken, setShuffleToken] = useState(0);

  // Build the ordered study queue: filter by domain, then due cards first.
  const queue = useMemo(() => {
    const filtered = allCards.filter(
      (c) => domainFilter === 'all' || c.domain === domainFilter,
    );
    const due = filtered.filter((c) => isDue(flashProgress[c.id]));
    const notDue = filtered.filter((c) => !isDue(flashProgress[c.id]));
    return [...shuffle(due), ...shuffle(notDue)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCards, domainFilter, shuffleToken]);

  const masteredCount = useMemo(
    () =>
      queue.filter((c) => flashProgress[c.id]?.stage === 'mastered').length,
    [queue, flashProgress],
  );

  const current = queue[position];

  const advance = () => {
    setFlipped(false);
    setPosition((p) => (queue.length === 0 ? 0 : (p + 1) % queue.length));
  };

  const grade = (success: boolean) => {
    if (!current) return;
    reviewFlashcard(current.id, success);
    advance();
  };

  return (
    <div className="mx-auto max-w-xl space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          value={domainFilter}
          onChange={(e) => {
            setDomainFilter(e.target.value as DomainName | 'all');
            setPosition(0);
            setFlipped(false);
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 dark:border-navy-600 dark:bg-navy-800 dark:text-slate-200"
        >
          <option value="all">All domains</option>
          {domains.map((d) => (
            <option key={d.name} value={d.name}>
              {d.shortName}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            setShuffleToken((t) => t + 1);
            setPosition(0);
            setFlipped(false);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-navy-600 dark:text-slate-300 dark:hover:bg-navy-800"
        >
          🔀 Shuffle
        </button>
      </div>

      {/* Mastery progress */}
      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            {masteredCount} mastered · {queue.length} in deck
          </span>
          <span>{current ? `Card ${position + 1} of ${queue.length}` : ''}</span>
        </div>
        <ProgressBar value={masteredCount} max={queue.length} color="#10b981" />
      </div>

      {/* Card */}
      {current ? (
        <>
          <FlashcardCard
            card={current}
            stage={(flashProgress[current.id] ?? initialProgress(current.id)).stage}
            flipped={flipped}
            onFlip={() => setFlipped((f) => !f)}
          />

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => grade(false)}
              className="rounded-xl bg-rose-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-rose-500"
            >
              ↺ Review again
            </button>
            <button
              type="button"
              onClick={() => grade(true)}
              className="rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
            >
              ✓ Got it
            </button>
          </div>
          <button
            type="button"
            onClick={advance}
            className="mx-auto block text-xs font-medium text-slate-400 hover:text-azure-500 dark:text-slate-500"
          >
            Skip for now →
          </button>
        </>
      ) : (
        <Card className="p-10 text-center">
          <p className="text-3xl">🎉</p>
          <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            No cards in this deck.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Try a different domain or shuffle to study again.
          </p>
        </Card>
      )}
    </div>
  );
}
