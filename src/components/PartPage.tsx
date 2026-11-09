import type { Metadata } from 'next';
import Link from 'next/link';
import config from '@/site.config';
import DashboardSection from '@/components/DashboardSection';
import { getPart, visibleDashboards } from '@/lib/dashboards';
import { fill } from '@/lib/fill';

export function partMetadata(partNumber: number): Metadata {
  const part = getPart(partNumber);
  return {
    title: `${part.number} ${part.title}: ${part.question}`,
    description: `Part ${part.number} of ${config.parts.length}. ${part.question}`,
  };
}

function PartPager({ partNumber }: { partNumber: number }) {
  const previous = config.parts.find((part) => part.number === partNumber - 1);
  const next = config.parts.find((part) => part.number === partNumber + 1);
  return (
    <nav className="pager" aria-label="Previous and next part">
      <Link className="pager__link" href={previous ? `/${previous.slug}` : '/'}>
        <span className="pager__kicker">{previous ? `Previous: part ${previous.number}` : 'Previous'}</span>
        <span className="pager__label">{previous ? previous.title : 'Home'}</span>
      </Link>
      <Link className="pager__link pager__link--next" href={next ? `/${next.slug}` : '/data-methods'}>
        <span className="pager__kicker">{next ? `Next: part ${next.number}` : 'Next'}</span>
        <span className="pager__label">{next ? next.title : 'Data & Methods'}</span>
      </Link>
    </nav>
  );
}

/** The one template all five part routes render through. */
export default function PartPage({ partNumber }: { partNumber: number }) {
  const part = getPart(partNumber);
  return (
    <div className="part">
      <header className="part__head">
        <p className="part__kicker">
          Part {part.number} &middot; {part.role}
        </p>
        <h1 className="part__title">{part.question}</h1>
        <p className="part__intro">{fill(part.intro)}</p>
      </header>
      {visibleDashboards(partNumber).map((dashboard) => (
        <DashboardSection key={dashboard.id} dashboard={dashboard} />
      ))}
      <PartPager partNumber={partNumber} />
    </div>
  );
}
