/*
 * Deep links to views: #d4, #d2a, #d12b... A view's anchor is its id in lower case.
 * Kept free of site.config.ts so client components can import it cheaply.
 */

/** Matches a view anchor, such as d4 or d12b, and the legacy anchors below. */
export const VIEW_ANCHOR = /^d\d+[a-z]?$/i;

/**
 * Links from before the dashboards were split into views. Each opens the first view of
 * the old dashboard, so #d2 still lands on Part 1, now on D2a.
 */
export const LEGACY_ANCHORS: Readonly<Record<string, string>> = {
  d2: 'd2a',
  d3: 'd3a',
  d6: 'd6a',
  d8: 'd8a',
  d9: 'd9a',
  d11: 'd11a',
  d12: 'd12a',
};

/** The view anchor a hash (without the #) points at, following the legacy aliases. */
export function resolveViewAnchor(hash: string): string {
  const anchor = hash.toLowerCase();
  return LEGACY_ANCHORS[anchor] ?? anchor;
}
