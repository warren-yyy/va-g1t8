import ClusterMap from '@/components/ClusterMap';
import DashboardSection from '@/components/DashboardSection';
import HeadlineReveal from '@/components/HeadlineReveal';
import Reveal from '@/components/Reveal';
import { getPart, visibleDashboards } from '@/lib/dashboards';
import { fill } from '@/lib/fill';

/** One part of the story, as a section of the single page. Its id is the part's slug. */
export default function PartSection({ partNumber }: { partNumber: number }) {
  const part = getPart(partNumber);
  const titleId = `${part.slug}-title`;
  return (
    <section className="part" id={part.slug} aria-labelledby={titleId} tabIndex={-1}>
      <header className="part__head">
        <p className="part__kicker">
          Part {part.number} &middot; {part.role}
        </p>
        <HeadlineReveal as="h2" id={titleId} className="part__title" text={part.question} onScroll />
        <Reveal as="p" className="part__intro">
          {fill(part.intro)}
        </Reveal>
      </header>
      {visibleDashboards(partNumber).map((dashboard) => (
        <DashboardSection key={dashboard.id} dashboard={dashboard} />
      ))}
      {part.slug === 'singapore' && <ClusterMap />}
    </section>
  );
}
