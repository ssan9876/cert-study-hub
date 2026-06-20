// ExamContext — provides the active exam facade to the exam component tree so
// that deeply nested question-type components (SingleChoice, YesNoGrid, etc.)
// can read the current question/response and dispatch answers without prop
// drilling. It is a thin wrapper around the {@link useExam} hook.

import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useExam } from '../hooks/useExam';
import type { UserResponse, Question } from '../types/Question';

type ExamFacade = ReturnType<typeof useExam> & {
  /** Patch the response for a specific question. */
  respond: (questionId: string, patch: Partial<UserResponse>) => void;
  /** Get the response object for a question (may be undefined). */
  responseFor: (questionId: string) => UserResponse | undefined;
  /** Resolve a question id to its full object. */
  questionById: (id: string) => Question | undefined;
};

const ExamContext = createContext<ExamFacade | null>(null);

export function ExamProvider({ children }: { children: ReactNode }) {
  const exam = useExam();

  const value = useMemo<ExamFacade>(() => {
    const questionMap = new Map(exam.questions.map((q) => [q.id, q]));
    return {
      ...exam,
      respond: exam.answerQuestion,
      responseFor: (questionId: string) => exam.session?.responses[questionId],
      questionById: (id: string) => questionMap.get(id),
    };
  }, [exam]);

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
}

/** Access the active exam facade. Throws if used outside an {@link ExamProvider}. */
export function useExamContext(): ExamFacade {
  const ctx = useContext(ExamContext);
  if (!ctx) {
    throw new Error('useExamContext must be used within an ExamProvider');
  }
  return ctx;
}
