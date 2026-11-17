import config from '@/site.config';
import ClusterMap from '@/components/ClusterMap';
import DashboardSection from '@/components/DashboardSection';
import DashboardTabs from '@/components/DashboardTabs';
import HeadlineReveal from '@/components/HeadlineReveal';
import Reveal from '@/components/Reveal';
import { answerIsDraft, getPart, visibleDashboards } from '@/lib/dashboards';
import { fill } from '@/lib/fill';

/**
 * One part of the story, as a section of the single page. Its id is the part's slug.
 * Order: kicker, title, intro, dashboards, (Singapore's cluster map), findings, bridge.
 */
export default function PartSection({ partNumber }: { partNumber: number }) {
  const part = getPart(partNumber);
  const titleId = `${part.slug}-title`;
  const findingsId = `${part.slug}-findings`;
  const dashboards = visibleDashboards(partNumber);

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

      {dashboards.length > 0 && (
        <DashboardTabs
          label={`Part ${part.number} dashboards`}
          tabs={dashboards.map((dashboard) => ({ id: dashboard.id, label: dashboard.title }))}
        >
          {dashboards.map((dashboard) => (
            <DashboardSection key={dashboard.id} dashboard={dashboard} />
          ))}
        </DashboardTabs>
      )}

      {part.slug === 'singapore' && <ClusterMap />}

      {part.findings && part.findings.length > 0 && (
        <div className="findings" aria-labelledby={findingsId}>
          <h3 className="findings__title" id={findingsId}>
            What we found
          </h3>
          {part.findings.map((finding) => (
            <Reveal as="p" key={finding} className="findings__item">
              {fill(finding)}
              {finding === config.answerSentence && answerIsDraft() && (
                <span className="draft-tag">Draft until D13 is published</span>
              )}
            </Reveal>
          ))}
        </div>
      )}

      {part.bridge && (
        <Reveal as="p" className="part__bridge">
          {fill(part.bridge)}
        </Reveal>
      )}
    </section>
  );
}
