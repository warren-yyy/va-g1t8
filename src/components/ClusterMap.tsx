import snapshot from '@/data/nea-clusters.json';

/** A dated snapshot, drawn at build time. See scripts/refresh-clusters.ts. */
export default function ClusterMap() {
  const { asOf, map, clusters, source } = snapshot;
  const totalCases = clusters.reduce((sum, cluster) => sum + cluster.cases, 0);
  const label = `NEA dengue clusters, as of ${asOf}`;
  const ordered = [...clusters].sort((a, b) => b.cases - a.cases);

  return (
    <section className="clusters" aria-labelledby="clusters-title">
      <h2 className="section-title" id="clusters-title">
        {label}
      </h2>
      <div className="clusters__grid">
        <figure className="clusters__map">
          {/* A static SVG, loaded lazily. next/image needs a server or a custom loader in a static export. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/data/sg-clusters-map.svg"
            width={map.width}
            height={map.height}
            loading="lazy"
            alt={`Map of Singapore with ${clusters.length} dengue clusters marked as of ${asOf}. The table beside it lists each one.`}
          />
        </figure>
        <div className="clusters__text">
          <p>
            {clusters.length} clusters and {totalCases} cases in the file from {source}, downloaded on {asOf}. Circle area
            shows cases. This is a snapshot: it changes only when the file is downloaded again.
          </p>
          <details className="clusters__details">
            <summary>View as table</summary>
            <div className="table-scroll" tabIndex={0} role="region" aria-label={label} data-lenis-prevent>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Locality</th>
                    <th scope="col">Cases, as of {asOf}</th>
                  </tr>
                </thead>
                <tbody>
                  {ordered.map((cluster) => (
                    <tr key={cluster.locality}>
                      <th scope="row">{cluster.locality}</th>
                      <td>{cluster.cases}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
