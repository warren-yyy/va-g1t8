import type { Dashboard } from '@/site.config';
import { fill } from '@/lib/fill';
import { normalizeTableauUrl } from '@/lib/tableau';
import DashboardEmbed from '@/components/DashboardEmbed';
import Reveal from '@/components/Reveal';

/**
 * The contents of one dashboard's tab panel: title and question, description, howTo, the
 * skip link, the light panel with the embed (or "coming soon"), then the takeaway. The
 * panel element itself, with the #d1-style id, belongs to DashboardTabs.
 *
 * A view with `whyItMatters` is labelled: "What this shows" (description and howTo in one
 * paragraph), then under the embed "Key insight" (the takeaway) and "Why it matters".
 * A view without it is shown as before.
 */
export default function DashboardSection({ dashboard }: { dashboard: Dashboard }) {
  const { id, title, question, description, howTo, takeaway, takeawayNote, whyItMatters, alt } = dashboard;
  const url = normalizeTableauUrl(dashboard.url);
  const anchor = id.toLowerCase();
  const labelled = Boolean(whyItMatters);

  return (
    <div className="dash">
      <div className="dash__head">
        <h3 className="dash__title" id={`${anchor}-title`}>
          <span className="dash__id">{id}</span> {title}
        </h3>
        <p className="dash__question">{question}</p>
      </div>

      {labelled ? (
        (description || howTo) && (
          <div className="dash__block">
            <p className="dash__label">What this shows</p>
            <p className="dash__description">
              {description && fill(description)}
              {description && howTo && ' '}
              {howTo && fill(howTo)}
            </p>
          </div>
        )
      ) : (
        <>
          {description && <p className="dash__description">{fill(description)}</p>}
          {howTo && <p className="dash__howto">{fill(howTo)}</p>}
        </>
      )}

      <figure className="dash__figure" aria-labelledby={`${anchor}-title`}>
        {url ? (
          <>
            <a className="skip-dash" href={`#${anchor}-after`}>
              Skip dashboard {id}
            </a>
            <div className="panel">
              <DashboardEmbed url={url} id={id} title={title} height={dashboard.height} />
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
        {(url || takeaway || whyItMatters) && (
          <figcaption>
            {url && <p className="sr-only">Dashboard contents: {alt ?? question}</p>}
            {labelled ? (
              <>
                {takeaway && (
                  <Reveal className="dash__block">
                    <p className="dash__label">Key insight</p>
                    <p className="dash__takeaway dash__takeaway--full">
                      {fill(takeaway)}
                      {takeawayNote && <span className="dash__scope">{fill(takeawayNote)}</span>}
                    </p>
                  </Reveal>
                )}
                <Reveal className="dash__block">
                  <p className="dash__label">Why it matters</p>
                  <p className="dash__description">{fill(whyItMatters ?? '')}</p>
                </Reveal>
              </>
            ) : (
              takeaway && (
                <Reveal as="p" className="dash__takeaway">
                  {fill(takeaway)}
                  {takeawayNote && <span className="dash__scope">{fill(takeawayNote)}</span>}
                </Reveal>
              )
            )}
          </figcaption>
        )}
      </figure>
    </div>
  );
}
