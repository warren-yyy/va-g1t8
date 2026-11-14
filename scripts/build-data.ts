/*
 * npm run data
 *
 * Computes every headline number from the cleaned CSVs, checks each one against its
 * expected value, and only then writes the generated files:
 *   src/data/stats.json            numbers the pages use
 *   public/data/globe.json         latest rate and year per country, per disease
 *   public/data/countries-50m.json world-atlas geometry with ISO3 ids
 *   public/data/countries-50m-lite.json the same shapes, simplified for rotation
 *   src/data/sg-subzones.json      Singapore subzones, simplified for the cluster map
 *
 * The generated files are committed, so a deploy never needs the source CSVs.
 * If anything differs, it stops with a report and writes nothing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { parse } from 'csv-parse/sync';
import { geoArea, geoCentroid, geoDistance, geoOrthographic, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import isoCountries from 'i18n-iso-countries';
import type { Position } from 'geojson';
import type { GeometryCollection, MultiPolygon, Polygon, Topology } from 'topojson-specification';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(import.meta.dirname, '..');
const SOURCE_DATA_DIR =
  process.env.SOURCE_DATA_DIR ??
  String.raw`C:\Users\Lenovo\Documents\Y3S1\VA\VA project\data\cleaned_data_final`;

const YEARS = Array.from({ length: 25 }, (_, i) => 2000 + i);
const MINUS = '\u2212';

// ---------------------------------------------------------------------- helpers

type CsvRow = Record<string, string>;
type Point = [number, number];

// Longitude degrees shrink towards the poles, so measure in roughly equal-area degrees.
function offsetFromSegment(point: Point, start: Point, end: Point): number {
  const shrink = Math.cos((point[1] * Math.PI) / 180);
  const px = (point[0] - start[0]) * shrink;
  const py = point[1] - start[1];
  const ex = (end[0] - start[0]) * shrink;
  const ey = end[1] - start[1];
  const lengthSquared = ex * ex + ey * ey;
  if (lengthSquared === 0) return Math.hypot(px, py);
  const t = Math.max(0, Math.min(1, (px * ex + py * ey) / lengthSquared));
  return Math.hypot(px - t * ex, py - t * ey);
}

/** Douglas-Peucker: keeps a point only if it is further than the tolerance from the line. */
function simplifyLine(points: Point[], tolerance: number): Point[] {
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack: [number, number][] = [[0, points.length - 1]];
  while (stack.length) {
    const [from, to] = stack.pop()!;
    let furthest = -1;
    let distance = tolerance;
    for (let i = from + 1; i < to; i += 1) {
      const offset = offsetFromSegment(points[i]!, points[from]!, points[to]!);
      if (offset > distance) {
        distance = offset;
        furthest = i;
      }
    }
    if (furthest !== -1) {
      keep[furthest] = 1;
      stack.push([from, furthest], [furthest, to]);
    }
  }
  return points.filter((_, index) => keep[index]);
}

function readCsv(name: string): CsvRow[] {
  const file = path.join(SOURCE_DATA_DIR, name);
  if (!fs.existsSync(file)) {
    console.error(`Cannot find ${file}.\nSet SOURCE_DATA_DIR to the folder that holds the cleaned CSVs.`);
    process.exit(1);
  }
  return parse(fs.readFileSync(file), { columns: true, skip_empty_lines: true, bom: true }) as CsvRow[];
}

const num = (value: string | undefined): number | null =>
  value === '' || value === undefined || value === null ? null : Number(value);

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length / 2;
  return sorted.length % 2 ? sorted[Math.floor(mid)]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  const meanX = xs.reduce((sum, v) => sum + v, 0) / n;
  const meanY = ys.reduce((sum, v) => sum + v, 0) / n;
  let cross = 0;
  let varX = 0;
  let varY = 0;
  for (let i = 0; i < n; i += 1) {
    cross += (xs[i]! - meanX) * (ys[i]! - meanY);
    varX += (xs[i]! - meanX) ** 2;
    varY += (ys[i]! - meanY) ** 2;
  }
  return cross / Math.sqrt(varX * varY);
}

const round = (value: number, dp: number) => Number(value.toFixed(dp));
const wholeNumber = (value: number) => Math.round(value).toLocaleString('en-US');
const formatR = (value: number) => `${value < 0 ? MINUS : '+'}${Math.abs(value).toFixed(2)}`;

type CheckValue = number | string | boolean;
interface Check {
  label: string;
  actual: CheckValue;
  expected: CheckValue;
  ok: boolean;
}

const checks: Check[] = [];

function expect(label: string, actual: number, expected: number, dp: number): void;
function expect(label: string, actual: CheckValue, expected: CheckValue): void;
function expect(label: string, actual: CheckValue, expected: CheckValue, dp?: number): void {
  const shown = dp === undefined ? actual : round(actual as number, dp);
  checks.push({ label, actual: shown, expected, ok: shown === expected });
}

// ------------------------------------------------------------------- load tables

interface CountryYear {
  iso3: string;
  country: string;
  region: string;
  income: string;
  year: number;
  complete: number;
  malariaStatus: string;
  dengue: number | null;
  malaria: number | null;
  gdp: number | null;
  rh: number | null;
  population: number | null;
  dengueCases: number | null;
  malariaCases: number | null;
}

type RateKey = 'dengue' | 'malaria';

const countryYearRows = readCsv('global_country_year.csv');
const countryYear: CountryYear[] = countryYearRows.map((row) => ({
  iso3: row.iso3!,
  country: row.country!,
  region: row.region!,
  income: row.income_group!,
  year: Number(row.year),
  complete: Number(row.dengue_complete),
  malariaStatus: row.malaria_status!,
  dengue: num(row.dengue_per_100k),
  malaria: num(row.malaria_per_100k),
  gdp: num(row.gdp_pc_ppp),
  rh: num(row.rh_pct),
  population: num(row.population),
  dengueCases: num(row.dengue_cases),
  malariaCases: num(row.malaria_cases_est),
}));

const inYear = (year: number) => countryYear.filter((row) => row.year === year);
const y2019 = inYear(2019);

// ------------------------------------- Singapore findings and dengue reporting

const singapore2019 = y2019.find((row) => row.iso3 === 'SGP')!;
const highIncomeRates = y2019
  .filter((row) => row.income === 'High income' && row.dengue !== null)
  .map((row) => row.dengue!);
const highIncomeMedian = median(highIncomeRates);
const ratioToMedian = singapore2019.dengue! / highIncomeMedian;

expect('Singapore: dengue per 100k, 2019', singapore2019.dengue!, 280.65, 2);
expect('Singapore: high-income median dengue per 100k, 2019', highIncomeMedian, 14.21, 2);
expect('Singapore: high-income countries reporting, 2019', highIncomeRates.length, 33);
expect('Singapore: as a multiple of that median, rounded', ratioToMedian, 20, 0);

expect('Singapore: malaria per 100k, 2019', singapore2019.malaria!, 0);
expect('Singapore: malaria status, 2019', singapore2019.malariaStatus, 'Not endemic');

const completeRows = y2019.filter((row) => row.complete === 1);
const usableRows = completeRows.filter((row) => row.dengue !== null);
expect('Dengue reporting: complete dengue reporting, 2019', completeRows.length, 82);
expect('Dengue reporting: of those, usable rate', usableRows.length, 76);
expect('Dengue reporting: of those, no population', completeRows.length - usableRows.length, 6);

// --------------------------------------------------------------- the data tiles

const yearsInData = [...new Set(countryYear.map((row) => row.year))].sort((a, b) => a - b);
expect('Data: years of country data', yearsInData.length, 25);
expect('Data: first and last year', `${yearsInData[0]}-${yearsInData.at(-1)}`, '2000-2024');

// Climate and development factors, with how many countries have each in 2019. rh_pct
// (Singapore only) and poverty_pct (survey years only) are left out, as Data & Methods says.
const FACTORS = [
  'temp_c',
  'precip_mm',
  'gdp_pc_ppp',
  'hdi',
  'urban_pct',
  'pop_density',
  'water_basic_pct',
  'sanitation_basic_pct',
  'health_exp_pc',
];
const FACTOR_MIN_COUNTRIES = 180;
const rows2019 = countryYearRows.filter((row) => Number(row.year) === 2019);
const coverage2019 = (column: string) => rows2019.filter((row) => num(row[column]) !== null).length;
const factorCoverage = FACTORS.map((column) => ({ column, countries: coverage2019(column) }));
const factorsCovered = factorCoverage.filter((factor) => factor.countries >= FACTOR_MIN_COUNTRIES);
// 189 or 190, depending on whether the file has Singapore's Changi climate fill, so it is
// printed and passed through rather than pinned.
const factorMinCoverage2019 = Math.min(...factorCoverage.map((factor) => factor.countries));
console.log(`Factor coverage, 2019: ${factorCoverage.map((factor) => `${factor.column} ${factor.countries}`).join(', ')}`);
expect(`Data: factors with ${FACTOR_MIN_COUNTRIES}+ countries, 2019`, factorsCovered.length, FACTORS.length);
expect('Data: humidity countries, 2019 (left out)', coverage2019('rh_pct'), 1);
expect('Data: poverty countries, 2019 (left out)', coverage2019('poverty_pct'), 78);

// ------------------------------------------------------------- Burden findings

const sumOf = (rows: CountryYear[], pick: (row: CountryYear) => number | null) =>
  rows.reduce((sum, row) => sum + (pick(row) ?? 0), 0);
const per100k = (cases: number, population: number) => (cases / population) * 1e5;

// Consistent dengue reporters: complete in at least 20 of the 24 years 2000-2023.
const PANEL_YEARS = YEARS.filter((year) => year <= 2023);
const PANEL_MIN_COMPLETE = 20;
const completeYears = new Map<string, number>();
for (const row of countryYear) {
  if (row.complete === 1 && PANEL_YEARS.includes(row.year)) {
    completeYears.set(row.iso3, (completeYears.get(row.iso3) ?? 0) + 1);
  }
}
const denguePanel = new Set([...completeYears].filter(([, years]) => years >= PANEL_MIN_COMPLETE).map(([iso3]) => iso3));

// Panel rate: their cases over their population, complete rows with both values only.
function denguePanelRate(year: number): number {
  const rows = inYear(year).filter(
    (row) => denguePanel.has(row.iso3) && row.complete === 1 && row.dengueCases !== null && row.population !== null,
  );
  return per100k(sumOf(rows, (row) => row.dengueCases), sumOf(rows, (row) => row.population));
}

// Endemic malaria: summed estimated cases over summed population, every endemic row.
const endemicIn = (year: number) => inYear(year).filter((row) => row.malariaStatus === 'Endemic');
const malariaEndemicRate = (year: number) => {
  const rows = endemicIn(year);
  return per100k(sumOf(rows, (row) => row.malariaCases), sumOf(rows, (row) => row.population));
};
const endemicCountries = new Set(countryYear.filter((row) => row.malariaStatus === 'Endemic').map((row) => row.iso3));
const endemicCountsByYear = new Set(YEARS.map((year) => endemicIn(year).length));

// 2019 regional shares: malaria over endemic rows, dengue over complete rows.
function regionShare(rows: CountryYear[], pick: (row: CountryYear) => number | null, region: string): number {
  return (100 * sumOf(rows.filter((row) => row.region === region), pick)) / sumOf(rows, pick);
}
const malariaSSA2019 = regionShare(endemicIn(2019), (row) => row.malariaCases, 'Sub-Saharan Africa');
const dengueLAC2019 = regionShare(completeRows, (row) => row.dengueCases, 'Latin America & Caribbean');
const dengueEAP2019 = regionShare(completeRows, (row) => row.dengueCases, 'East Asia & Pacific');

const denguePanel2000 = denguePanelRate(2000);
const denguePanel2019 = denguePanelRate(2019);
const denguePanel2024 = denguePanelRate(2024);
const malariaRate2000 = malariaEndemicRate(2000);
const malariaRate2019 = malariaEndemicRate(2019);
const malariaRate2024 = malariaEndemicRate(2024);
const malariaChange2019 = (100 * (malariaRate2019 - malariaRate2000)) / malariaRate2000;

// The brief that specified these expected 100.2, 302.3 and 63.4 for three of them; the
// cleaned CSVs give 100.1, 301.6 and 63.3. They round to the same whole numbers on the page.
expect('Burden: consistent dengue reporters, 2000-2023', denguePanel.size, 70);
expect('Burden: consistent reporters, dengue per 100k, 2000', denguePanel2000, 13.1, 1);
expect('Burden: consistent reporters, dengue per 100k, 2019', denguePanel2019, 100.1, 1);
expect('Burden: consistent reporters, dengue per 100k, 2024', denguePanel2024, 301.6, 1);
expect('Burden: malaria-endemic countries', endemicCountries.size, 110);
expect('Burden: malaria-endemic countries, same in every year', [...endemicCountsByYear].join(','), '110');
expect('Burden: endemic malaria per 100k, 2000', malariaRate2000, 4935, 0);
expect('Burden: endemic malaria per 100k, 2019', malariaRate2019, 3767, 0);
expect('Burden: endemic malaria per 100k, 2024', malariaRate2024, 4201, 0);
expect('Burden: endemic malaria change, 2000-2019, %', malariaChange2019, -24, 0);
expect('Burden: malaria share in Sub-Saharan Africa, 2019, %', malariaSSA2019, 96.3, 1);
expect('Burden: dengue share in Latin America & Caribbean, 2019, %', dengueLAC2019, 63.3, 1);
expect('Burden: dengue share in East Asia & Pacific, 2019, %', dengueEAP2019, 26.5, 1);

// --------------------------------------------------------- correlation with income

// r between log10(gdp_pc_ppp) and ln(1 + rate per 100k).
function incomeCorrelation(rows: CountryYear[], key: RateKey) {
  const usable = rows.filter((row) => row[key] !== null && row.gdp !== null && row.gdp > 0);
  return {
    n: usable.length,
    r: pearson(
      usable.map((row) => Math.log10(row.gdp!)),
      usable.map((row) => Math.log(1 + row[key]!)),
    ),
  };
}

// The same countries for both diseases: those with both rates and GDP in that year.
const sameCountries = (rows: CountryYear[]) =>
  rows.filter((row) => row.dengue !== null && row.malaria !== null && row.gdp !== null && row.gdp > 0);

const rByYear = YEARS.map((year) => {
  const rows = sameCountries(inYear(year));
  const malaria = incomeCorrelation(rows, 'malaria');
  const dengue = incomeCorrelation(rows, 'dengue');
  return { year, n: rows.length, malaria: malaria.r, dengue: dengue.r };
});

const medianRMalaria = median(rByYear.map((row) => row.malaria));
const medianRDengue = median(rByYear.map((row) => row.dengue));
const counts = rByYear.map((row) => row.n);
const yearsMalariaStronger = rByYear.filter((row) => Math.abs(row.malaria) > Math.abs(row.dengue)).length;
const forYear = (year: number) => rByYear.find((row) => row.year === year)!;

expect('Income link: median r, malaria, 2000-2024', medianRMalaria, -0.61, 2);
expect('Income link: median r, dengue, 2000-2024', medianRDengue, -0.09, 2);
expect('Income link: fewest countries compared in a year', Math.min(...counts), 61);
expect('Income link: most countries compared in a year', Math.max(...counts), 79);
expect('Income link: years with the stronger link for malaria', yearsMalariaStronger, 25);
expect('Dengue r, 2021', forYear(2021).dengue, -0.44, 2);
expect('Dengue r, 2024', forYear(2024).dengue, 0.15, 2);

const allMalaria2019 = incomeCorrelation(y2019, 'malaria');
const allDengue2019 = incomeCorrelation(y2019, 'dengue');
const closestYear = [...rByYear].sort(
  (a, b) => Math.abs(a.malaria) - Math.abs(a.dengue) - (Math.abs(b.malaria) - Math.abs(b.dengue)),
)[0]!.year;

expect('Note: all available, malaria r, 2019', allMalaria2019.r, -0.73, 2);
expect('Note: all available, malaria countries, 2019', allMalaria2019.n, 198);
expect('Note: all available, dengue r, 2019', allDengue2019.r, -0.49, 2);
expect('Note: all available, dengue countries, 2019', allDengue2019.n, 68);
expect('Note: same countries, how many, 2019', forYear(2019).n, 68);
expect('Note: same countries, malaria r, 2019', forYear(2019).malaria, -0.51, 2);
expect('Note: same countries, dengue r, 2019', forYear(2019).dengue, -0.49, 2);
expect('Note: the closest of the 25 years', closestYear, 2019);

// ------------------------------------------------------------------------- globe

interface LatestEntry {
  rate: number;
  year: number;
}

function latestPerCountry(key: RateKey): Map<string, LatestEntry> {
  const latest = new Map<string, LatestEntry>();
  for (const row of countryYear) {
    const rate = row[key];
    if (rate === null) continue;
    const current = latest.get(row.iso3);
    if (!current || row.year > current.year) latest.set(row.iso3, { rate, year: row.year });
  }
  return latest;
}

const latestDengue = latestPerCountry('dengue');
const latestMalaria = latestPerCountry('malaria');
const DATA_END_YEAR = Math.max(...countryYear.map((row) => row.year));

const yearsOf = (latest: Map<string, LatestEntry>) => [...latest.values()].map((entry) => entry.year);
const atEnd = (latest: Map<string, LatestEntry>) => yearsOf(latest).filter((year) => year === DATA_END_YEAR).length;
const notAtEnd = (latest: Map<string, LatestEntry>) =>
  [...latest.entries()].filter(([, entry]) => entry.year !== DATA_END_YEAR);

expect('Globe: countries with a dengue rate', latestDengue.size, 111);
expect('Globe: dengue rates from 2024', atEnd(latestDengue), 80);
expect('Globe: oldest dengue year', Math.min(...yearsOf(latestDengue)), 2012);
expect(
  'Globe: malaria years older than 2024',
  notAtEnd(latestMalaria)
    .map(([iso3, entry]) => `${iso3} ${entry.year}`)
    .join(', '),
  'MUS 2021',
);
expect('Globe: Singapore dengue 2024', latestDengue.get('SGP')!.rate, 226.19, 2);
expect('Globe: Singapore dengue year', latestDengue.get('SGP')!.year, 2024);
expect('Globe: Brazil dengue 2024', latestDengue.get('BRA')!.rate, 4842.99, 2);
expect('Globe: Brazil dengue year', latestDengue.get('BRA')!.year, 2024);

// ------------------------------------------------------------------- limitations

const firstYear = (rows: CountryYear[]) => Math.min(...rows.map((row) => row.year));
const africaRates = countryYear.filter((row) => row.region === 'Sub-Saharan Africa' && row.dengue !== null);
expect('Limit: first year with a Sub-Saharan dengue rate', firstYear(africaRates), 2023);
expect('Limit: Sub-Saharan dengue rates, 2023', africaRates.filter((row) => row.year === 2023).length, 3);
expect('Limit: Sub-Saharan dengue rates, 2024', africaRates.filter((row) => row.year === 2024).length, 19);
expect(
  'Limit: low-income dengue rates, 2019',
  y2019.filter((row) => row.income === 'Low income' && row.dengue !== null).length,
  1,
);
expect('Limit: last year of the country-year table', DATA_END_YEAR, 2024);
expect('Limit: rows with humidity', countryYear.filter((row) => row.rh !== null).length, 25);
expect(
  'Limit: countries with humidity',
  [...new Set(countryYear.filter((row) => row.rh !== null).map((row) => row.iso3))].join(', '),
  'SGP',
);

const lagged = readCsv('sg_monthly_lagged.csv').map((row) => ({
  month: row.month!,
  lag: Number(row.lag_months),
  variable: row.weather_var!,
  weather: num(row.weather_value_lagged),
  cases: num(row.dengue_cases),
}));
const lagMonths = [...new Set(lagged.map((row) => row.month))].sort();
const lagLinks: { variable: string; lag: number; r: number }[] = [];
for (const variable of new Set(lagged.map((row) => row.variable))) {
  for (let lag = 0; lag <= 6; lag += 1) {
    const rows = lagged.filter(
      (row) => row.variable === variable && row.lag === lag && row.weather !== null && row.cases !== null,
    );
    lagLinks.push({
      variable,
      lag,
      r: pearson(
        rows.map((row) => row.weather!),
        rows.map((row) => row.cases!),
      ),
    });
  }
}
const strongestLink = [...lagLinks].sort((a, b) => Math.abs(b.r) - Math.abs(a.r))[0]!;
const temperatureLink = (lag: number) =>
  lagLinks.find((link) => link.variable.startsWith('Temperature') && link.lag === lag)!.r;

expect('Singapore: months in the weather table', lagMonths.length, 156);
expect('Singapore: first month', lagMonths[0]!, '2012-01-01');
expect('Singapore: last month', lagMonths.at(-1)!, '2024-12-01');
expect('D10: strongest weather link is temperature', strongestLink.variable.startsWith('Temperature'), true);
expect('D10: temperature r at 1 month lag', temperatureLink(1), 0.19, 2);
expect('D10: temperature r at 2 months lag', temperatureLink(2), 0.19, 2);
expect('D10: every weather link is weak (largest |r| under 0.2)', Math.abs(strongestLink.r) < 0.2, true);

// ----------------------------------------------- Singapore subzones and clusters

interface SubzoneFile {
  features: { geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] | number[][][][] } }[];
}

const SUBZONE_TOLERANCE_DEGREES = 0.0005;
const MAX_SUBZONE_KB = 300;

function readSourceJson<T>(name: string): T {
  return JSON.parse(fs.readFileSync(path.join(SOURCE_DATA_DIR, name), 'utf8')) as T;
}

const subzonesLite = readSourceJson<SubzoneFile>('mp2019_subzones.geojson').features.map(({ geometry }) => {
  const rings = geometry.type === 'Polygon' ? (geometry.coordinates as number[][][]) : (geometry.coordinates as number[][][][]).flat();
  return {
    rings: rings
      .map((ring) =>
        simplifyLine(ring as [number, number][], SUBZONE_TOLERANCE_DEGREES).map(([lon, lat]) => [round(lon, 5), round(lat, 5)]),
      )
      .filter((ring) => ring.length >= 4),
  };
});
const subzonesJson = { generatedBy: 'scripts/build-data.ts from mp2019_subzones.geojson', subzones: subzonesLite };
expect('Clusters: subzone shapes kept', subzonesLite.filter((subzone) => subzone.rings.length > 0).length, 332);
expect(`Clusters: simplified subzones under ${MAX_SUBZONE_KB} KB`, JSON.stringify(subzonesJson).length < MAX_SUBZONE_KB * 1024, true);

const clusterFile = readSourceJson<{ features: { properties: { download_date: string } }[] }>('nea_clusters_now.geojson');
expect('Clusters: date of the cleaned file, as stated on the site', clusterFile.features[0]!.properties.download_date, '2026-10-23');

// ---------------------------------------------------------- report, then decide

const failures = checks.filter((check) => !check.ok);
console.log(`Source: ${SOURCE_DATA_DIR}\n`);
for (const check of checks) {
  console.log(`${check.ok ? 'PASS' : 'FAIL'}  ${check.label}: ${check.actual}${check.ok ? '' : `  (expected ${check.expected})`}`);
}
if (failures.length) {
  console.error(`\nSTOPPED: ${failures.length} of ${checks.length} values differ from what the site says. Nothing was written.`);
  failures.forEach((check) => console.error(`  ${check.label}: got ${check.actual}, expected ${check.expected}`));
  process.exit(1);
}
console.log(`\nAll ${checks.length} values match.`);

// ------------------------------------------------------------------ globe.json

const roundRate = (rate: number) => round(rate, 2);

const names = new Map<string, string>();
for (const row of countryYear) if (!names.has(row.iso3)) names.set(row.iso3, row.country);

const globeCountries: Record<string, { name: string; dengue: LatestEntry | null; malaria: LatestEntry | null }> = {};
for (const iso3 of [...names.keys()].sort()) {
  const dengue = latestDengue.get(iso3);
  const malaria = latestMalaria.get(iso3);
  globeCountries[iso3] = {
    name: names.get(iso3)!,
    dengue: dengue ? { rate: roundRate(dengue.rate), year: dengue.year } : null,
    malaria: malaria ? { rate: roundRate(malaria.rate), year: malaria.year } : null,
  };
}

function diseaseMeta(latest: Map<string, LatestEntry>, label: string) {
  const entries = [...latest.entries()];
  const positive = entries.filter(([, entry]) => entry.rate > 0).sort((a, b) => a[1].rate - b[1].rate);
  const years = yearsOf(latest);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const [maxIso3, maxEntry] = positive.at(-1)!;
  return {
    label,
    countries: latest.size,
    minYear,
    maxYear,
    latestCount: atEnd(latest),
    yearLabel: `Latest available year per country: ${minYear}-${maxYear} (${maxYear} for ${atEnd(latest)} of ${latest.size})`,
    minPositive: roundRate(positive[0]![1].rate),
    max: roundRate(maxEntry.rate),
    maxIso3,
    maxYearOfMax: maxEntry.year,
    zeroCount: entries.length - positive.length,
  };
}

const globe = {
  generatedBy: 'scripts/build-data.ts from global_country_year.csv',
  dataEndYear: DATA_END_YEAR,
  // Places in the data with no shape at this map scale. They appear in the table only.
  tableOnly: [] as string[],
  meta: {
    dengue: diseaseMeta(latestDengue, 'Reported dengue cases per 100k'),
    malaria: diseaseMeta(latestMalaria, 'Estimated malaria cases per 100k (WHO)'),
  },
  countries: globeCountries,
};

// ------------------------------------------------------------- geometry with ISO3

// world-atlas leaves these without a numeric id. Only codes the data uses go here.
const NAME_TO_ISO3: Record<string, string> = { Kosovo: 'XKX' };

type CountryShape = (Polygon | MultiPolygon) & { id?: string | number; properties?: { name?: string } };
type WorldTopology = Topology<{ countries: GeometryCollection<{ name?: string }> }>;

const topology = JSON.parse(
  fs.readFileSync(require.resolve('world-atlas/countries-50m.json'), 'utf8'),
) as WorldTopology;
const geometries = topology.objects.countries.geometries as CountryShape[];
const worldFeatures = feature(topology, topology.objects.countries).features;
const geometryIso3 = new Set<string>();
const unmatchedGeometry: string[] = [];

const mapped = geometries.map((geometry, index) => {
  const name = geometry.properties?.name ?? '';
  const iso3 = geometry.id ? isoCountries.numericToAlpha3(geometry.id) : NAME_TO_ISO3[name];
  if (!iso3) {
    unmatchedGeometry.push(`${name} (id ${geometry.id ?? 'none'})`);
  } else {
    geometryIso3.add(iso3);
  }

  // Precomputed so the browser can skip countries on the far side without measuring them.
  const shape = worldFeatures[index]!;
  const centre = geoCentroid(shape);
  let radius = 0;
  const visit = (coords: Position | Position[] | Position[][] | Position[][][]) => {
    if (typeof coords[0] === 'number') radius = Math.max(radius, geoDistance(centre, coords as [number, number]));
    else (coords as Position[]).forEach(visit);
  };
  if (shape.geometry.type === 'Polygon' || shape.geometry.type === 'MultiPolygon') {
    visit(shape.geometry.coordinates);
  }

  return {
    type: geometry.type,
    arcs: geometry.arcs,
    id: iso3 ?? null,
    properties: { name, c: [round(centre[0], 3), round(centre[1], 3)], r: round(radius, 4) },
  };
});

const dataWithoutGeometry = Object.keys(globeCountries).filter((iso3) => !geometryIso3.has(iso3));
const geometryWithoutData = [...geometryIso3].filter((iso3) => !globeCountries[iso3]);
globe.tableOnly = dataWithoutGeometry.map((iso3) => globeCountries[iso3]!.name).sort();

console.log('\nGeometry (world-atlas countries-50m):');
console.log(`  ${geometries.length} shapes, ${geometryIso3.size} mapped to ISO3.`);
console.log(`  Shapes with no ISO3 code, drawn as no data (${unmatchedGeometry.length}): ${unmatchedGeometry.join('; ') || 'none'}`);
console.log(`  Shapes with an ISO3 code that the data lacks, drawn as no data (${geometryWithoutData.length}): ${geometryWithoutData.join(', ') || 'none'}`);
console.log(
  `  Data rows with no shape, table only (${dataWithoutGeometry.length}): ${dataWithoutGeometry.map((iso3) => `${iso3} ${globeCountries[iso3]!.name}`).join(', ') || 'none'}`,
);

if (!geometryIso3.has('SGP')) {
  console.error('\nSTOPPED: Singapore (SGP) is not in the geometry. Nothing was written.');
  process.exit(1);
}

const geometryOut = {
  type: 'Topology',
  bbox: topology.bbox,
  transform: topology.transform,
  objects: { countries: { type: 'GeometryCollection', geometries: mapped } },
  arcs: topology.arcs,
};

// ---------------------------------------------- simplified geometry for rotation

// Drawing full 50m takes 50-80ms a frame (measured), too slow to redraw constantly. The
// globe rotates on this version, simplified from the same 50m shapes, and shows full 50m at
// rest. Arcs stay shared, so borders still meet.
const LITE_TOLERANCE_DEGREES = 0.3;
const LITE_GRID_DEGREES = 0.01;

function decodeArc(arc: number[][]): Point[] {
  const [scaleX, scaleY] = topology.transform!.scale;
  const [translateX, translateY] = topology.transform!.translate;
  let x = 0;
  let y = 0;
  return arc.map((delta) => {
    x += delta[0]!;
    y += delta[1]!;
    return [x * scaleX + translateX, y * scaleY + translateY];
  });
}

function snapToGrid(points: Point[]): Point[] {
  const snapped: Point[] = [];
  for (const point of points) {
    const next: Point = [
      Math.round(point[0] / LITE_GRID_DEGREES) * LITE_GRID_DEGREES,
      Math.round(point[1] / LITE_GRID_DEGREES) * LITE_GRID_DEGREES,
    ];
    const last = snapped.at(-1);
    if (!last || last[0] !== next[0] || last[1] !== next[1]) snapped.push(next);
  }
  // Keep both ends even when snapping would merge them, or shared arcs stop meeting.
  if (snapped.length === 1) snapped.push(snapped[0]!);
  return snapped;
}

const fullArcs = topology.arcs.map(decodeArc);

function planarArea(points: Point[]): number {
  const meanLat = points.reduce((sum, point) => sum + point[1], 0) / points.length;
  const shrink = Math.cos((meanLat * Math.PI) / 180);
  let doubled = 0;
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length]!;
    doubled += point[0] * shrink * next[1] - next[0] * shrink * point[1];
  });
  return Math.abs(doubled) / 2;
}

// A closed arc is an island. It is simplified in proportion to its own size, so a small island
// keeps its shape rather than collapsing at the tolerance meant for a coastline.
function toleranceFor(arc: Point[]): number {
  const first = arc[0]!;
  const last = arc.at(-1)!;
  if (first[0] !== last[0] || first[1] !== last[1]) return LITE_TOLERANCE_DEGREES;
  return Math.min(LITE_TOLERANCE_DEGREES, 0.2 * Math.sqrt(planarArea(arc)));
}

const liteArcs = fullArcs.map((arc) => snapToGrid(simplifyLine(arc, toleranceFor(arc))));
const restoredArcs = new Set<number>();

function restoreRing(ring: number[]) {
  for (const index of ring) {
    const arc = index >= 0 ? index : ~index;
    restoredArcs.add(arc);
    liteArcs[arc] = snapToGrid(fullArcs[arc]!);
  }
}

const arcPoints = (arcs: Point[][], index: number): Point[] =>
  index >= 0 ? arcs[index]! : [...arcs[~index]!].reverse();

function stitchRing(arcs: Point[][], ring: number[]): Point[] {
  const stitched: Point[] = [];
  ring.forEach((index, position) => {
    const points = arcPoints(arcs, index);
    stitched.push(...(position === 0 ? points : points.slice(1)));
  });
  return stitched;
}

const ringsOf = (geometry: (typeof mapped)[number]): number[][][] =>
  geometry.type === 'Polygon' ? [geometry.arcs as number[][]] : (geometry.arcs as number[][][]);

const allRings: number[][] = mapped.flatMap((geometry) => ringsOf(geometry).flat());

// On a sphere a ring's winding decides which side is inside, so a small ring that flips when
// simplified would flood the whole globe. Those rings go back to their full arcs. The loop
// repeats because restoring an arc can change a neighbour that shares it.
function ringCoversMoreThanHalf(points: Point[]): boolean {
  if (points.length < 4) return false;
  return geoArea({ type: 'Polygon', coordinates: [points] }) > 2 * Math.PI;
}

for (let pass = 0, changed = true; changed; pass += 1) {
  if (pass > 20) throw new Error('Simplified geometry did not settle after 20 passes.');
  changed = false;
  for (const ring of allRings) {
    const fullFlip = ringCoversMoreThanHalf(stitchRing(fullArcs, ring));
    const liteFlip = ringCoversMoreThanHalf(stitchRing(liteArcs, ring));
    if (fullFlip === liteFlip) continue;
    const alreadyFull = ring.every((index) => restoredArcs.has(index >= 0 ? index : ~index));
    if (!alreadyFull) {
      restoreRing(ring);
      changed = true;
    }
  }
}

function encodeArc(points: Point[]): number[][] {
  let previousX = 0;
  let previousY = 0;
  return points.map(([lon, lat]) => {
    const x = Math.round((lon + 180) / LITE_GRID_DEGREES);
    const y = Math.round((lat + 90) / LITE_GRID_DEGREES);
    const delta = [x - previousX, y - previousY];
    previousX = x;
    previousY = y;
    return delta;
  });
}

// A ring simplified down to a sliver has almost no area, and d3's clipping can read one as
// containing the whole sphere at some rotations. Rings under about a pixel on the globe are
// left out of the lite file, and return at rest with full 50m. Each ring is judged on its own:
// world-atlas stores Antarctica as a tiny circle around the pole plus the coastline, so the
// first ring of a polygon is not always its outline.
const MIN_RING_STERADIANS = 1e-5;
const MIN_LAST_RING_STERADIANS = 1e-7;

function ringArea(arcs: Point[][], ring: number[]): number {
  const points = stitchRing(arcs, ring);
  if (new Set(points.map((point) => point.join())).size < 3) return 0;
  const area = geoArea({ type: 'Polygon', coordinates: [points] });
  return Math.min(area, 4 * Math.PI - area);
}

// Every country keeps its largest ring, so small places such as Cabo Verde do not vanish.
const lastRingKept = new Set<number[]>();
for (const geometry of mapped) {
  const rings = ringsOf(geometry).flat();
  if (rings.some((ring) => ringArea(liteArcs, ring) >= MIN_RING_STERADIANS)) continue;
  const largest = [...rings].sort((a, b) => ringArea(fullArcs, b) - ringArea(fullArcs, a))[0];
  if (!largest) continue;
  restoreRing(largest);
  if (ringArea(liteArcs, largest) >= MIN_LAST_RING_STERADIANS) lastRingKept.add(largest);
}

function liteGeometry(geometry: (typeof mapped)[number]) {
  const arcs = ringsOf(geometry)
    .map((rings) => rings.filter((ring) => lastRingKept.has(ring) || ringArea(liteArcs, ring) >= MIN_RING_STERADIANS))
    .filter((rings) => rings.length > 0);
  return { type: 'MultiPolygon' as const, arcs, id: geometry.id, properties: geometry.properties };
}

function liteTopology() {
  return {
    type: 'Topology' as const,
    bbox: topology.bbox,
    transform: {
      scale: [LITE_GRID_DEGREES, LITE_GRID_DEGREES] as [number, number],
      translate: [-180, -90] as [number, number],
    },
    objects: { countries: { type: 'GeometryCollection' as const, geometries: mapped.map(liteGeometry) } },
    arcs: liteArcs.map(encodeArc),
  };
}

const liteFeatures = (candidate: ReturnType<typeof liteTopology>) =>
  feature(candidate as unknown as WorldTopology, (candidate as unknown as WorldTopology).objects.countries).features;

// Two checks on the finished shapes. No single shape may fill the disc at any rotation: Russia,
// the largest, reaches 12% with full 50m, so anything above the limit is a rendering fault.
const MAX_DISC_COVERAGE = 0.25;

function floodedShapes(candidate: ReturnType<typeof liteTopology>): number[] {
  const radius = 300;
  const projection = geoOrthographic().clipAngle(90).precision(0).translate([radius, radius]).scale(radius);
  const pathGenerator = geoPath(projection);
  const shapes = liteFeatures(candidate);
  const flooded = new Set<number>();
  for (const phi of [-5, 0, 20, -30, 60, -60]) {
    for (let lambda = 0.37; lambda < 360; lambda += 5) {
      projection.rotate([lambda, phi, 0]);
      shapes.forEach((shape, index) => {
        if (Math.abs(pathGenerator.area(shape)) / (Math.PI * radius * radius) > MAX_DISC_COVERAGE) flooded.add(index);
      });
    }
  }
  return [...flooded];
}

// And no visible shape may lose much of its area, which is how a dropped coastline would show.
const MIN_CHECKED_STERADIANS = 2e-4;
const MAX_AREA_CHANGE = 0.35;

function shrunkShapes(candidate: ReturnType<typeof liteTopology>): number[] {
  const shapes = liteFeatures(candidate);
  return worldFeatures.flatMap((full, index) => {
    const fullArea = geoArea(full);
    if (fullArea < MIN_CHECKED_STERADIANS) return [];
    return Math.abs(geoArea(shapes[index]!) / fullArea - 1) > MAX_AREA_CHANGE ? [index] : [];
  });
}

for (let pass = 0; ; pass += 1) {
  const candidate = liteTopology();
  const faulty = [...new Set([...floodedShapes(candidate), ...shrunkShapes(candidate)])];
  if (!faulty.length) break;
  if (pass > 5) {
    const names = faulty.map((index) => mapped[index]!.properties.name).join(', ');
    console.error(`\nSTOPPED: these simplified shapes are still wrong: ${names}. Nothing was written.`);
    process.exit(1);
  }
  for (const index of faulty) ringsOf(mapped[index]!).flat().forEach(restoreRing);
}

const liteGeometryOut = liteTopology();
const liteRingCount = liteGeometryOut.objects.countries.geometries.reduce(
  (sum, geometry) => sum + geometry.arcs.reduce((count, rings) => count + rings.length, 0),
  0,
);
const shapesLeft = liteGeometryOut.objects.countries.geometries.filter((geometry) => geometry.arcs.length > 0).length;
const landRatio =
  liteFeatures(liteGeometryOut).reduce((sum, shape) => sum + geoArea(shape), 0) /
  worldFeatures.reduce((sum, shape) => sum + geoArea(shape), 0);
console.log(
  `  Simplified for rotation: ${fullArcs.reduce((sum, arc) => sum + arc.length, 0)} points down to ${liteArcs.reduce((sum, arc) => sum + arc.length, 0)}. ` +
    `${allRings.length - liteRingCount} of ${allRings.length} rings under a pixel left out; ${shapesLeft} of ${mapped.length} shapes remain; ` +
    `${(landRatio * 100).toFixed(1)}% of the land area kept; no shape floods the disc.`,
);

// ------------------------------------------------------------------- stats.json

const stats = {
  generatedBy: 'scripts/build-data.ts from global_country_year.csv and sg_monthly_lagged.csv',
  method:
    'r is the Pearson correlation between log10(gdp_pc_ppp) and ln(1 + rate per 100k), using countries with both rates and GDP in that year.',
  // Display strings for the {tokens} in src/site.config.ts.
  tokens: {
    sgDengue2019: String(round(singapore2019.dengue!, 0)),
    sgMalaria2019: String(singapore2019.malaria),
    ratio2019: String(round(ratioToMedian, 0)),
    hiMedian2019: String(round(highIncomeMedian, 0)),
    hiMedianExact2019: highIncomeMedian.toFixed(2),
    sgDengueExact2019: singapore2019.dengue!.toFixed(2),
    sgDengue2024: String(round(latestDengue.get('SGP')!.rate, 0)),
    hiN2019: String(highIncomeRates.length),
    medianRMalaria: formatR(medianRMalaria),
    medianRDengue: formatR(medianRDengue),
    nMin: String(Math.min(...counts)),
    nMax: String(Math.max(...counts)),
    yearsMalariaStronger: String(yearsMalariaStronger),
    dengueComplete2019: String(completeRows.length),
    dengueUsable2019: String(usableRows.length),
    dengueNoPop2019: String(completeRows.length - usableRows.length),
    dengueR2021: formatR(forYear(2021).dengue),
    dengueR2024: formatR(forYear(2024).dengue),
    allMalariaR2019: formatR(allMalaria2019.r),
    allMalariaN2019: String(allMalaria2019.n),
    allDengueR2019: formatR(allDengue2019.r),
    allDengueN2019: String(allDengue2019.n),
    sameN2019: String(forYear(2019).n),
    sameMalariaR2019: formatR(forYear(2019).malaria),
    sameDengueR2019: formatR(forYear(2019).dengue),
    globeDengueN: String(globe.meta.dengue.countries),
    globeDengueLatest: String(globe.meta.dengue.latestCount),
    globeDengueMinYear: String(globe.meta.dengue.minYear),
    globeDengueMaxYear: String(globe.meta.dengue.maxYear),
    sgLagMonths: String(lagMonths.length),
    sgTempLagR: temperatureLink(1).toFixed(2),
    dengueConsistentN: String(denguePanel.size),
    denguePanel2000: wholeNumber(denguePanel2000),
    denguePanel2019: wholeNumber(denguePanel2019),
    denguePanel2024: wholeNumber(denguePanel2024),
    malariaEndemicN: String(endemicCountries.size),
    malariaRate2000: wholeNumber(malariaRate2000),
    malariaRate2019: wholeNumber(malariaRate2019),
    malariaRate2024: wholeNumber(malariaRate2024),
    malariaChange2019: `${malariaChange2019 < 0 ? MINUS : '+'}${Math.abs(Math.round(malariaChange2019))}%`,
    malariaSSA2019: `${Math.round(malariaSSA2019)}%`,
    dengueLAC2019: `${Math.round(dengueLAC2019)}%`,
    dengueEAP2019: `${Math.round(dengueEAP2019)}%`,
    yearsCovered: String(yearsInData.length),
    firstYear: String(yearsInData[0]),
    lastYear: String(yearsInData.at(-1)),
    factorCount2019: String(factorsCovered.length),
    factorMinCoverage2019: String(factorMinCoverage2019),
    rhCountries2019: String(coverage2019('rh_pct')),
    povertyCountries2019: String(coverage2019('poverty_pct')),
  },
  rByYear: rByYear.map((row) => ({
    year: row.year,
    n: row.n,
    malaria: round(row.malaria, 4),
    dengue: round(row.dengue, 4),
  })),
};

// ------------------------------------------------------------------------ write

function writeJson(relativePath: string, value: unknown) {
  const file = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const text = JSON.stringify(value);
  fs.writeFileSync(file, `${text}\n`);
  console.log(`  wrote ${relativePath} (${(text.length / 1024).toFixed(0)} KB)`);
}

console.log('\nWriting:');
writeJson('src/data/stats.json', stats);
writeJson('public/data/globe.json', globe);
writeJson('public/data/countries-50m.json', geometryOut);
writeJson('public/data/countries-50m-lite.json', liteGeometryOut);
writeJson('src/data/sg-subzones.json', subzonesJson);
