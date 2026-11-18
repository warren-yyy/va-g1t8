/*
 * npm run check
 * Prints the status of every view's url, height, description, howTo, takeaway and
 * whyItMatters, and of every part's findings and bridge. An empty value is only reported,
 * and a view whose height is not confirmed gets a warning. A malformed url or height fails, and so does
 * anything else that would break the page (more than 8 tabs in one part, a duplicate id,
 * an extra page with no route).
 */
import fs from 'node:fs';
import path from 'node:path';
import config from '../src/site.config';
import { DEFAULT_DASHBOARD_HEIGHT, normalizeTableauUrl, vizSize } from '../src/lib/tableau';

// Only the active tab loads, so more views per part cost nothing until they are opened.
// The limit keeps a part's tab bar readable. Extras count, as they may get a url later.
const MAX_TABS_PER_PART = 8;
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
    whyItMatters: status(d.whyItMatters),
    onSite: d.extra ? (normalized ? 'embed' : 'hidden') : normalized ? 'embed' : 'coming soon',
    normalized,
  };
});

const columns = ['id', 'title', 'part', 'type', 'owner', 'url', 'height', 'description', 'howTo', 'takeaway', 'whyItMatters', 'onSite'] as const;
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
  const tabs = config.dashboards.filter((d) => d.part === part.number).length;
  if (tabs > MAX_TABS_PER_PART) {
    problems.push(`Part ${part.number} has ${tabs} views; the most a part may have is ${MAX_TABS_PER_PART} tabs.`);
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

// Links between views, written [text](#d5a) in a view's text, must point at a real view.
const viewLink = /\]\(#(d\d+[a-z]?)\)/gi;
for (const d of config.dashboards) {
  for (const text of [d.description, d.howTo, d.takeaway, d.whyItMatters]) {
    for (const match of (text ?? '').matchAll(viewLink)) {
      const target = (match[1] ?? '').toLowerCase();
      if (!config.dashboards.some((other) => other.id.toLowerCase() === target)) {
        problems.push(`${d.id}: link to #${target}, which is not a view.`);
      }
    }
  }
}

for (const page of config.extraPages) {
  const route = path.resolve('src', 'app', page.slug, 'page.tsx');
  if (!fs.existsSync(route)) problems.push(`extraPages "${page.slug}" has no src/app/${page.slug}/page.tsx. See README.md.`);
}

const count = (key: 'url' | 'description' | 'howTo' | 'takeaway' | 'whyItMatters') =>
  rows.filter((row) => row[key] === 'empty').length;
const unconfirmed = config.dashboards.filter((d) => d.height === null).length;
console.log(
  `\n${rows.length} views: url empty on ${count('url')}, height not confirmed on ${unconfirmed}, description empty on ${count('description')}, howTo empty on ${count('howTo')}, takeaway empty on ${count('takeaway')}, whyItMatters empty on ${count('whyItMatters')}.`,
);

const slugWidth = Math.max(...config.parts.map((part) => part.slug.length));
console.log(`\npart  ${'slug'.padEnd(slugWidth)}  intro  findings  bridge`);
for (const part of config.parts) {
  const findings = part.findings && part.findings.length > 0 ? `${part.findings.length} set` : 'empty';
  console.log(
    `${String(part.number).padEnd(4)}  ${part.slug.padEnd(slugWidth)}  ${status(part.intro).padEnd(5)}  ${findings.padEnd(8)}  ${status(part.bridge)}`,
  );
}

const { conclusion } = config;
for (const finding of conclusion.keyFindings) {
  if (!config.parts.some((part) => part.number === finding.part)) {
    problems.push(`A Conclusion key finding points at part ${finding.part}, which does not exist.`);
  }
}
const implications = conclusion.implications?.length ? `${conclusion.implications.length} set` : 'empty';
console.log(
  `\nConclusion: answer ${status(conclusion.answer)}, key findings ${conclusion.keyFindings.length} set, implications ("What this means") ${implications}.`,
);

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
