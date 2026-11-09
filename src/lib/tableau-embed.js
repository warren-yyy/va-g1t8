/*
 * Tableau Public embeds.
 *
 * Importing this file does not touch the DOM, so the build templates and
 * scripts/check.mjs can use VIZ_SIZE and normalizeTableauUrl in Node.
 */

// The one place the viz size is set. The dashboards are fixed at 1200 x 800. Tableau
// draws its 27px bottom toolbar directly under the dashboard, inside the same iframe.
// Measured in Chrome: with an iframe only as tall as the dashboard, the toolbar is
// clipped and the inner document scrolls. With 27px more, it fits exactly.
export const VIZ_SIZE = { width: 1200, height: 827 };

const EMBED_API = 'https://public.tableau.com/javascripts/api/tableau.embedding.3.latest.min.js';
const TABLEAU_HOST = 'public.tableau.com';
const LOAD_ROOT_MARGIN = '800px 0px';
const LOAD_TIMEOUT_MS = 30000;

export class TableauUrlError extends Error {}

/**
 * Turns any Tableau Public link for a dashboard into the form the embed needs:
 * https://public.tableau.com/views/<Workbook>/<Dashboard>
 *
 * Empty input returns ''. Anything that is not a dashboard link throws.
 */
export function normalizeTableauUrl(input) {
  const raw = String(input ?? '').trim();
  if (!raw) return '';

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new TableauUrlError(`not a full URL: "${raw}"`);
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new TableauUrlError(`not an http(s) URL: "${raw}"`);
  }
  if (parsed.hostname !== TABLEAU_HOST) {
    throw new TableauUrlError(`host must be ${TABLEAU_HOST}: "${raw}"`);
  }

  const segments = parsed.pathname.split('/').filter(Boolean);
  let workbook;
  let dashboard;
  if (segments.length === 3 && segments[0] === 'views') {
    [, workbook, dashboard] = segments;
  } else if (segments.length === 6 && segments[0] === 'app' && segments[1] === 'profile' && segments[3] === 'viz') {
    [, , , , workbook, dashboard] = segments;
  } else {
    throw new TableauUrlError(
      `expected /views/<Workbook>/<Dashboard> or /app/profile/<user>/viz/<Workbook>/<Dashboard>: "${raw}"`,
    );
  }
  return `https://${TABLEAU_HOST}/views/${workbook}/${dashboard}`;
}

let apiPromise = null;

// A dynamic import is a module load that happens once, however many embeds ask for
// it, and it is the only way to reach the TableauEventType enum the module exports.
function loadEmbeddingApi() {
  if (!apiPromise) apiPromise = import(/* @vite-ignore */ EMBED_API);
  return apiPromise;
}

function fitStage(frame, stage) {
  const available = frame.parentElement.clientWidth;
  const scale = Math.min(1, available / VIZ_SIZE.width);
  stage.style.transform = scale < 1 ? `scale(${scale})` : 'none';
  frame.style.height = `${VIZ_SIZE.height * scale}px`;
}

function setStatus(embed, state) {
  embed.dataset.state = state;
  const status = embed.querySelector('[data-embed-status]');
  if (!status) return;
  if (state === 'ready') {
    status.hidden = true;
    return;
  }
  status.hidden = false;
  if (state === 'error') {
    status.querySelector('[data-embed-message]').textContent =
      'This dashboard could not load. Try the Tableau Public link below.';
    status.setAttribute('role', 'alert');
  }
}

async function mountViz(embed) {
  const frame = embed.querySelector('[data-embed-frame]');
  const stage = frame.querySelector('[data-embed-stage]');
  setStatus(embed, 'loading');

  let api;
  try {
    api = await loadEmbeddingApi();
  } catch (error) {
    console.error('Tableau embedding API failed to load', error);
    setStatus(embed, 'error');
    return;
  }

  const { TableauEventType } = api;
  const viz = document.createElement('tableau-viz');
  viz.setAttribute('src', embed.dataset.url);
  viz.setAttribute('toolbar', 'bottom');
  viz.setAttribute('hide-tabs', '');
  viz.setAttribute('device', 'desktop');
  viz.setAttribute('width', String(VIZ_SIZE.width));
  viz.setAttribute('height', String(VIZ_SIZE.height));

  const timeout = window.setTimeout(() => setStatus(embed, 'error'), LOAD_TIMEOUT_MS);
  viz.addEventListener(TableauEventType.FirstInteractive, () => {
    window.clearTimeout(timeout);
    setStatus(embed, 'ready');
  });
  viz.addEventListener(TableauEventType.VizLoadError, (event) => {
    window.clearTimeout(timeout);
    console.error('Tableau viz failed to load', embed.dataset.url, event.detail);
    setStatus(embed, 'error');
  });

  stage.append(viz);
}

/** Sizes every stage now, and loads each viz the first time it comes near the viewport. */
export function initEmbeds(root = document) {
  const embeds = [...root.querySelectorAll('[data-embed]')];
  if (!embeds.length) return;

  const resizer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const frame = entry.target.querySelector('[data-embed-frame]');
      fitStage(frame, frame.querySelector('[data-embed-stage]'));
    }
  });

  const loader = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        // Stays mounted after this, so filter state survives scrolling away and back.
        loader.unobserve(entry.target);
        mountViz(entry.target);
      }
    },
    { rootMargin: LOAD_ROOT_MARGIN },
  );

  for (const embed of embeds) {
    const frame = embed.querySelector('[data-embed-frame]');
    const stage = document.createElement('div');
    stage.className = 'embed__stage';
    stage.dataset.embedStage = '';
    stage.style.width = `${VIZ_SIZE.width}px`;
    stage.style.height = `${VIZ_SIZE.height}px`;
    frame.prepend(stage);
    fitStage(frame, stage);
    resizer.observe(embed);
    loader.observe(embed);
  }
}
