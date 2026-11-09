import Link from 'next/link';
import config from '@/site.config';
import Reveal from '@/components/Reveal';
import { visibleDashboards } from '@/lib/dashboards';

export default function PartCards() {
  return (
    <section className="story" aria-labelledby="story-title">
      <h2 className="section-title" id="story-title">
        The story in five parts
      </h2>
      <ul className="cards">
        {config.parts.map((part) => {
          // Unpublished extras are hidden on the part page, so they are not counted here.
          const count = visibleDashboards(part.number).length;
          return (
            <Reveal as="li" key={part.number}>
              <Link className="card" href={`/${part.slug}`}>
                <span className="card__number">{part.number}</span>
                <span className="card__body">
                  <span className="card__title">{part.title}</span>
                  <span className="card__question">{part.question}</span>
                </span>
                <span className="card__count">
                  {count} {count === 1 ? 'dashboard' : 'dashboards'}
                </span>
              </Link>
            </Reveal>
          );
        })}
      </ul>
    </section>
  );
}
