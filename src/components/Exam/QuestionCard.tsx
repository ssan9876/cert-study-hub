// QuestionCard — the central question presentation used during an exam. It
// renders the question metadata, the appropriate interactive renderer, the
// confidence selector, and bookmark/flag controls. In practice mode with
// instant feedback enabled it reveals the explanation after answering.

import { motion } from 'framer-motion';
import type { Question, UserResponse } from '../../types/Question';
import { QuestionRenderer } from '../QuestionTypes/QuestionRenderer';
import { DifficultyBadge, DomainBadge, ConfidenceStars } from '../common/ui';
import { Explanation } from '../Review/Explanation';

interface QuestionCardProps {
  question: Question;
  response?: UserResponse;
  index: number;
  total: number;
  onRespond: (patch: Partial<UserResponse>) => void;
  onToggleBookmark: () => void;
  onToggleFlag: () => void;
  onSetConfidence: (v: number) => void;
  /** When true, reveal correctness + explanation inline (instant feedback). */
  showFeedback?: boolean;
  /** Hide the metadata header (used inside the case study layout). */
  compact?: boolean;
}

export function QuestionCard({
  question,
  response,
  index,
  total,
  onRespond,
  onToggleBookmark,
  onToggleFlag,
  onSetConfidence,
  showFeedback = false,
  compact = false,
}: QuestionCardProps) {
  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Meta row is hidden in compact (case study) mode, where the layout
            already shows the question number. The action buttons remain. */}
        {compact ? (
          <DomainBadge domain={question.domain} />
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">
              Question {index + 1} of {total}
            </span>
            <DomainBadge domain={question.domain} />
            <DifficultyBadge difficulty={question.difficulty} />
          </div>
        )}
        <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleBookmark}
              className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
                response?.bookmarked
                  ? 'border-azure-500 bg-azure-500/10 text-azure-600 dark:text-azure-300'
                  : 'border-slate-300 text-slate-500 hover:border-azure-400 dark:border-navy-600 dark:text-slate-300'
              }`}
            >
              {response?.bookmarked ? '★ Bookmarked' : '☆ Bookmark'}
            </button>
            <button
              type="button"
              onClick={onToggleFlag}
              className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
                response?.flagged
                  ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-300'
                  : 'border-slate-300 text-slate-500 hover:border-amber-400 dark:border-navy-600 dark:text-slate-300'
              }`}
            >
              {response?.flagged ? '⚑ Flagged' : '⚐ Flag'}
            </button>
          </div>
        </div>

      <p className="text-base font-medium leading-relaxed text-slate-900 dark:text-white">
        {question.question}
      </p>

      <QuestionRenderer
        question={question}
        response={response}
        onRespond={onRespond}
        reveal={showFeedback}
        disabled={showFeedback}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-navy-700">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>Confidence:</span>
          <ConfidenceStars value={response?.confidence} onChange={onSetConfidence} />
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          Suggested time: {question.estimatedTime}s
        </span>
      </div>

      {showFeedback && <Explanation question={question} response={response} />}
    </motion.div>
  );
}
