// Verifies that every relative import in src/ resolves to an existing file.
// Catches path typos that would otherwise only fail at build time.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const exts = ['.ts', '.tsx', '.json', '.css', '.d.ts'];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

function resolves(fromFile, spec) {
  const base = resolve(dirname(fromFile), spec);
  if (extname(base) && existsSync(base)) return true;
  for (const e of exts) if (existsSync(base + e)) return true;
  for (const e of exts) if (existsSync(join(base, 'index' + e))) return true;
  return false;
}

const files = walk(srcRoot).filter((f) => /\.(ts|tsx)$/.test(f));
const importRe = /(?:import|export)[^'"]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]/g;
const problems = [];

for (const file of files) {
  const code = readFileSync(file, 'utf8');
  let m;
  while ((m = importRe.exec(code))) {
    const spec = m[1] || m[2];
    if (!spec || !spec.startsWith('.')) continue; // skip bare/package imports
    if (!resolves(file, spec)) {
      problems.push(`${file.replace(srcRoot, 'src')} -> '${spec}'`);
    }
  }
}

console.log(`Scanned ${files.length} TypeScript files.`);
if (problems.length) {
  console.error(`\n❌ ${problems.length} unresolved relative import(s):\n  ` + problems.join('\n  '));
  process.exit(1);
}
console.log('✅ All relative imports resolve to existing files.');
