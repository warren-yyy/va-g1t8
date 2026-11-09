import config, { type Dashboard, type Part } from '@/site.config';
import { normalizeTableauUrl } from '@/lib/tableau';

/** Core dashboards always show. Extras stay hidden until they have a url. */
export function visibleDashboards(partNumber: number): Dashboard[] {
  return config.dashboards.filter(
    (dashboard) => dashboard.part === partNumber && (!dashboard.extra || normalizeTableauUrl(dashboard.url) !== ''),
  );
}

export function getPart(partNumber: number): Part {
  const part = config.parts.find((candidate) => candidate.number === partNumber);
  if (!part) throw new Error(`No part ${partNumber} in src/site.config.ts`);
  return part;
}
