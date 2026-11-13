import type { StatTile } from '@/site.config';
import config from '@/site.config';
import CountUp from '@/components/CountUp';
import Reveal from '@/components/Reveal';
import { fill } from '@/lib/fill';

function Tile({ tile }: { tile: StatTile }) {
  const value = fill(tile.value ?? '');
  return (
    <Reveal as="li" className="tile">
      <p className="tile__year">{tile.year}</p>
      {tile.pair ? (
        <p className="tile__pair">
          {tile.pair.map((item, index) => (
            <span key={item.disease} className="tile__pair-group">
              {index > 0 && <span className="tile__vs">vs</span>}
              <span className={`tile__pair-item tile__pair-item--${item.disease}`}>
                <span className="tile__pair-value">{fill(item.value)}</span>
                <span className="tile__pair-label">
                  <span className={`mark mark--${item.disease}`} aria-hidden="true" />
                  {item.label}
                </span>
              </span>
            </span>
          ))}
        </p>
      ) : (
        <p className="tile__value">{tile.countUp ? <CountUp value={value} /> : value}</p>
      )}
      <p className="tile__text">{fill(tile.text)}</p>
    </Reveal>
  );
}

export default function StatTiles() {
  return (
    <section className="stats" id="problem" aria-labelledby="stats-title" tabIndex={-1}>
      <h2 className="section-title" id="stats-title">
        Four numbers to start with
      </h2>
      <ul className="stats__grid">
        {config.statTiles.map((tile) => (
          <Tile key={tile.id} tile={tile} />
        ))}
      </ul>
    </section>
  );
}
