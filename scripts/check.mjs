/*
 * npm run check
 * Prints the status of every dashboard's url, howTo and takeaway. An empty value is
 * only reported. A malformed url fails, and so does anything else that would break
 * the page (too many embeds on a part, an extra page with no HTML file).
 */
import fs from 'node:fs';
import path from 'node:path';
import config from '../src/site.config.js';
import { normalizeTableauUrl } from '../src/lib/tableau-embed.js';

const MAX_EMBEDS_PER_PAGE = 4;
const problems = [];

function status(value) {
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
    problems.push(`${d.id}: ${error.message}`);
  }
  return {
    id: d.id,
    title: d.title,
    part: d.part,
    type: d.extra ? 'extra' : 'core',
    owner: d.owner,
    url: urlStatus,
    howTo: status(d.howTo),
    takeaway: status(d.takeaway),
    normalized,
    onSite: d.extra ? (normalized ? 'shown' : 'hidden') : normalized ? 'embed' : 'coming soon',
  };
});

const columns = ['id', 'title', 'part', 'type', 'owner', 'url', 'howTo', 'takeaway', 'onSite'];
const widths = Object.fromEntries(
  columns.map((column) => [column, Math.max(column.length, ...rows.map((row) => String(row[column]).length))]),
);
const line = (cells) => columns.map((column) => String(cells[column]).padEnd(widths[column])).join('  ');

console.log(line(Object.fromEntries(columns.map((column) => [column, column]))));
console.log(columns.map((column) => '-'.repeat(widths[column])).join('  '));
rows.forEach((row) => console.log(line(row)));

for (const row of rows.filter((r) => r.normalized)) {
  console.log(`\n${row.id} embeds ${row.normalized}`);
}

for (const part of config.parts) {
  const embeds = rows.filter((row) => row.part === part.number && row.normalized).length;
  if (embeds > MAX_EMBEDS_PER_PAGE) {
    problems.push(`Part ${part.number} has ${embeds} embeds; the most a page may have is ${MAX_EMBEDS_PER_PAGE}.`);
  }
}

const ids = new Set();
for (const d of config.dashboards) {
  if (ids.has(d.id)) problems.push(`Duplicate dashboard id ${d.id}.`);
  ids.add(d.id);
  if (!config.parts.some((part) => part.number === d.part)) problems.push(`${d.id} points at part ${d.part}, which does not exist.`);
}

for (const page of config.extraPages) {
  const file = path.resolve(`${page.slug}.html`);
  if (!fs.existsSync(file)) problems.push(`extraPages "${page.slug}" has no ${page.slug}.html file. See README.md.`);
}

const count = (key, value) => rows.filter((row) => row[key] === value).length;
console.log(
  `\n${rows.length} dashboards: url empty on ${count('url', 'empty')}, howTo empty on ${count('howTo', 'empty')}, takeaway empty on ${count('takeaway', 'empty')}.`,
);

if (problems.length) {
  console.error(`\nCheck FAILED, ${problems.length} problem(s):`);
  problems.forEach((problem) => console.error(`  - ${problem}`));
  process.exit(1);
}
console.log('Check passed. Empty fields are allowed; malformed links are not.');
