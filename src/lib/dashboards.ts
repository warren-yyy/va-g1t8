import config, { type Dashboard, type Part } from '@/site.config';
import { normalizeTableauUrl } from '@/lib/tableau';

/** Core dashboards always show. Extras stay hidden until they have a url. */
export function visibleDashboards(partNumber: number): Dashboard[] {
  return config.dashboards.filter(
    (dashboard) => dashboard.part === partNumber && (!dashboard.extra || normalizeTableauUrl(dashboard.url) !== ''),
  );
}

/** The answer sentence is a draft until D13, which it summarises, is published. */
export function answerIsDraft(): boolean {
  return normalizeTableauUrl(config.dashboards.find((dashboard) => dashboard.id === 'D13')?.url) === '';
}

/**
 * D12b shows the current NEA clusters, so the site's own cluster map is only needed until
 * D12b has a url.
 */
export function showClusterMap(): boolean {
  return normalizeTableauUrl(config.dashboards.find((dashboard) => dashboard.id === 'D12b')?.url) === '';
}

export function getPart(partNumber: number): Part {
  const part = config.parts.find((candidate) => candidate.number === partNumber);
  if (!part) throw new Error(`No part ${partNumber} in src/site.config.ts`);
  return part;
}
