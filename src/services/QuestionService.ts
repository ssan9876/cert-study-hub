// QuestionService — the cert-aware source of truth for question, flashcard,
// case study and domain data. The platform hosts multiple certifications; this
// module exposes the *active* certification's data and provides lookup plus
// per-question grading. Call setActiveCert() when the user switches certs.

import { CERT_REGISTRY } from '../data/certRegistry';
import type { CertId, CertMeta } from '../types/Cert';
import type { Question, UserResponse, DomainName } from '../types/Question';
import type { CaseStudy } from '../types/CaseStudy';
import type { Flashcard } from '../types/Flashcard';

export interface DomainMeta {
  name: DomainName;
  shortName: string;
  weight: number;
  minWeight: number;
  maxWeight: number;
  color: string;
  description: string;
  objectives: string[];
}

// ---- active certification state (rebuilt whenever the cert changes) ----
let activeCert: CertId = 'az104';

let standaloneQuestions: Question[] = [];
let caseStudies: CaseStudy[] = [];
let flashcards: Flashcard[] = [];
let domains: DomainMeta[] = [];
let allQuestions: Question[] = [];
let questionIndex = new Map<string, Question>();
let caseStudyIndex = new Map<string, CaseStudy>();

function rebuild() {
  const ds = CERT_REGISTRY[activeCert]!;
  standaloneQuestions = ds.questions;
  caseStudies = ds.caseStudies;
  flashcards = ds.flashcards;
  domains = ds.domains;
  // Flatten the questions embedded in case studies into the global pool so all
  // lookups/generation/grading treat every question uniformly.
  const caseStudyQuestions = caseStudies.flatMap((cs) => cs.questions);
  allQuestions = [...standaloneQuestions, ...caseStudyQuestions];
  questionIndex = new Map(allQuestions.map((q) => [q.id, q]));
  caseStudyIndex = new Map(caseStudies.map((cs) => [cs.id, cs]));
}

rebuild();

/** Switch the active certification and rebuild the in-memory indexes. */
export function setActiveCert(id: CertId): void {
  activeCert = id;
  rebuild();
}

export function getActiveCert(): CertId {
  return activeCert;
}

export function getActiveCertMeta(): CertMeta {
  return CERT_REGISTRY[activeCert]!.meta;
}

/** Returns every question for the active cert, including case study questions. */
export function getAllQuestions(): Question[] {
  return allQuestions;
}

/** Returns only standalone (non case study) questions for the active cert. */
export function getStandaloneQuestions(): Question[] {
  return standaloneQuestions;
}

export function getQuestionById(id: string): Question | undefined {
  return questionIndex.get(id);
}

export function getQuestionsByIds(ids: string[]): Question[] {
  return ids.map((id) => questionIndex.get(id)).filter((q): q is Question => Boolean(q));
}

export function getQuestionsByDomain(domain: DomainName): Question[] {
  return allQuestions.filter((q) => q.domain === domain);
}

export function getCaseStudies(): CaseStudy[] {
  return caseStudies;
}

export function getCaseStudyById(id: string): CaseStudy | undefined {
  return caseStudyIndex.get(id);
}

export function getFlashcards(): Flashcard[] {
  return flashcards;
}

export function getDomains(): DomainMeta[] {
  return domains;
}

export function getDomainMeta(name: DomainName): DomainMeta | undefined {
  return domains.find((d) => d.name === name);
}

/** True when an array contains exactly the same members as another (order-free). */
function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((x) => setB.has(x));
}

/**
 * Grades a single response, returning a partial-credit score 0..1. `correct` is
 * true only for a perfect score. See per-type rules inline.
 */
export function gradeQuestion(
  question: Question,
  response: UserResponse | undefined,
): { score: number; correct: boolean } {
  if (!response) return { score: 0, correct: false };

  switch (question.type) {
    case 'single':
    case 'choose2':
    case 'choose3':
    case 'casestudy': {
      const selected = response.selected ?? [];
      const correct = question.correct ?? [];
      const isCorrect = sameSet(selected, correct);
      return { score: isCorrect ? 1 : 0, correct: isCorrect };
    }

    case 'multi': {
      const selected = new Set(response.selected ?? []);
      const correct = new Set(question.correct ?? []);
      if (correct.size === 0) return { score: 0, correct: false };
      let right = 0;
      let wrong = 0;
      selected.forEach((id) => (correct.has(id) ? right++ : wrong++));
      const raw = (right - wrong) / correct.size;
      const score = Math.max(0, Math.min(1, raw));
      return { score, correct: score === 1 };
    }

    case 'yesno': {
      const statements = question.statements ?? [];
      if (statements.length === 0) return { score: 0, correct: false };
      const answers = response.yesno ?? {};
      let right = 0;
      statements.forEach((s) => {
        if (s.id in answers && answers[s.id] === s.correct) right++;
      });
      const score = right / statements.length;
      return { score, correct: score === 1 };
    }

    case 'ordering': {
      const correctOrder = question.correctOrder ?? [];
      if (correctOrder.length === 0) return { score: 0, correct: false };
      const given = response.order ?? [];
      let right = 0;
      correctOrder.forEach((id, idx) => {
        if (given[idx] === id) right++;
      });
      const score = right / correctOrder.length;
      return { score, correct: score === 1 };
    }

    case 'matching': {
      const pairs = question.correctPairs ?? [];
      if (pairs.length === 0) return { score: 0, correct: false };
      const given = response.pairs ?? {};
      let right = 0;
      pairs.forEach((p) => {
        if (given[p.termId] === p.definitionId) right++;
      });
      const score = right / pairs.length;
      return { score, correct: score === 1 };
    }

    default:
      return { score: 0, correct: false };
  }
}

/** True when the user has provided any answer to the question. */
export function isAnswered(question: Question, response: UserResponse | undefined): boolean {
  if (!response) return false;
  switch (question.type) {
    case 'single':
    case 'multi':
    case 'choose2':
    case 'choose3':
    case 'casestudy':
      return (response.selected ?? []).length > 0;
    case 'yesno':
      return (
        Object.keys(response.yesno ?? {}).length === (question.statements?.length ?? 0) &&
        (question.statements?.length ?? 0) > 0
      );
    case 'ordering':
      return (
        (response.order ?? []).length === (question.steps?.length ?? 0) &&
        (question.steps?.length ?? 0) > 0
      );
    case 'matching':
      return (
        Object.keys(response.pairs ?? {}).length === (question.terms?.length ?? 0) &&
        (question.terms?.length ?? 0) > 0
      );
    default:
      return false;
  }
}
