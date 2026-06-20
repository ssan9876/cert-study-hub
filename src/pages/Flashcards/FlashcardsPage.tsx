// FlashcardsPage — spaced-repetition flashcard study.

import { FlashcardDeck } from '../../components/Flashcards/FlashcardDeck';

export function FlashcardsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Flashcards</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Reinforce key concepts with spaced repetition. Cards you find hard come back sooner.
        </p>
      </header>
      <FlashcardDeck />
    </div>
  );
}
