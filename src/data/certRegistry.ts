// Central registry of every certification the platform hosts. Each entry bundles
// the cert's metadata (scoring, branding) with its seed data (questions,
// flashcards, case studies, domain blueprint). QuestionService reads from here
// based on the active certification.

import type { CertId, CertMeta } from '../types/Cert';
import type { Question } from '../types/Question';
import type { CaseStudy } from '../types/CaseStudy';
import type { Flashcard } from '../types/Flashcard';
import type { DomainMeta } from '../services/QuestionService';

// AZ-104 data (original location).
import azQuestions from './questions.json';
import azFlashcards from './flashcards.json';
import azCaseStudies from './caseStudies.json';
import azDomains from './domains.json';

// CompTIA Security+ (SY0-701) data.
import spQuestions from './secplus/questions.json';
import spFlashcards from './secplus/flashcards.json';
import spCaseStudies from './secplus/caseStudies.json';
import spDomains from './secplus/domains.json';

export interface CertDataset {
  meta: CertMeta;
  questions: Question[];
  flashcards: Flashcard[];
  caseStudies: CaseStudy[];
  domains: DomainMeta[];
}

export const CERT_REGISTRY: Record<CertId, CertDataset> = {
  az104: {
    meta: {
      id: 'az104',
      name: 'AZ-104 Microsoft Azure Administrator',
      shortName: 'AZ-104',
      exam: 'AZ-104',
      vendor: 'Microsoft',
      scaledMax: 1000,
      passMark: 700,
      description:
        'Manage Azure identities, governance, storage, compute, virtual networking, and monitoring.',
      accent: '#1a7aff',
    },
    questions: azQuestions as unknown as Question[],
    flashcards: azFlashcards as unknown as Flashcard[],
    caseStudies: azCaseStudies as unknown as CaseStudy[],
    domains: azDomains as unknown as DomainMeta[],
  },
  secplus: {
    meta: {
      id: 'secplus',
      name: 'CompTIA Security+ (SY0-701)',
      shortName: 'Security+',
      exam: 'SY0-701',
      vendor: 'CompTIA',
      scaledMax: 900,
      passMark: 750,
      description:
        'Core cybersecurity skills: threats, architecture, operations, incident response, and governance.',
      accent: '#22c1a6',
    },
    questions: spQuestions as unknown as Question[],
    flashcards: spFlashcards as unknown as Flashcard[],
    caseStudies: spCaseStudies as unknown as CaseStudy[],
    domains: spDomains as unknown as DomainMeta[],
  },
};

export const CERT_IDS = Object.keys(CERT_REGISTRY) as CertId[];

export function listCertMeta(): CertMeta[] {
  return CERT_IDS.map((id) => CERT_REGISTRY[id]!.meta);
}
