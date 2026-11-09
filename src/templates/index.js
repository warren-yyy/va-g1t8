/*
 * Build-time rendering. The .html files in the repo root are thin: each holds only a
 * data-part or data-page attribute. scripts/render-plugin.mjs passes them through
 * renderDocument, so every page ships as real HTML that works without JavaScript.
 */
import fs from 'node:fs';
import path from 'node:path';
import { renderShell } from './shell.js';
import { renderPartPage } from './part.js';
import { esc } from './helpers.js';

function readJson(relativePath, fallback) {
  const file = path.resolve(process.cwd(), relativePath);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : fallback;
}

export function renderDocument(thinHtml, requestPath, config) {
  const partMatch = thinHtml.match(/data-part="(\d+)"/);
  const pageMatch = thinHtml.match(/data-page="([\w-]+)"/);
  const stats = readJson('src/data/stats.json', { tokens: {} });
  const tokens = stats.tokens ?? {};

  if (partMatch) {
    const number = Number(partMatch[1]);
    const part = config.parts.find((p) => p.number === number);
    return renderShell(config, {
      path: requestPath,
      title: `${part.number} ${part.title}: ${part.question}`,
      description: `Part ${part.number} of ${config.parts.length}. ${part.question}`,
      smooth: config.smoothScrollOnPartPages,
      progress: true,
      main: renderPartPage(config, number, tokens),
    });
  }

  if (pageMatch?.[1] === 'home') {
    return renderShell(config, {
      path: requestPath,
      title: config.site.mainQuestion,
      description: config.site.scope,
      smooth: true,
      main: `<h1>${esc(config.site.mainQuestion)}</h1>`,
    });
  }

  if (pageMatch?.[1] === 'data-methods') {
    return renderShell(config, {
      path: requestPath,
      title: 'Data & Methods',
      description: 'Datasets, cleaning, how each headline number was computed, and the limitations.',
      smooth: true,
      main: '<h1>Data &amp; Methods</h1>',
    });
  }

  const extra = config.extraPages.find((page) => page.slug === pageMatch?.[1]);
  if (extra) {
    return renderShell(config, {
      path: requestPath,
      title: extra.title,
      description: extra.description ?? extra.title,
      smooth: true,
      main: `<div class="prose-page"><h1 data-headline>${esc(extra.title)}</h1>${extra.body ?? ''}</div>`,
    });
  }

  throw new Error(`Page needs data-part or a known data-page: ${requestPath}`);
}
