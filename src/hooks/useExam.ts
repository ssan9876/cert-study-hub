// useExam — a focused facade over the Zustand store for the active exam.
// Components consuming this hook get the current session, the resolved question
// objects, derived status counts, and the full set of mutating actions.

import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getQuestionsByIds, isAnswered } from '../services/QuestionService';
import type { Question } from '../types/Question';

export interface ExamStatusCounts {
  total: number;
  answered: number;
  unanswered: number;
  flagged: number;
  bookmarked: number;
}

export function useExam() {
  const session = useAppStore((s) => s.activeSession);

  const questions: Question[] = useMemo(
    () => (session ? getQuestionsByIds(session.questionIds) : []),
    [session],
  );

  const counts: ExamStatusCounts = useMemo(() => {
    if (!session) return { total: 0, answered: 0, unanswered: 0, flagged: 0, bookmarked: 0 };
    let answered = 0;
    let flagged = 0;
    let bookmarked = 0;
    questions.forEach((q) => {
      const r = session.responses[q.id];
      if (isAnswered(q, r)) answered += 1;
      if (r?.flagged) flagged += 1;
      if (r?.bookmarked) bookmarked += 1;
    });
    return {
      total: questions.length,
      answered,
      unanswered: questions.length - answered,
      flagged,
      bookmarked,
    };
  }, [session, questions]);

  const currentQuestion = session ? questions[session.currentIndex] : undefined;
  const currentResponse =
    session && currentQuestion ? session.responses[currentQuestion.id] : undefined;

  return {
    session,
    questions,
    counts,
    currentQuestion,
    currentResponse,
    // actions (stable references from the store)
    startExam: useAppStore((s) => s.startExam),
    answerQuestion: useAppStore((s) => s.answerQuestion),
    setCurrentIndex: useAppStore((s) => s.setCurrentIndex),
    nextQuestion: useAppStore((s) => s.nextQuestion),
    prevQuestion: useAppStore((s) => s.prevQuestion),
    setConfidence: useAppStore((s) => s.setConfidence),
    toggleBookmark: useAppStore((s) => s.toggleBookmark),
    toggleFlag: useAppStore((s) => s.toggleFlag),
    addTimeSpent: useAppStore((s) => s.addTimeSpent),
    tickTimer: useAppStore((s) => s.tickTimer),
    submitExam: useAppStore((s) => s.submitExam),
    abandonExam: useAppStore((s) => s.abandonExam),
  };
}
