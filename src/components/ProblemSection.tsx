import config from '@/site.config';
import CountUp from '@/components/CountUp';
import Reveal from '@/components/Reveal';
import { fill } from '@/lib/fill';

/** #problem, straight under the hero: what the project asks, then four numbers about the data. */
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
