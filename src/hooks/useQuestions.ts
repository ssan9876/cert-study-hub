// useQuestions — convenience accessors over QuestionService. Memoized so that
// the (static) seed data is only mapped once per component instance.

import { useMemo } from 'react';
import {
  getAllQuestions,
  getQuestionsByIds,
  getCaseStudies,
  getDomains,
  getFlashcards,
} from '../services/QuestionService';

export function useQuestions(ids?: string[]) {
  const all = useMemo(() => getAllQuestions(), []);
  const byIds = useMemo(() => (ids ? getQuestionsByIds(ids) : []), [ids]);
  const caseStudies = useMemo(() => getCaseStudies(), []);
  const domains = useMemo(() => getDomains(), []);
  const flashcards = useMemo(() => getFlashcards(), []);

  return { all, byIds, caseStudies, domains, flashcards };
}
