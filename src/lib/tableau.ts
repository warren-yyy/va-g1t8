/*
 * Tableau helpers. Nothing here touches the DOM on import, so Server Components and
 * scripts/check.ts can use VIZ_SIZE and normalizeTableauUrl too.
 */

// The one place the viz size is set. The dashboards are fixed at 1200 x 800. Tableau
// draws its 27px bottom toolbar directly under the dashboard, inside the same iframe.
// Measured in Chrome: with an iframe only as tall as the dashboard, the toolbar is
// clipped and the inner document scrolls. With 27px more, it fits exactly.
export const VIZ_SIZE = { width: 1200, height: 827 } as const;

const TABLEAU_HOST = 'public.tableau.com';

export class TableauUrlError extends Error {}

/**
 * Turns any Tableau Public link for a dashboard into the form the embed needs:
 * https://public.tableau.com/views/<Workbook>/<Dashboard>
 *
 * Empty input returns ''. Anything that is not a dashboard link throws.
 */
export function normalizeTableauUrl(input: string | null | undefined): string {
  const raw = String(input ?? '').trim();
  if (!raw) return '';

  let parsed: URL;
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
  let workbook: string | undefined;
  let dashboard: string | undefined;
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

type TableauApi = typeof import('https://public.tableau.com/javascripts/api/tableau.embedding.3.latest.min.js');

let apiPromise: Promise<TableauApi> | null = null;

/**
 * Loads the embedding API once, however many embeds ask for it. A native dynamic import
 * that the bundler leaves alone, and the only way to reach the TableauEventType enum.
 */
export function loadTableauApi(): Promise<TableauApi> {
  if (!apiPromise) {
    apiPromise = import(
      /* webpackIgnore: true */
      /* turbopackIgnore: true */
      'https://public.tableau.com/javascripts/api/tableau.embedding.3.latest.min.js'
    ).catch((error: unknown) => {
      // Let a later embed try again rather than reuse the failure.
      apiPromise = null;
      throw error;
    });
  }
  return apiPromise;
}
