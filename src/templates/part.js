import { VIZ_SIZE, normalizeTableauUrl } from '../lib/tableau-embed.js';
import { esc, externalLink, fill } from './helpers.js';

/** Extras stay hidden until they have a url. Core dashboards always show. */
export function visibleDashboards(config, partNumber) {
  return config.dashboards.filter(
    (d) => d.part === partNumber && (!d.extra || normalizeTableauUrl(d.url) !== ''),
  );
}

function comingSoonPanel(d) {
  return `<div class="panel panel--empty">
        <p class="panel__badge">Dashboard coming soon</p>
        <p class="panel__title">${esc(d.id)} ${esc(d.title)}</p>
        <p class="panel__question">${esc(d.question)}</p>
      </div>`;
}

function embedPanel(d, url) {
  return `<div class="panel">
        <div class="embed" data-embed data-url="${esc(url)}">
          <div class="embed__frame" data-embed-frame style="--viz-w:${VIZ_SIZE.width};--viz-h:${VIZ_SIZE.height}">
            <div class="embed__status" data-embed-status>
              <p class="panel__title">${esc(d.id)} ${esc(d.title)}</p>
              <p class="embed__message"><span class="spinner" aria-hidden="true"></span><span data-embed-message>Loading dashboard</span></p>
              <noscript><p class="embed__noscript">This dashboard needs JavaScript. You can still open it in Tableau Public with the link below.</p></noscript>
            </div>
          </div>
        </div>
      </div>`;
}

function dashboardSection(d, tokens) {
  const url = normalizeTableauUrl(d.url);
  const anchor = d.id.toLowerCase();
  const alt = d.alt ?? d.question;

  const howTo = d.howTo ? `<p class="dash__howto" data-reveal>${esc(fill(d.howTo, tokens))}</p>` : '';
  const takeaway = d.takeaway
    ? `<p class="dash__takeaway" data-reveal>${esc(fill(d.takeaway, tokens))}${
        d.takeawayNote ? ` <span class="dash__scope">${esc(fill(d.takeawayNote, tokens))}</span>` : ''
      }</p>`
    : '';

  // The alt text describes the embed, so it only applies once there is one.
  const altText = url ? `<p class="sr-only">Dashboard contents: ${esc(alt)}</p>` : '';
  const caption = altText || takeaway ? `<figcaption>${altText}${takeaway}</figcaption>` : '';

  return `<section class="dash" id="${esc(anchor)}" aria-labelledby="${esc(anchor)}-title">
    <div class="dash__head">
      <h2 class="dash__title" id="${esc(anchor)}-title"><span class="dash__id">${esc(d.id)}</span> ${esc(d.title)}</h2>
      <p class="dash__question">${esc(d.question)}</p>
    </div>
    ${howTo}
    <figure class="dash__figure">
      ${url ? `<a class="skip-dash" href="#${esc(anchor)}-after">Skip dashboard ${esc(d.id)}</a>` : ''}
      ${url ? embedPanel(d, url) : comingSoonPanel(d)}
      ${url ? `<div class="dash__after" id="${esc(anchor)}-after" tabindex="-1">
        <p class="dash__open">${externalLink(url, 'Open in Tableau Public')}</p>
        <p class="dash__desktop-note">Best viewed on desktop.</p>
      </div>` : ''}
      ${caption}
    </figure>
  </section>`;
}

function pager(config, partNumber) {
  const previous = config.parts.find((p) => p.number === partNumber - 1);
  const next = config.parts.find((p) => p.number === partNumber + 1);
  const previousLink = previous
    ? { href: `/${previous.slug}`, kicker: `Previous: part ${previous.number}`, label: previous.title }
    : { href: '/', kicker: 'Previous', label: 'Home' };
  const nextLink = next
    ? { href: `/${next.slug}`, kicker: `Next: part ${next.number}`, label: next.title }
    : { href: '/data-methods', kicker: 'Next', label: 'Data & Methods' };
  const link = (item, className) =>
    `<a class="pager__link ${className}" href="${esc(item.href)}"><span class="pager__kicker">${esc(item.kicker)}</span><span class="pager__label">${esc(item.label)}</span></a>`;
  return `<nav class="pager" aria-label="Previous and next part">${link(previousLink, 'pager__link--previous')}${link(nextLink, 'pager__link--next')}</nav>`;
}

/** The one template all five part pages render through. */
export function renderPartPage(config, partNumber, tokens) {
  const part = config.parts.find((p) => p.number === partNumber);
  if (!part) throw new Error(`No part ${partNumber} in src/site.config.js`);

  const sections = visibleDashboards(config, partNumber).map((d) => dashboardSection(d, tokens)).join('\n  ');

  return `<div class="part">
  <header class="part__head">
    <p class="part__kicker">Part ${part.number} &middot; ${esc(part.role)}</p>
    <h1 class="part__title" data-headline>${esc(part.question)}</h1>
    <p class="part__intro" data-reveal>${esc(fill(part.intro, tokens))}</p>
  </header>
  ${sections}
  ${pager(config, partNumber)}
</div>`;
}
