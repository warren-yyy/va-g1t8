import config from '@/site.config';
import Globe from '@/components/Globe';
import HeadlineReveal from '@/components/HeadlineReveal';
import { formatRate } from '@/lib/format';
import type { Disease, GlobeData } from '@/lib/globe-scale';
import globeJson from '../../public/data/globe.json';

const globe = globeJson as unknown as GlobeData;

function summary(disease: Disease): string {
  const meta = globe.meta[disease];
  const highest = globe.countries[meta.maxIso3];
  const singapore = globe.countries.SGP?.[disease];
  const singaporeText = singapore ? ` Singapore: ${formatRate(singapore.rate)} (${singapore.year}).` : '';
  const label = meta.label.charAt(0).toLowerCase() + meta.label.slice(1);
  return `Globe of ${label}, covering ${meta.countries} countries and territories. ${meta.yearLabel}. Highest: ${highest?.name}, ${formatRate(meta.max)} (${meta.maxYearOfMax}).${singaporeText} The table lists every value.`;
}

export default function Hero() {
  const { site } = config;

  return (
    <section className="hero" id="home" aria-labelledby="main-question" tabIndex={-1}>
      <div className="hero__text">
        <HeadlineReveal className="hero__title" id="main-question" text={site.mainQuestion} />
        <p className="hero__scope">{site.scope}</p>
      </div>
      <Globe meta={globe.meta} summaries={{ dengue: summary('dengue'), malaria: summary('malaria') }} />
      <div className="scroll-cue" aria-hidden="true">
        <span>Scroll</span>
        <span className="scroll-cue__line">
          <span />
        </span>
      </div>
    </section>
  );
}
