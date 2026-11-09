import type { Metadata } from 'next';
import config from '@/site.config';
import Reveal from '@/components/Reveal';
import { fill } from '@/lib/fill';
import { formatR } from '@/lib/format';
import stats from '@/data/stats.json';

export const metadata: Metadata = {
  title: 'Data & Methods',
  description: 'Datasets, cleaning, how each headline number was computed, and the limitations.',
};

const SECTIONS = [
  { id: 'datasets', label: 'Datasets' },
  { id: 'cleaning', label: 'Cleaning' },
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

export default function DataMethodsPage() {
  const { dataMethods, team, dashboards } = config;
  const owners = [...team, ...(dashboards.some((dashboard) => dashboard.owner === 'TBD') ? ['TBD'] : [])];

  return (
    <div className="part methods">
      <header className="part__head">
        <h1 className="part__title">Data &amp; Methods</h1>
        <Reveal as="p" className="part__intro">
          {dataMethods.intro}
        </Reveal>
        <nav className="methods__toc" aria-label="On this page">
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
        <h2 className="section-title" id="datasets-title">
          Datasets
        </h2>
        <div className="table-wrap" tabIndex={0} role="region" aria-labelledby="datasets-title" data-lenis-prevent>
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
        <h2 className="section-title" id="cleaning-title">
          Cleaning
        </h2>
        <p className="methods__lead">
          One notebook downloads and cleans every dataset.{' '}
          <a href="/downloads/mosquito_data_pipeline.ipynb" download>
            Download the cleaning notebook (.ipynb)
          </a>
          .
        </p>
        <ul className="methods__list">
          {dataMethods.cleaning.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </section>

      <section className="methods__section" id="numbers" aria-labelledby="numbers-title">
        <h2 className="section-title" id="numbers-title">
          How each headline number was computed
        </h2>
        <div className="methods__notes">
          {dataMethods.methods.map((note) => (
            <div key={note.title} className="methods__note">
              <h3>{fill(note.title)}</h3>
              {note.body.map((paragraph) => (
                <p key={paragraph}>{fill(paragraph)}</p>
              ))}
            </div>
          ))}
        </div>
        <p className="methods__callout">{fill(dataMethods.closestYearNote)}</p>
        <details className="methods__details">
          <summary>View r for each year, 2000-2024</summary>
          <div className="table-wrap" tabIndex={0} role="region" aria-label="r for each year" data-lenis-prevent>
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
        </details>
      </section>

      <section className="methods__section" id="limitations" aria-labelledby="limitations-title">
        <h2 className="section-title" id="limitations-title">
          Limitations
        </h2>
        <ul className="methods__list">
          {dataMethods.limitations.map((limitation) => (
            <li key={limitation}>{fill(limitation)}</li>
          ))}
        </ul>
      </section>

      <section className="methods__section" id="sources" aria-labelledby="sources-title">
        <h2 className="section-title" id="sources-title">
          Sources
        </h2>
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
        <h2 className="section-title" id="team-title">
          Team
        </h2>
        <div className="table-wrap" tabIndex={0} role="region" aria-labelledby="team-title" data-lenis-prevent>
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
    </div>
  );
}
