// Integrity check for the Security+ (SY0-701) seed content.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'secplus');
const read = (f) => JSON.parse(readFileSync(join(root, f), 'utf8'));

const questions = read('questions.json');
const flashcards = read('flashcards.json');
const caseStudies = read('caseStudies.json');
const domains = read('domains.json');

const errors = [];
const ok = (c, m) => { if (!c) errors.push(m); };
const domainNames = new Set(domains.map((d) => d.name));

function validate(q, where) {
  ok(domainNames.has(q.domain), `${q.id}: unknown domain "${q.domain}" (${where})`);
  ok(q.explanation && q.explanation.length > 10, `${q.id}: weak explanation`);
  ok(Array.isArray(q.references) && q.references.length > 0, `${q.id}: no references`);
  const choice = ['single', 'multi', 'choose2', 'choose3', 'casestudy'];
  if (choice.includes(q.type)) {
    const ids = new Set((q.answers || []).map((a) => a.id));
    ok((q.correct || []).length >= 1, `${q.id}: needs correct`);
    (q.correct || []).forEach((c) => ok(ids.has(c), `${q.id}: correct "${c}" not an answer id`));
    if (q.type === 'choose2') ok(q.correct.length === 2, `${q.id}: choose2 needs 2`);
    if (q.type === 'choose3') ok(q.correct.length === 3, `${q.id}: choose3 needs 3`);
    if (q.type === 'single' || q.type === 'casestudy') ok(q.correct.length === 1, `${q.id}: single needs 1`);
  } else if (q.type === 'yesno') {
    ok((q.statements || []).length >= 2, `${q.id}: yesno needs statements`);
  } else if (q.type === 'ordering') {
    const ids = new Set((q.steps || []).map((s) => s.id));
    ok((q.correctOrder || []).length === ids.size, `${q.id}: order mismatch`);
    (q.correctOrder || []).forEach((o) => ok(ids.has(o), `${q.id}: order id "${o}" invalid`));
  } else if (q.type === 'matching') {
    const t = new Set((q.terms || []).map((x) => x.id));
    const d = new Set((q.definitions || []).map((x) => x.id));
    ok((q.correctPairs || []).length === t.size, `${q.id}: pairs mismatch`);
    (q.correctPairs || []).forEach((p) => {
      ok(t.has(p.termId), `${q.id}: pair term invalid`);
      ok(d.has(p.definitionId), `${q.id}: pair def invalid`);
    });
  } else {
    errors.push(`${q.id}: unknown type ${q.type}`);
  }
}

ok(questions.length === 40, `Expected 40 standalone questions, got ${questions.length}`);
questions.forEach((q) => validate(q, 'standalone'));

const dist = questions.reduce((a, q) => ((a[q.domain] = (a[q.domain] || 0) + 1), a), {});
const expected = {
  'General Security Concepts': 5,
  'Threats, Vulnerabilities, and Mitigations': 9,
  'Security Architecture': 7,
  'Security Operations': 11,
  'Security Program Management and Oversight': 8,
};
for (const [d, n] of Object.entries(expected)) ok(dist[d] === n, `Distribution ${d}: want ${n}, got ${dist[d] || 0}`);

const types = questions.reduce((a, q) => ((a[q.type] = (a[q.type] || 0) + 1), a), {});
ok((types.multi || 0) >= 3, `need >=3 multi, got ${types.multi || 0}`);
ok((types.yesno || 0) >= 2, `need >=2 yesno, got ${types.yesno || 0}`);
ok((types.ordering || 0) >= 2, `need >=2 ordering, got ${types.ordering || 0}`);
ok((types.matching || 0) >= 1, `need >=1 matching, got ${types.matching || 0}`);

ok(flashcards.length >= 30, `Expected >=30 flashcards, got ${flashcards.length}`);
flashcards.forEach((f) => ok(domainNames.has(f.domain), `flashcard ${f.id}: bad domain`));

caseStudies.forEach((cs) => {
  ok(cs.questions.length >= 4, `${cs.id}: needs >=4 questions`);
  ok(
    JSON.stringify(cs.questionIds.slice().sort()) === JSON.stringify(cs.questions.map((q) => q.id).sort()),
    `${cs.id}: questionIds mismatch`,
  );
  cs.questions.forEach((q) => { ok(q.caseStudyId === cs.id, `${q.id}: bad caseStudyId`); validate(q, cs.id); });
});

const allIds = [...questions, ...caseStudies.flatMap((c) => c.questions)].map((q) => q.id);
const dupes = allIds.filter((id, i) => allIds.indexOf(id) !== i);
ok(dupes.length === 0, `duplicate ids: ${[...new Set(dupes)].join(', ')}`);

console.log(`Security+ questions: ${questions.length} + ${caseStudies.reduce((n, c) => n + c.questions.length, 0)} case study`);
console.log('Types:', types);
console.log('Distribution:', dist);
console.log(`Flashcards: ${flashcards.length}`);
if (errors.length) {
  console.error(`\n❌ ${errors.length} error(s):\n  ` + errors.join('\n  '));
  process.exit(1);
}
console.log('\n✅ Security+ data integrity checks passed.');
