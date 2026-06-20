// Shared prop contract for every question-type renderer. Each renderer is a
// controlled component: it reflects `response` and reports edits via `onRespond`.
// When `reveal` is true it additionally highlights correct/incorrect choices
// (used by Review and Results). `disabled` freezes interaction.

import type { Question, UserResponse } from '../../types/Question';

export interface QuestionTypeProps {
  question: Question;
  response?: UserResponse;
  onRespond: (patch: Partial<UserResponse>) => void;
  reveal?: boolean;
  disabled?: boolean;
}
