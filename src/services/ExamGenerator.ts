// ExamGenerator — builds a randomized exam that respects the official AZ-104
// domain weighting, optional domain/difficulty filters, and case study inclusion.

import type { ExamConfig, ExamLength } from '../types/Exam';
import type { Question, DomainName, Difficulty } from '../types/Question';
import { getAllQuestions, getStandaloneQuestions, getDomains } from './QuestionService';

/** Default time budgets (seconds) per exam length, roughly real-exam pacing. */
const TIME_BUDGET: Record<ExamLength, number> = {
  25: 30 * 60,
  40: 50 * 60,
  65: 80 * 60,
  100: 120 * 60,
};

export const EXAM_LENGTHS: ExamLength[] = [25, 40, 65, 100];

/** Fisher–Yates shuffle returning a new array (does not mutate input). */
export function shuffle<T>(input: readonly T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

/** Builds a default exam configuration for a given length. */
export function defaultConfig(length: ExamLength, timed: boolean): ExamConfig {
  return {
    length,
    mode: timed ? 'timed' : 'practice',
    domains: [],
    difficulties: [],
    includeCaseStudies: true,
    durationSeconds: timed ? TIME_BUDGET[length] : 0,
  };
}

/**
 * Allocates how many questions each domain should contribute, proportional to
 * the official AZ-104 weighting, summing exactly to `total`. Largest remainder
 * method is used so rounding never over- or under-shoots the requested length.
 */
export function allocateByWeight(total: number, domains: DomainName[]): Record<string, number> {
  const meta = getDomains().filter((d) => domains.length === 0 || domains.includes(d.name));
  const weightSum = meta.reduce((s, d) => s + d.weight, 0) || 1;

  const raw = meta.map((d) => ({ name: d.name, exact: (d.weight / weightSum) * total }));
  const allocation: Record<string, number> = {};
  let assigned = 0;
  raw.forEach((r) => {
    allocation[r.name] = Math.floor(r.exact);
    assigned += allocation[r.name]!;
  });

  // Distribute the remaining slots to the domains with the largest fractional part.
  const remainders = raw
    .map((r) => ({ name: r.name, frac: r.exact - Math.floor(r.exact) }))
    .sort((a, b) => b.frac - a.frac);

  let i = 0;
  while (assigned < total && remainders.length > 0) {
    const name = remainders[i % remainders.length]!.name;
    allocation[name] = (allocation[name] ?? 0) + 1;
    assigned++;
    i++;
  }
  return allocation;
}

function matchesFilters(q: Question, difficulties: Difficulty[]): boolean {
  if (difficulties.length > 0 && !difficulties.includes(q.difficulty)) return false;
  return true;
}

/**
 * Generates an ordered list of question ids for an exam. The pool is drawn from
 * standalone questions plus, optionally, whole case studies (all their
 * questions are kept together and appended). The result is then weight-balanced
 * by domain and shuffled.
 */
export function generateExam(config: ExamConfig): string[] {
  const { length, domains, difficulties, includeCaseStudies } = config;

  const pool = (includeCaseStudies ? getAllQuestions() : getStandaloneQuestions()).filter((q) => {
    if (domains.length > 0 && !domains.includes(q.domain)) return false;
    return matchesFilters(q, difficulties);
  });

  // Group the candidate pool by domain.
  const byDomain = new Map<DomainName, Question[]>();
  pool.forEach((q) => {
    const list = byDomain.get(q.domain) ?? [];
    list.push(q);
    byDomain.set(q.domain, list);
  });

  const targetDomains = domains.length > 0 ? domains : getDomains().map((d) => d.name);
  const allocation = allocateByWeight(length, targetDomains);

  const selected: Question[] = [];
  const used = new Set<string>();

  // First pass: take the weighted allocation from each domain.
  targetDomains.forEach((domain) => {
    const want = allocation[domain] ?? 0;
    const available = shuffle(byDomain.get(domain) ?? []);
    available.slice(0, want).forEach((q) => {
      selected.push(q);
      used.add(q.id);
    });
  });

  // Second pass: if filters left us short of the requested length, backfill from
  // anything remaining in the pool so the user always gets a full-length exam.
  if (selected.length < length) {
    const remaining = shuffle(pool.filter((q) => !used.has(q.id)));
    for (const q of remaining) {
      if (selected.length >= length) break;
      selected.push(q);
      used.add(q.id);
    }
  }

  // Trim if we somehow exceeded the length, then shuffle the final order.
  return shuffle(selected.slice(0, length)).map((q) => q.id);
}
