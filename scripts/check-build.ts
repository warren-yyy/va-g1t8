/*
 * Runs automatically after `npm run build`, once the export path fix has run.
 *
 * Checks the built HTML for the rule on expanders: the site has none, with one exception,
 * the "Full data, methods and limitations" block in #data-methods. Every other page must
 * have no <details> at all.
 */
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.cwd(), 'out');
const problems: string[] = [];

function htmlFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(full);
    return entry.name.endsWith('.html') ? [full] : [];
  });
}

if (!fs.existsSync(OUT)) {
  console.error('No out/ folder. Run npm run build.');
  process.exit(1);
}

for (const file of htmlFiles(OUT)) {
  const html = fs.readFileSync(file, 'utf8');
  const details = html.match(/<details\b[^>]*>/g) ?? [];
  const name = path.relative(OUT, file).split(path.sep).join('/');

  if (name !== 'index.html') {
    if (details.length) problems.push(`${name} has ${details.length} <details>; only index.html may have one.`);
    continue;
  }

  if (details.length !== 1) {
    problems.push(`index.html has ${details.length} <details>; it must have exactly 1.`);
    continue;
  }
  if (!details[0]!.includes('methods__details')) problems.push('The <details> in index.html is not the methods block.');

  // It must sit inside #data-methods: after that section opens and before the next one does.
  const sectionStart = html.indexOf('id="data-methods"');
  const detailsAt = html.indexOf(details[0]!);
  const nextSection = html.indexOf('<section class="part', sectionStart + 1);
  if (sectionStart === -1 || detailsAt < sectionStart || (nextSection !== -1 && detailsAt > nextSection)) {
    problems.push('The <details> in index.html is not inside #data-methods.');
  }
}

if (problems.length) {
  console.error(`Build check FAILED:\n${problems.map((problem) => `  - ${problem}`).join('\n')}`);
  process.exit(1);
}
console.log('Build check passed: exactly one <details>, inside #data-methods.');
