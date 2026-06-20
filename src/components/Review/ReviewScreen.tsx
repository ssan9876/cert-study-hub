// ReviewScreen — shown before final submission. Summarizes answered /
// unanswered / flagged / bookmarked counts, offers a color-coded palette to
// jump back to any question, and gates submission behind a confirmation modal.

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Question, UserResponse } from '../../types/Question';
import { QuestionPalette } from '../QuestionPalette/QuestionPalette';
import { Card } from '../common/ui';
import type { ExamStatusCounts } from '../../hooks/useExam';

interface ReviewScreenProps {
  questions: Question[];
  responses: Record<string, UserResponse>;
  counts: ExamStatusCounts;
  currentIndex: number;
  onJump: (index: number) => void;
  onSubmit: () => void;
  onBack: () => void;
}

function CountTile({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-xl border-2 p-4 text-center ${tone}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium uppercase tracking-wide">{label}</p>
    </div>
  );
}

export function ReviewScreen({
  questions,
  responses,
  counts,
  currentIndex,
  onJump,
  onSubmit,
  onBack,
}: ReviewScreenProps) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Review your exam</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Check unanswered and flagged questions before you submit. You can jump to any question.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CountTile
          label="Answered"
          value={counts.answered}
          tone="border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
        />
        <CountTile
          label="Unanswered"
          value={counts.unanswered}
          tone="border-slate-300 bg-slate-50 text-slate-600 dark:border-navy-600 dark:bg-navy-800 dark:text-slate-300"
        />
        <CountTile
          label="Flagged"
          value={counts.flagged}
          tone="border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
        />
        <CountTile
          label="Bookmarked"
          value={counts.bookmarked}
          tone="border-azure-500 bg-azure-50 text-azure-700 dark:bg-azure-500/10 dark:text-azure-300"
        />
      </div>

      <Card className="p-5">
        <h2 className="mb-4 text-sm font-bold text-slate-800 dark:text-white">All questions</h2>
        <QuestionPalette
          questions={questions}
          responses={responses}
          currentIndex={currentIndex}
          onJump={(i) => {
            onJump(i);
            onBack();
          }}
        />
      </Card>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-navy-600 dark:text-slate-300 dark:hover:bg-navy-800"
        >
          ← Back to exam
        </button>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          Submit exam
        </button>
      </div>

      <AnimatePresence>
        {confirming && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-fluent-lg dark:border-navy-700 dark:bg-navy-800"
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Submit this exam?</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                You have <strong>{counts.unanswered}</strong> unanswered question
                {counts.unanswered === 1 ? '' : 's'}. After submitting, the exam will be graded and
                you cannot change your answers.
              </p>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-navy-600 dark:text-slate-300 dark:hover:bg-navy-800"
                >
                  Keep working
                </button>
                <button
                  type="button"
                  onClick={onSubmit}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  Submit &amp; grade
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
