// Data integrity validator for the AZ-104 seed content. Run with Node:
//   node scripts/validate-data.mjs
// Verifies counts, domain distribution, required question-type coverage, and
// referential integrity (correct ids exist, ordering/matching are consistent).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const read = (f) => JSON.parse(readFileSync(join(root, f), 'utf8'));

const questions = read('questions.json');
const flashcards = read('flashcards.json');
const caseStudies = read('caseStudies.json');
const domains = read('domains.json');

const errors = [];
const warn = [];
const ok = (cond, msg) => { if (!cond) errors.push(msg); };

const domainNames = new Set(domains.map((d) => d.name));

function validateQuestion(q, where) {
  ok(q.id, `${where}: missing id`);
  ok(domainNames.has(q.domain), `${q.id}: unknown domain "${q.domain}"`);
  ok(q.explanation && q.explanation.length > 10, `${q.id}: weak/empty explanation`);
  ok(Array.isArray(q.references) && q.references.length > 0, `${q.id}: no references`);
  (q.references || []).forEach((r) => ok(/^https?:\/\//.test(r), `${q.id}: bad reference URL ${r}`));

  const choiceTypes = ['single', 'multi', 'choose2', 'choose3', 'casestudy'];
  if (choiceTypes.includes(q.type)) {
    const ids = new Set((q.answers || []).map((a) => a.id));
    ok((q.answers || []).length >= 2, `${q.id}: needs >=2 answers`);
    ok((q.correct || []).length >= 1, `${q.id}: needs >=1 correct`);
    (q.correct || []).forEach((c) => ok(ids.has(c), `${q.id}: correct id "${c}" not in answers`));
    if (q.type === 'choose2') ok((q.correct || []).length === 2, `${q.id}: choose2 must have 2 correct`);
    if (q.type === 'choose3') ok((q.correct || []).length === 3, `${q.id}: choose3 must have 3 correct`);
    if (q.type === 'single' || q.type === 'casestudy')
      ok((q.correct || []).length === 1, `${q.id}: single must have exactly 1 correct`);
  } else if (q.type === 'yesno') {
    ok((q.statements || []).length >= 2, `${q.id}: yesno needs >=2 statements`);
    (q.statements || []).forEach((s) =>
      ok(typeof s.correct === 'boolean', `${q.id}: statement ${s.id} correct must be boolean`));
  } else if (q.type === 'ordering') {
    const ids = new Set((q.steps || []).map((s) => s.id));
    ok((q.steps || []).length >= 2, `${q.id}: ordering needs >=2 steps`);
    ok((q.correctOrder || []).length === ids.size, `${q.id}: correctOrder length != steps`);
    (q.correctOrder || []).forEach((o) => ok(ids.has(o), `${q.id}: correctOrder id "${o}" not a step`));
  } else if (q.type === 'matching') {
    const termIds = new Set((q.terms || []).map((t) => t.id));
    const defIds = new Set((q.definitions || []).map((d) => d.id));
    ok((q.terms || []).length >= 2, `${q.id}: matching needs >=2 terms`);
    ok((q.correctPairs || []).length === termIds.size, `${q.id}: pairs != terms`);
    (q.correctPairs || []).forEach((p) => {
      ok(termIds.has(p.termId), `${q.id}: pair term "${p.termId}" invalid`);
      ok(defIds.has(p.definitionId), `${q.id}: pair def "${p.definitionId}" invalid`);
    });
  } else {
    errors.push(`${q.id}: unknown type "${q.type}"`);
  }
}

// --- standalone questions ---
ok(questions.length === 50, `Expected 50 standalone questions, got ${questions.length}`);
questions.forEach((q) => validateQuestion(q, 'question'));

const distribution = questions.reduce((acc, q) => {
  acc[q.domain] = (acc[q.domain] || 0) + 1;
  return acc;
}, {});
const expected = {
  'Identity and Access Management': 10,
  Storage: 10,
  Compute: 12,
  Networking: 12,
  'Monitoring and Backup': 6,
};
for (const [dom, n] of Object.entries(expected)) {
  ok(distribution[dom] === n, `Distribution ${dom}: expected ${n}, got ${distribution[dom] || 0}`);
}

const typeCount = questions.reduce((acc, q) => ((acc[q.type] = (acc[q.type] || 0) + 1), acc), {});
ok((typeCount.multi || 0) >= 3, `Need >=3 multi-select, got ${typeCount.multi || 0}`);
ok((typeCount.yesno || 0) >= 2, `Need >=2 yes/no, got ${typeCount.yesno || 0}`);
ok((typeCount.ordering || 0) >= 2, `Need >=2 ordering, got ${typeCount.ordering || 0}`);
ok((typeCount.matching || 0) >= 1, `Need >=1 matching, got ${typeCount.matching || 0}`);

// --- flashcards ---
ok(flashcards.length === 40, `Expected 40 flashcards, got ${flashcards.length}`);
flashcards.forEach((f) => {
  ok(f.id && f.front && f.back, `flashcard ${f.id}: missing fields`);
  ok(domainNames.has(f.domain), `flashcard ${f.id}: unknown domain`);
});

// --- case studies ---
ok(caseStudies.length === 2, `Expected 2 case studies, got ${caseStudies.length}`);
caseStudies.forEach((cs) => {
  ok(cs.sections.length >= 3, `${cs.id}: needs >=3 sections`);
  ok(cs.questions.length === 6, `${cs.id}: expected 6 questions, got ${cs.questions.length}`);
  ok(
    JSON.stringify(cs.questionIds.slice().sort()) ===
      JSON.stringify(cs.questions.map((q) => q.id).sort()),
    `${cs.id}: questionIds do not match embedded questions`,
  );
  cs.questions.forEach((q) => {
    ok(q.caseStudyId === cs.id, `${q.id}: caseStudyId should be ${cs.id}`);
    validateQuestion(q, `casestudy ${cs.id}`);
  });
});

// --- unique ids across everything ---
const allIds = [...questions, ...caseStudies.flatMap((c) => c.questions)].map((q) => q.id);
const dupes = allIds.filter((id, i) => allIds.indexOf(id) !== i);
ok(dupes.length === 0, `Duplicate question ids: ${[...new Set(dupes)].join(', ')}`);

// --- report ---
const total = allIds.length;
console.log(`Questions: 50 standalone + ${caseStudies.length * 6} case study = ${total} total`);
console.log(`Flashcards: ${flashcards.length}`);
console.log(`Type coverage:`, typeCount);
console.log(`Distribution:`, distribution);
if (warn.length) console.log('\nWarnings:\n  ' + warn.join('\n  '));

if (errors.length) {
  console.error(`\n❌ ${errors.length} error(s):\n  ` + errors.join('\n  '));
  process.exit(1);
}
console.log('\n✅ All data integrity checks passed.');
