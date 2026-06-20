// Case study model. A case study is a long-form scenario (split into tabbed
// sections like the real Microsoft exam) plus a set of questions that reference
// it via `caseStudyId`.

import type { Question } from './Question';

/** One tab of a case study scenario (Overview, Existing Environment, etc.). */
export interface CaseStudySection {
  id: string;
  /** Tab label shown in the left navigation. */
  title: string;
  /** Rich text body. Newlines are rendered as paragraphs; `- ` lines as bullets. */
  body: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  /** Short tagline shown on cards and selection screens. */
  summary: string;
  /** Primary domain emphasis for filtering. */
  domain: string;
  /** Tabbed scenario content. */
  sections: CaseStudySection[];
  /** Ids of the questions that belong to this study. */
  questionIds: string[];
  /**
   * The full question objects for this study. Stored inline so a case study is
   * self-contained; {@link QuestionService} flattens these into the global pool.
   */
  questions: Question[];
}
