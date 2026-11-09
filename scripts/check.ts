/*
 * npm run check
 * Prints the status of every dashboard's url, howTo and takeaway. An empty value is
 * only reported. A malformed url fails, and so does anything else that would break
 * the page (too many embeds on a part, an extra page with no route).
 */
import fs from 'node:fs';
import path from 'node:path';
import config from '../src/site.config';
import { normalizeTableauUrl } from '../src/lib/tableau';

const MAX_EMBEDS_PER_PAGE = 4;
const problems: string[] = [];

function status(value: string | null | undefined): string {
  return value === null || value === undefined || value === '' ? 'empty' : 'set';
}

const rows = config.dashboards.map((d) => {
  let urlStatus = status(d.url);
  let normalized = '';
  try {
    normalized = normalizeTableauUrl(d.url);
    if (normalized && normalized !== d.url) urlStatus = 'set (normalized)';
  } catch (error) {
    urlStatus = 'MALFORMED';
    problems.push(`${d.id}: ${(error as Error).message}`);
  }
  return {
    id: d.id,
    title: d.title,
    part: String(d.part),
    type: d.extra ? 'extra' : 'core',
    owner: d.owner,
    url: urlStatus,
    howTo: status(d.howTo),
    takeaway: status(d.takeaway),
    onSite: d.extra ? (normalized ? 'embed' : 'hidden') : normalized ? 'embed' : 'coming soon',
    normalized,
  };
});

const columns = ['id', 'title', 'part', 'type', 'owner', 'url', 'howTo', 'takeaway', 'onSite'] as const;
const widths = columns.map((column) => Math.max(column.length, ...rows.map((row) => row[column].length)));
const printLine = (cells: readonly string[]) =>
  console.log(cells.map((cell, index) => cell.padEnd(widths[index] ?? 0)).join('  ').trimEnd());

printLine(columns);
printLine(widths.map((width) => '-'.repeat(width)));
rows.forEach((row) => printLine(columns.map((column) => row[column])));

for (const row of rows.filter((candidate) => candidate.normalized)) {
  console.log(`\n${row.id} embeds ${row.normalized}`);
}

for (const part of config.parts) {
  const embeds = rows.filter((row) => row.part === String(part.number) && row.normalized).length;
  if (embeds > MAX_EMBEDS_PER_PAGE) {
    problems.push(`Part ${part.number} has ${embeds} embeds; the most a page may have is ${MAX_EMBEDS_PER_PAGE}.`);
  }
}

const ids = new Set<string>();
for (const d of config.dashboards) {
  if (ids.has(d.id)) problems.push(`Duplicate dashboard id ${d.id}.`);
  ids.add(d.id);
  if (!config.parts.some((part) => part.number === d.part)) {
    problems.push(`${d.id} points at part ${d.part}, which does not exist.`);
  }
}

for (const page of config.extraPages) {
  const route = path.resolve('src', 'app', page.slug, 'page.tsx');
  if (!fs.existsSync(route)) problems.push(`extraPages "${page.slug}" has no src/app/${page.slug}/page.tsx. See README.md.`);
}

const count = (key: 'url' | 'howTo' | 'takeaway') => rows.filter((row) => row[key] === 'empty').length;
console.log(
  `\n${rows.length} dashboards: url empty on ${count('url')}, howTo empty on ${count('howTo')}, takeaway empty on ${count('takeaway')}.`,
);

if (problems.length) {
  console.error(`\nCheck FAILED, ${problems.length} problem(s):`);
  problems.forEach((problem) => console.error(`  - ${problem}`));
  process.exit(1);
}
console.log('Check passed. Empty fields are allowed; malformed links are not.');
