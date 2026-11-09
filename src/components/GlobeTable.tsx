import { formatRate } from '@/lib/format';
import type { GlobeData, RateEntry } from '@/lib/globe-scale';

function RateCells({ entry }: { entry: RateEntry | null }) {
  if (!entry) {
    return (
      <>
        <td className="is-none">No data</td>
        <td className="is-none" aria-hidden="true" />
      </>
    );
  }
  return (
    <>
      <td>{formatRate(entry.rate)}</td>
      <td>{entry.year}</td>
    </>
  );
}

/** Every value on the globe as real HTML, so it is available without the canvas or JavaScript. */
export default function GlobeTable({ data }: { data: GlobeData }) {
  const rows = Object.entries(data.countries).sort(([, a], [, b]) => a.name.localeCompare(b.name, 'en'));
  return (
    <details className="globe-table">
      <summary>View as table</summary>
      <p className="globe-table__note">
        Latest available year per country. Colours are not comparable between diseases, and neither are these rates:
        dengue is reported cases, malaria is WHO estimates.
      </p>
      {/* A keyboard-scrollable region. Lenis leaves wheel scrolling inside it alone. */}
      <div className="table-scroll" tabIndex={0} role="region" aria-label="Globe values by country" data-lenis-prevent>
        <table>
          <thead>
            <tr>
              <th scope="col">Country</th>
              <th scope="col">Reported dengue cases per 100k</th>
              <th scope="col">Dengue year</th>
              <th scope="col">Estimated malaria cases per 100k (WHO)</th>
              <th scope="col">Malaria year</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([iso3, country]) => (
              <tr key={iso3}>
                <th scope="row">{country.name}</th>
                <RateCells entry={country.dengue} />
                <RateCells entry={country.malaria} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="globe-table__note">
        These {data.tableOnly.length} places have no shape on the map at this scale, so they appear only here:{' '}
        {data.tableOnly.join(', ')}.
      </p>
    </details>
  );
}
