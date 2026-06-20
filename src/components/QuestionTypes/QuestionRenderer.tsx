// QuestionRenderer — maps a question's `type` to the correct interactive
// renderer. Shared by the exam, review, and results screens so every surface
// renders questions identically.

import { SingleChoice } from './SingleChoice';
import { MultiSelect } from './MultiSelect';
import { YesNoGrid } from './YesNoGrid';
import { Ordering } from './Ordering';
import { Matching } from './Matching';
import type { QuestionTypeProps } from './types';

export function QuestionRenderer(props: QuestionTypeProps) {
  switch (props.question.type) {
    case 'single':
    case 'casestudy':
      return <SingleChoice {...props} />;
    case 'multi':
    case 'choose2':
    case 'choose3':
      return <MultiSelect {...props} />;
    case 'yesno':
      return <YesNoGrid {...props} />;
    case 'ordering':
      return <Ordering {...props} />;
    case 'matching':
      return <Matching {...props} />;
    default:
      return (
        <p className="text-sm text-rose-500">Unsupported question type: {props.question.type}</p>
      );
  }
}
