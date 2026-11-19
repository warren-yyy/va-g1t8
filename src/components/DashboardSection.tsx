import type { Dashboard } from '@/site.config';
import { fill } from '@/lib/fill';
import { fillRich } from '@/lib/rich';
import { normalizeTableauUrl } from '@/lib/tableau';
import DashboardEmbed from '@/components/DashboardEmbed';
import Reveal from '@/components/Reveal';

/**
 * The contents of one dashboard's tab panel: title and question, description, howTo, the
 * skip link, the light panel with the embed (or "coming soon"), then the takeaway. The
 * panel element itself, with the #d1-style id, belongs to DashboardTabs.
 *
 * A view with `whyItMatters` is labelled: "What this dashboard shows" (description) and
 * "How to use the dashboard" (howTo), then under the embed "Key insight" (the takeaway) and
 * "Why this matters". A view without it is shown as before.
 *
 * The question line under the title is left out when `hideQuestion` is set, because
 * the dashboard then shows the question as its own title.
 *
 * There is no "Open in Tableau Public" link under the embed: Tableau's own toolbar has one.
 * The embed's error and no-JavaScript messages carry a link, for when the toolbar is missing.
 */

const isListBlock = (block: string) => block.split('\n').every((line) => line.startsWith('- '));

/**
 * A view's description. Blank lines split it into blocks, and a block whose every line starts
 * with "- " is a bulleted list. A description with no list renders as one paragraph, as before.
 */
function Description({ text }: { text: string }) {
  const blocks = text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
  if (!blocks.some(isListBlock)) return <p className="dash__description">{fillRich(text)}</p>;
  return (
    <div className="dash__blocks">
      {blocks.map((block, index) =>
        isListBlock(block) ? (
          <ul key={index} className="dash__list">
            {block.split('\n').map((line, item) => (
              <li key={item}>{fillRich(line.slice(2))}</li>
            ))}
          </ul>
        ) : (
          <p key={index} className="dash__description">
            {fillRich(block)}
          </p>
        ),
      )}
    </div>
  );
}

export default function DashboardSection({ dashboard }: { dashboard: Dashboard }) {
  const { id, title, question, hideQuestion, description, howTo, takeaway, takeawayNote, whyItMatters, alt } =
    dashboard;
  const url = normalizeTableauUrl(dashboard.url);
  const anchor = id.toLowerCase();
  const labelled = Boolean(whyItMatters);

  return (
    <div className="dash">
      <div className="dash__head">
        <h3 className="dash__title" id={`${anchor}-title`}>
          <span className="dash__id">{id}</span> {title}
        </h3>
        {!hideQuestion && <p className="dash__question">{question}</p>}
      </div>

      {labelled ? (
        <>
          {description && (
            <div className="dash__block">
              <h4 className="dash__label">What this dashboard shows</h4>
              <Description text={description} />
            </div>
          )}
          {howTo && (
            <div className="dash__block">
              <h4 className="dash__label">How to use the dashboard</h4>
              <p className="dash__description">{fillRich(howTo)}</p>
            </div>
          )}
        </>
      ) : (
        <>
          {description && <Description text={description} />}
          {howTo && <p className="dash__howto">{fillRich(howTo)}</p>}
        </>
      )}

      <figure className="dash__figure" aria-labelledby={`${anchor}-title`}>
        {url ? (
          <>
            <a className="skip-dash" href={`#${anchor}-after`}>
              Skip dashboard {id}
            </a>
            <div className="panel">
              <DashboardEmbed url={url} id={id} title={title} height={dashboard.height} width={dashboard.width} />
            </div>
            <div className="dash__after" id={`${anchor}-after`} tabIndex={-1}>
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
                    <h4 className="dash__label">Key insight</h4>
                    <p className="dash__takeaway dash__takeaway--full">
                      {fillRich(takeaway)}
                      {takeawayNote && <span className="dash__scope">{fill(takeawayNote)}</span>}
                    </p>
                  </Reveal>
                )}
                <Reveal className="dash__block">
                  <h4 className="dash__label">Why this matters</h4>
                  <p className="dash__description">{fillRich(whyItMatters ?? '')}</p>
                </Reveal>
              </>
            ) : (
              takeaway && (
                <Reveal as="p" className="dash__takeaway">
                  {fillRich(takeaway)}
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
