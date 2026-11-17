/*
 * npm run check
 * Prints the status of every view's url, height, description, howTo and takeaway, and
 * of every part's findings and bridge. An empty value is only reported, and a view whose
 * height is not confirmed gets a warning. A malformed url or height fails, and so does anything else that would break the page (too many embeds in one
 * part's tabs, an extra page with no route).
 */
import fs from 'node:fs';
import path from 'node:path';
import config from '../src/site.config';
import { DEFAULT_DASHBOARD_HEIGHT, normalizeTableauUrl, vizSize } from '../src/lib/tableau';

// Only the active tab loads, but every embed in a part's tabs can end up loaded at once.
const MAX_EMBEDS_PER_PART = 4;
const problems: string[] = [];
const warnings: string[] = [];

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
  let heightStatus: string;
  if (d.height === null) {
    heightStatus = `not confirmed (${DEFAULT_DASHBOARD_HEIGHT})`;
    warnings.push(`${d.id}: height not confirmed, using ${DEFAULT_DASHBOARD_HEIGHT}. Copy it from the dashboard's Size panel.`);
  } else if (!Number.isInteger(d.height) || d.height <= 0) {
    heightStatus = 'INVALID';
    problems.push(`${d.id}: height must be a positive whole number of px, or null.`);
  } else {
    heightStatus = `${d.height} (iframe ${vizSize(d.height).height})`;
  }
  return {
    id: d.id,
    title: d.title,
    part: String(d.part),
    type: d.extra ? 'extra' : 'core',
    owner: d.owner,
    url: urlStatus,
    height: heightStatus,
    description: status(d.description),
    howTo: status(d.howTo),
    takeaway: status(d.takeaway),
    onSite: d.extra ? (normalized ? 'embed' : 'hidden') : normalized ? 'embed' : 'coming soon',
    normalized,
  };
});

const columns = ['id', 'title', 'part', 'type', 'owner', 'url', 'height', 'description', 'howTo', 'takeaway', 'onSite'] as const;
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
  if (embeds > MAX_EMBEDS_PER_PART) {
    problems.push(`Part ${part.number} has ${embeds} embeds; the most a part may have is ${MAX_EMBEDS_PER_PART}.`);
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

const count = (key: 'url' | 'description' | 'howTo' | 'takeaway') =>
  rows.filter((row) => row[key] === 'empty').length;
const unconfirmed = config.dashboards.filter((d) => d.height === null).length;
console.log(
  `\n${rows.length} views: url empty on ${count('url')}, height not confirmed on ${unconfirmed}, description empty on ${count('description')}, howTo empty on ${count('howTo')}, takeaway empty on ${count('takeaway')}.`,
);

console.log('\npart  slug               intro  findings  bridge');
for (const part of config.parts) {
  const findings = part.findings && part.findings.length > 0 ? `${part.findings.length} set` : 'empty';
  console.log(
    `${String(part.number).padEnd(4)}  ${part.slug.padEnd(17)}  ${status(part.intro).padEnd(5)}  ${findings.padEnd(8)}  ${status(part.bridge)}`,
  );
}

if (warnings.length) {
  console.warn(`\nWarning: ${warnings.length} view(s) have no confirmed height.`);
  warnings.forEach((warning) => console.warn(`  - ${warning}`));
}

if (problems.length) {
  console.error(`\nCheck FAILED, ${problems.length} problem(s):`);
  problems.forEach((problem) => console.error(`  - ${problem}`));
  process.exit(1);
}
console.log('Check passed. Empty fields are allowed; malformed links are not.');
