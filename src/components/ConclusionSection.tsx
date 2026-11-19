import config from '@/site.config';
import HeadlineReveal from '@/components/HeadlineReveal';
import Reveal from '@/components/Reveal';
import { answerIsDraft, getPart } from '@/lib/dashboards';
import { fill } from '@/lib/fill';
import { fillRich } from '@/lib/rich';

/**
 * The Conclusion, text only, between Part 5 and Data, methods & limitations: the answer,
 * one key finding per part (each linking to its part), "What this means" once the team has
 * written it, and a closing link to the limits.
 */
export default function ConclusionSection() {
  const { conclusion, dataMethods } = config;

  return (
    <section className="part conclusion" id="conclusion" aria-labelledby="conclusion-title" tabIndex={-1}>
      <header className="part__head">
        <HeadlineReveal as="h2" id="conclusion-title" className="part__title" text={conclusion.title} onScroll />
      </header>

      <Reveal as="p" className="conclusion__answer">
        {fill(conclusion.answer)}
        {answerIsDraft() && <span className="draft-tag">Draft until D13 is published</span>}
      </Reveal>

      <div className="conclusion__block" aria-labelledby="key-findings-title">
        <h3 className="findings__title" id="key-findings-title">
          Key findings
        </h3>
        <ul className="conclusion__findings">
          {conclusion.keyFindings.map((finding) => {
            const part = getPart(finding.part);
            return (
              <Reveal as="li" key={finding.part} className="conclusion__finding">
                <a className="conclusion__part" href={`#${part.slug}`}>
                  <span className="nav-number">{part.number}</span> {part.title}
                </a>
                <p>{fillRich(finding.text)}</p>
              </Reveal>
            );
          })}
        </ul>
      </div>

      {conclusion.implications && conclusion.implications.length > 0 && (
        <div className="conclusion__block" aria-labelledby="implications-title">
          <h3 className="findings__title" id="implications-title">
            What this means
          </h3>
          {conclusion.implications.map((paragraph) => (
            <Reveal as="p" key={paragraph} className="findings__item">
              {fill(paragraph)}
            </Reveal>
          ))}
        </div>
      )}

      <p className="conclusion__closing">
        {conclusion.closingLead} <a href="#data-methods">{dataMethods.title}</a>.
      </p>
    </section>
  );
}
