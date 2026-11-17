import config from '@/site.config';
import Reveal from '@/components/Reveal';
import { fill } from '@/lib/fill';
import { formatR } from '@/lib/format';
import type { GlobeData } from '@/lib/globe-scale';
import stats from '@/data/stats.json';
import globeJson from '../../public/data/globe.json';

const globe = globeJson as unknown as GlobeData;

const SECTIONS = [
  { id: 'datasets', label: 'Datasets' },
  { id: 'cleaning', label: 'Cleaning' },
  { id: 'downloads', label: 'Downloads' },
  { id: 'numbers', label: 'Headline numbers' },
  { id: 'limitations', label: 'Limitations' },
  { id: 'sources', label: 'Sources' },
  { id: 'team', label: 'Team' },
];

function dashboardsOf(owner: string) {
  return config.dashboards
    .filter((dashboard) => dashboard.owner === owner)
    .map((dashboard) => `${dashboard.id} ${dashboard.title}`)
    .join(', ');
}

/** The last section of the page: where every number comes from. */
export default function DataMethodsSection() {
  const { dataMethods, team, dashboards } = config;
  const owners = [...team, ...(dashboards.some((dashboard) => dashboard.owner === 'TBD') ? ['TBD'] : [])];

  return (
    <section className="part methods" id="data-methods" aria-labelledby="data-methods-title" tabIndex={-1}>
      <header className="part__head">
        <h2 className="part__title" id="data-methods-title">
          Data &amp; Methods
        </h2>
        <Reveal as="p" className="part__intro">
          {dataMethods.intro}
        </Reveal>
        <nav className="methods__toc" aria-label="Data and methods contents">
          <ul>
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <section className="methods__section" id="datasets" aria-labelledby="datasets-title">
        <h3 className="section-title" id="datasets-title">
          Datasets
        </h3>
        <div className="table-wrap" tabIndex={0} role="region" aria-labelledby="datasets-title">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Source</th>
                <th scope="col">What it gives us</th>
                <th scope="col">Files</th>
              </tr>
            </thead>
            <tbody>
              {dataMethods.datasets.map((dataset) => (
                <tr key={dataset.name}>
                  <th scope="row">{dataset.name}</th>
                  <td>{dataset.use}</td>
                  <td className="data-table__files">{dataset.files}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="methods__section" id="cleaning" aria-labelledby="cleaning-title">
        <h3 className="section-title" id="cleaning-title">
          Cleaning
        </h3>
        <p className="methods__lead">
          One notebook downloads and cleans every dataset. It is under <a href="#downloads">Downloads</a>.
        </p>
        <ul className="methods__list">
          {dataMethods.cleaning.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </section>

      <section className="methods__section" id="downloads" aria-labelledby="downloads-title">
        <h3 className="section-title" id="downloads-title">
          Downloads
        </h3>
        <ul className="methods__list">
          <li>
            <a href="/downloads/mosquito_data_pipeline.ipynb" download>
              The cleaning notebook (.ipynb)
            </a>
            : downloads and cleans every dataset.
          </li>
          <li>
            <a href="/data/globe.json" download>
              The globe&apos;s values (globe.json)
            </a>
            : the latest rate and its year for each of {Object.keys(globe.countries).length} countries and
            territories, for both diseases, as drawn on the globe at the top of the page.
          </li>
        </ul>
        <p className="methods__lead methods__lead--after">
          These {globe.tableOnly.length} places are in globe.json but have no shape on the map at its scale, so the
          globe cannot show them: {globe.tableOnly.join('; ')}.
        </p>
      </section>

      <section className="methods__section" id="numbers" aria-labelledby="numbers-title">
        <h3 className="section-title" id="numbers-title">
          How each headline number was computed
        </h3>
        <div className="methods__notes">
          {dataMethods.methods.map((note) => (
            <div key={note.title} className="methods__note">
              <h4>{fill(note.title)}</h4>
              {note.body.map((paragraph) => (
                <p key={paragraph}>{fill(paragraph)}</p>
              ))}
            </div>
          ))}
        </div>
        <p className="methods__callout">{fill(dataMethods.closestYearNote)}</p>
        <h4 className="methods__table-title" id="r-by-year-title">
          r for each year, 2000-2024
        </h4>
        <div className="table-wrap" tabIndex={0} role="region" aria-labelledby="r-by-year-title">
          <table className="data-table data-table--numbers">
            <thead>
              <tr>
                <th scope="col">Year</th>
                <th scope="col">Same countries compared</th>
                <th scope="col">Malaria r</th>
                <th scope="col">Dengue r</th>
              </tr>
            </thead>
            <tbody>
              {stats.rByYear.map((row) => (
                <tr key={row.year}>
                  <th scope="row">{row.year}</th>
                  <td>{row.n}</td>
                  <td>{formatR(row.malaria)}</td>
                  <td>{formatR(row.dengue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="methods__section" id="limitations" aria-labelledby="limitations-title">
        <h3 className="section-title" id="limitations-title">
          Limitations
        </h3>
        <ul className="methods__list">
          {dataMethods.limitations.map((limitation) => (
            <li key={limitation}>{fill(limitation)}</li>
          ))}
        </ul>
      </section>

      <section className="methods__section" id="sources" aria-labelledby="sources-title">
        <h3 className="section-title" id="sources-title">
          Sources
        </h3>
        <ul className="methods__sources">
          {dataMethods.sources.map((source) => (
            <li key={source.href}>
              <a href={source.href} target="_blank" rel="noopener noreferrer">
                {source.label}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="methods__section" id="team" aria-labelledby="team-title">
        <h3 className="section-title" id="team-title">
          Team
        </h3>
        <div className="table-wrap" tabIndex={0} role="region" aria-labelledby="team-title">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Owner</th>
                <th scope="col">Dashboards</th>
              </tr>
            </thead>
            <tbody>
              {owners.map((owner) => (
                <tr key={owner}>
                  <th scope="row">{owner}</th>
                  <td>{dashboardsOf(owner)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
