import type { Metadata } from 'next';
import Link from 'next/link';
import config from '@/site.config';
import DashboardSection from '@/components/DashboardSection';
import HeadlineReveal from '@/components/HeadlineReveal';
import ProgressBar from '@/components/ProgressBar';
import Reveal from '@/components/Reveal';
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
      <ProgressBar />
      <header className="part__head">
        <p className="part__kicker">
          Part {part.number} &middot; {part.role}
        </p>
        <HeadlineReveal className="part__title" text={part.question} />
        <Reveal as="p" className="part__intro">
          {fill(part.intro)}
        </Reveal>
      </header>
      {visibleDashboards(partNumber).map((dashboard) => (
        <DashboardSection key={dashboard.id} dashboard={dashboard} />
      ))}
      <PartPager partNumber={partNumber} />
    </div>
  );
}
