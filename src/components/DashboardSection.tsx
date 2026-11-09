import type { Dashboard } from '@/site.config';
import { fill } from '@/lib/fill';
import { normalizeTableauUrl } from '@/lib/tableau';
import DashboardEmbed from '@/components/DashboardEmbed';
import Reveal from '@/components/Reveal';

export default function DashboardSection({ dashboard }: { dashboard: Dashboard }) {
  const { id, title, question, howTo, takeaway, takeawayNote, alt } = dashboard;
  const url = normalizeTableauUrl(dashboard.url);
  const anchor = id.toLowerCase();

  return (
    <section className="dash" id={anchor} aria-labelledby={`${anchor}-title`}>
      <div className="dash__head">
        <h2 className="dash__title" id={`${anchor}-title`}>
          <span className="dash__id">{id}</span> {title}
        </h2>
        <p className="dash__question">{question}</p>
      </div>

      {howTo && (
        <Reveal as="p" className="dash__howto">
          {fill(howTo)}
        </Reveal>
      )}

      <figure className="dash__figure">
        {url ? (
          <>
            <a className="skip-dash" href={`#${anchor}-after`}>
              Skip dashboard {id}
            </a>
            <div className="panel">
              <DashboardEmbed url={url} id={id} title={title} />
            </div>
            <div className="dash__after" id={`${anchor}-after`} tabIndex={-1}>
              <p className="dash__open">
                <a href={url} target="_blank" rel="noopener noreferrer">
                  Open in Tableau Public<span className="sr-only"> (opens in a new tab)</span>
                </a>
              </p>
              <p className="dash__desktop-note">Best viewed on desktop.</p>
            </div>
          </>
        ) : (
          <div className="panel panel--empty">
            <p className="panel__badge">Dashboard coming soon</p>
            <p className="panel__title">
              <span className="panel__id">{id}</span> {title}
            </p>
            <p className="panel__question">{question}</p>
          </div>
        )}

        {/* The alt text describes the embed, so it only applies once there is one. */}
        {(url || takeaway) && (
          <figcaption>
            {url && <p className="sr-only">Dashboard contents: {alt ?? question}</p>}
            {takeaway && (
              <Reveal as="p" className="dash__takeaway">
                {fill(takeaway)}
                {takeawayNote && <span className="dash__scope">{fill(takeawayNote)}</span>}
              </Reveal>
            )}
          </figcaption>
        )}
      </figure>
    </section>
  );
}
