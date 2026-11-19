import type { CSSProperties } from 'react';
import config from '@/site.config';
import diseaseData from '@/data/diseases.json';
import CountUp from '@/components/CountUp';
import Reveal from '@/components/Reveal';
import { fill } from '@/lib/fill';

// Each card's accent, the disease's fill token, the same in both themes. The other fields come
// from disease_info.csv via src/data/diseases.json.
const ACCENTS: Record<string, string> = { Dengue: 'var(--dengue)', Malaria: 'var(--malaria)' };

/**
 * #problem, straight under the hero: what the project asks, a card for each disease,
 * and four numbers about the data. How to use the site is the floating button (HowToButton).
 */
export default function ProblemSection() {
  const { problem, statTiles } = config;
  return (
    <section className="part problem" id="problem" aria-labelledby="problem-title" tabIndex={-1}>
      <h2 className="section-title problem__title" id="problem-title">
        {problem.title}
      </h2>
      <Reveal as="p" className="problem__intro">
        {fill(problem.intro)}
      </Reveal>

      <ul className="diseases" aria-label="The two diseases">
        {diseaseData.diseases.map((disease) => (
          <Reveal as="li" key={disease.disease} className="disease">
            <div className="disease__card" style={{ '--accent': ACCENTS[disease.disease] } as CSSProperties}>
              <h3 className="disease__name">{disease.disease}</h3>
              <dl className="disease__facts">
                <div>
                  <dt>Pathogen</dt>
                  <dd>{disease.pathogen}</dd>
                </div>
                <div>
                  <dt>Vector</dt>
                  <dd>{disease.vector}</dd>
                </div>
              </dl>
              <a className="disease__link" href={disease.wikiUrl} target="_blank" rel="noopener noreferrer">
                Read more on Wikipedia
                <span className="sr-only">
                  {' '}
                  about {disease.disease.toLowerCase()} (opens in a new tab)
                </span>
              </a>
            </div>
          </Reveal>
        ))}
      </ul>

      <h3 className="problem__subtitle" id="problem-data-title">
        {problem.dataTitle}
      </h3>
      <ul className="stats__grid" aria-labelledby="problem-data-title">
        {statTiles.map((tile) => (
          <Reveal as="li" key={tile.id} className="tile">
            <p className="tile__year">{fill(tile.year)}</p>
            <p className="tile__value">
              <CountUp value={fill(tile.value)} />
            </p>
            <p className="tile__text">{fill(tile.text)}</p>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
