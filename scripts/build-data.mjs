/*
 * npm run data
 *
 * Computes every headline number from the cleaned CSVs, checks each one against its
 * expected value, and only then writes the generated files:
 *   src/data/stats.json            numbers the page templates use
 *   public/data/globe.json         latest rate and year per country, per disease
 *   public/data/countries-50m.json world-atlas geometry with ISO3 ids
 *
 * The generated files are committed, so a deploy never needs the source CSVs.
 * If anything differs, it stops with a report and writes nothing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { parse } from 'csv-parse/sync';
import { geoCentroid, geoDistance } from 'd3-geo';
import { feature } from 'topojson-client';
import isoCountries from 'i18n-iso-countries';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(import.meta.dirname, '..');
const SOURCE_DATA_DIR =
  process.env.SOURCE_DATA_DIR ??
  String.raw`C:\Users\Lenovo\Documents\Y3S1\VA\VA project\data\cleaned_data_final`;

const YEARS = Array.from({ length: 25 }, (_, i) => 2000 + i);
const MINUS = '\u2212';

// ---------------------------------------------------------------------- helpers

function readCsv(name) {
  const file = path.join(SOURCE_DATA_DIR, name);
  if (!fs.existsSync(file)) {
    console.error(`Cannot find ${file}.\nSet SOURCE_DATA_DIR to the folder that holds the cleaned CSVs.`);
    process.exit(1);
  }
  return parse(fs.readFileSync(file), { columns: true, skip_empty_lines: true, bom: true });
}

const num = (value) => (value === '' || value === undefined || value === null ? null : Number(value));

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length / 2;
  return sorted.length % 2 ? sorted[Math.floor(mid)] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function pearson(xs, ys) {
  const n = xs.length;
  const meanX = xs.reduce((sum, v) => sum + v, 0) / n;
  const meanY = ys.reduce((sum, v) => sum + v, 0) / n;
  let cross = 0;
  let varX = 0;
  let varY = 0;
  for (let i = 0; i < n; i += 1) {
    cross += (xs[i] - meanX) * (ys[i] - meanY);
    varX += (xs[i] - meanX) ** 2;
    varY += (ys[i] - meanY) ** 2;
  }
  return cross / Math.sqrt(varX * varY);
}

const round = (value, dp) => Number(value.toFixed(dp));
const formatR = (value) => `${value < 0 ? MINUS : '+'}${Math.abs(value).toFixed(2)}`;

const checks = [];
function expect(label, actual, expected, dp = null) {
  const shown = dp === null ? actual : round(actual, dp);
  checks.push({ label, actual: shown, expected, ok: shown === expected });
}

// ------------------------------------------------------------------- load tables

const countryYear = readCsv('global_country_year.csv').map((row) => ({
  iso3: row.iso3,
  country: row.country,
  region: row.region,
  income: row.income_group,
  year: Number(row.year),
  complete: Number(row.dengue_complete),
  malariaStatus: row.malaria_status,
  dengue: num(row.dengue_per_100k),
  malaria: num(row.malaria_per_100k),
  gdp: num(row.gdp_pc_ppp),
  rh: num(row.rh_pct),
}));

const inYear = (year) => countryYear.filter((row) => row.year === year);
const y2019 = inYear(2019);

// ---------------------------------------------------------------- tiles 1, 2 and 4

const singapore2019 = y2019.find((row) => row.iso3 === 'SGP');
const highIncomeRates = y2019.filter((row) => row.income === 'High income' && row.dengue !== null).map((row) => row.dengue);
const highIncomeMedian = median(highIncomeRates);
const ratioToMedian = singapore2019.dengue / highIncomeMedian;

expect('Tile 1: Singapore dengue per 100k, 2019', singapore2019.dengue, 280.65, 2);
expect('Tile 1: high-income median dengue per 100k, 2019', highIncomeMedian, 14.21, 2);
expect('Tile 1: high-income countries reporting, 2019', highIncomeRates.length, 33);
expect('Tile 1: Singapore as a multiple of that median, rounded', ratioToMedian, 20, 0);

expect('Tile 2: Singapore malaria per 100k, 2019', singapore2019.malaria, 0);
expect('Tile 2: Singapore malaria status, 2019', singapore2019.malariaStatus, 'Not endemic');

const completeRows = y2019.filter((row) => row.complete === 1);
const usableRows = completeRows.filter((row) => row.dengue !== null);
expect('Tile 4: complete dengue reporting, 2019', completeRows.length, 82);
expect('Tile 4: of those, usable rate', usableRows.length, 76);
expect('Tile 4: of those, no population', completeRows.length - usableRows.length, 6);

// --------------------------------------------------------- correlation with income

// r between log10(gdp_pc_ppp) and ln(1 + rate per 100k).
function incomeCorrelation(rows, key) {
  const usable = rows.filter((row) => row[key] !== null && row.gdp !== null && row.gdp > 0);
  return {
    n: usable.length,
    r: pearson(
      usable.map((row) => Math.log10(row.gdp)),
      usable.map((row) => Math.log(1 + row[key])),
    ),
  };
}

// The same countries for both diseases: those with both rates and GDP in that year.
const sameCountries = (rows) => rows.filter((row) => row.dengue !== null && row.malaria !== null && row.gdp !== null && row.gdp > 0);

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
const forYear = (year) => rByYear.find((row) => row.year === year);

expect('Tile 3: median r, malaria, 2000-2024', medianRMalaria, -0.61, 2);
expect('Tile 3: median r, dengue, 2000-2024', medianRDengue, -0.09, 2);
expect('Tile 3: fewest countries compared in a year', Math.min(...counts), 61);
expect('Tile 3: most countries compared in a year', Math.max(...counts), 79);
expect('Tile 3: years with the stronger link for malaria', yearsMalariaStronger, 25);
expect('Dengue r, 2021', forYear(2021).dengue, -0.44, 2);
expect('Dengue r, 2024', forYear(2024).dengue, 0.15, 2);

const allMalaria2019 = incomeCorrelation(y2019, 'malaria');
const allDengue2019 = incomeCorrelation(y2019, 'dengue');
const closestYear = [...rByYear].sort(
  (a, b) => Math.abs(a.malaria) - Math.abs(a.dengue) - (Math.abs(b.malaria) - Math.abs(b.dengue)),
)[0].year;

expect('Note: all available, malaria r, 2019', allMalaria2019.r, -0.73, 2);
expect('Note: all available, malaria countries, 2019', allMalaria2019.n, 198);
expect('Note: all available, dengue r, 2019', allDengue2019.r, -0.49, 2);
expect('Note: all available, dengue countries, 2019', allDengue2019.n, 68);
expect('Note: same countries, how many, 2019', forYear(2019).n, 68);
expect('Note: same countries, malaria r, 2019', forYear(2019).malaria, -0.51, 2);
expect('Note: same countries, dengue r, 2019', forYear(2019).dengue, -0.49, 2);
expect('Note: the closest of the 25 years', closestYear, 2019);

// ------------------------------------------------------------------------- globe

function latestPerCountry(key) {
  const latest = new Map();
  for (const row of countryYear) {
    if (row[key] === null) continue;
    const current = latest.get(row.iso3);
    if (!current || row.year > current.year) latest.set(row.iso3, { rate: row[key], year: row.year });
  }
  return latest;
}

const latestDengue = latestPerCountry('dengue');
const latestMalaria = latestPerCountry('malaria');
const DATA_END_YEAR = Math.max(...countryYear.map((row) => row.year));

const yearsOf = (latest) => [...latest.values()].map((entry) => entry.year);
const atEnd = (latest) => yearsOf(latest).filter((year) => year === DATA_END_YEAR).length;
const notAtEnd = (latest) => [...latest.entries()].filter(([, entry]) => entry.year !== DATA_END_YEAR);

expect('Globe: countries with a dengue rate', latestDengue.size, 111);
expect('Globe: dengue rates from 2024', atEnd(latestDengue), 80);
expect('Globe: oldest dengue year', Math.min(...yearsOf(latestDengue)), 2012);
expect(
  'Globe: malaria years older than 2024',
  notAtEnd(latestMalaria).map(([iso3, entry]) => `${iso3} ${entry.year}`).join(', '),
  'MUS 2021',
);
expect('Globe: Singapore dengue 2024', latestDengue.get('SGP').rate, 226.19, 2);
expect('Globe: Singapore dengue year', latestDengue.get('SGP').year, 2024);
expect('Globe: Brazil dengue 2024', latestDengue.get('BRA').rate, 4842.99, 2);
expect('Globe: Brazil dengue year', latestDengue.get('BRA').year, 2024);

// ------------------------------------------------------------------- limitations

const firstYear = (rows) => Math.min(...rows.map((row) => row.year));
const africaRates = countryYear.filter((row) => row.region === 'Sub-Saharan Africa' && row.dengue !== null);
expect('Limit: first year with a Sub-Saharan dengue rate', firstYear(africaRates), 2023);
expect('Limit: Sub-Saharan dengue rates, 2023', africaRates.filter((row) => row.year === 2023).length, 3);
expect('Limit: Sub-Saharan dengue rates, 2024', africaRates.filter((row) => row.year === 2024).length, 19);
expect('Limit: low-income dengue rates, 2019', y2019.filter((row) => row.income === 'Low income' && row.dengue !== null).length, 1);
expect('Limit: last year of the country-year table', DATA_END_YEAR, 2024);
expect('Limit: rows with humidity', countryYear.filter((row) => row.rh !== null).length, 25);
expect(
  'Limit: countries with humidity',
  [...new Set(countryYear.filter((row) => row.rh !== null).map((row) => row.iso3))].join(', '),
  'SGP',
);

const lagged = readCsv('sg_monthly_lagged.csv').map((row) => ({
  month: row.month,
  lag: Number(row.lag_months),
  variable: row.weather_var,
  weather: num(row.weather_value_lagged),
  cases: num(row.dengue_cases),
}));
const lagMonths = [...new Set(lagged.map((row) => row.month))].sort();
const lagLinks = [];
for (const variable of new Set(lagged.map((row) => row.variable))) {
  for (let lag = 0; lag <= 6; lag += 1) {
    const rows = lagged.filter((row) => row.variable === variable && row.lag === lag && row.weather !== null && row.cases !== null);
    lagLinks.push({ variable, lag, r: pearson(rows.map((row) => row.weather), rows.map((row) => row.cases)) });
  }
}
const strongestLink = [...lagLinks].sort((a, b) => Math.abs(b.r) - Math.abs(a.r))[0];
const temperatureLink = (lag) => lagLinks.find((link) => link.variable.startsWith('Temperature') && link.lag === lag).r;

expect('Singapore: months in the weather table', lagMonths.length, 156);
expect('Singapore: first month', lagMonths[0], '2012-01-01');
expect('Singapore: last month', lagMonths.at(-1), '2024-12-01');
expect('D10: strongest weather link is temperature', strongestLink.variable.startsWith('Temperature'), true);
expect('D10: temperature r at 1 month lag', temperatureLink(1), 0.19, 2);
expect('D10: temperature r at 2 months lag', temperatureLink(2), 0.19, 2);
expect('D10: every weather link is weak (largest |r| under 0.2)', Math.abs(strongestLink.r) < 0.2, true);

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

function roundRate(rate) {
  return round(rate, 2);
}

const names = new Map();
for (const row of countryYear) if (!names.has(row.iso3)) names.set(row.iso3, row.country);

const globeCountries = {};
for (const iso3 of [...names.keys()].sort()) {
  const dengue = latestDengue.get(iso3);
  const malaria = latestMalaria.get(iso3);
  globeCountries[iso3] = {
    name: names.get(iso3),
    dengue: dengue ? { rate: roundRate(dengue.rate), year: dengue.year } : null,
    malaria: malaria ? { rate: roundRate(malaria.rate), year: malaria.year } : null,
  };
}

function diseaseMeta(latest, label) {
  const entries = [...latest.entries()];
  const positive = entries.filter(([, entry]) => entry.rate > 0).sort((a, b) => a[1].rate - b[1].rate);
  const years = yearsOf(latest);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const [maxIso3, maxEntry] = positive.at(-1);
  return {
    label,
    countries: latest.size,
    minYear,
    maxYear,
    latestCount: atEnd(latest),
    yearLabel: `Latest available year per country: ${minYear}-${maxYear} (${maxYear} for ${atEnd(latest)} of ${latest.size})`,
    minPositive: roundRate(positive[0][1].rate),
    max: roundRate(maxEntry.rate),
    maxIso3,
    maxYearOfMax: maxEntry.year,
    zeroCount: entries.length - positive.length,
  };
}

const globe = {
  generatedBy: 'scripts/build-data.mjs from global_country_year.csv',
  dataEndYear: DATA_END_YEAR,
  meta: {
    dengue: diseaseMeta(latestDengue, 'Reported dengue cases per 100k'),
    malaria: diseaseMeta(latestMalaria, 'Estimated malaria cases per 100k (WHO)'),
  },
  countries: globeCountries,
};

// ------------------------------------------------------------- geometry with ISO3

// world-atlas leaves these without a numeric id. Only codes the data uses go here.
const NAME_TO_ISO3 = { Kosovo: 'XKX' };

const topology = require('world-atlas/countries-50m.json');
const geometries = topology.objects.countries.geometries;
const worldFeatures = feature(topology, topology.objects.countries).features;
const geometryIso3 = new Set();
const unmatchedGeometry = [];

const mapped = geometries.map((geometry, index) => {
  const name = geometry.properties?.name ?? '';
  const iso3 = geometry.id ? isoCountries.numericToAlpha3(geometry.id) : NAME_TO_ISO3[name];
  if (!iso3) {
    unmatchedGeometry.push(`${name} (id ${geometry.id ?? 'none'})`);
  } else {
    geometryIso3.add(iso3);
  }

  // Precomputed so the browser can skip countries on the far side without measuring them.
  const shape = worldFeatures[index];
  const centre = geoCentroid(shape);
  let radius = 0;
  const visit = (coords) => {
    if (typeof coords[0] === 'number') radius = Math.max(radius, geoDistance(centre, coords));
    else coords.forEach(visit);
  };
  visit(shape.geometry.coordinates);

  return {
    type: geometry.type,
    arcs: geometry.arcs,
    id: iso3 ?? null,
    properties: { name, c: [round(centre[0], 3), round(centre[1], 3)], r: round(radius, 4) },
  };
});

const dataWithoutGeometry = Object.keys(globeCountries).filter((iso3) => !geometryIso3.has(iso3));
const geometryWithoutData = [...geometryIso3].filter((iso3) => !globeCountries[iso3]);

console.log('\nGeometry (world-atlas countries-50m):');
console.log(`  ${geometries.length} shapes, ${geometryIso3.size} mapped to ISO3.`);
console.log(`  Shapes with no ISO3 code, drawn as no data (${unmatchedGeometry.length}): ${unmatchedGeometry.join('; ') || 'none'}`);
console.log(`  Shapes with an ISO3 code that the data lacks, drawn as no data (${geometryWithoutData.length}): ${geometryWithoutData.join(', ') || 'none'}`);
console.log(`  Data rows with no shape, table only (${dataWithoutGeometry.length}): ${dataWithoutGeometry.map((iso3) => `${iso3} ${globeCountries[iso3].name}`).join(', ') || 'none'}`);

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

// ------------------------------------------------------------------- stats.json

const stats = {
  generatedBy: 'scripts/build-data.mjs from global_country_year.csv and sg_monthly_lagged.csv',
  method:
    'r is the Pearson correlation between log10(gdp_pc_ppp) and ln(1 + rate per 100k), using countries with both rates and GDP in that year.',
  // Display strings for the {tokens} in src/site.config.js.
  tokens: {
    sgDengue2019: String(round(singapore2019.dengue, 0)),
    sgMalaria2019: String(singapore2019.malaria),
    ratio2019: String(round(ratioToMedian, 0)),
    hiMedian2019: String(round(highIncomeMedian, 0)),
    hiMedianExact2019: highIncomeMedian.toFixed(2),
    sgDengueExact2019: singapore2019.dengue.toFixed(2),
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
  },
  rByYear: rByYear.map((row) => ({
    year: row.year,
    n: row.n,
    malaria: round(row.malaria, 4),
    dengue: round(row.dengue, 4),
  })),
};

// ------------------------------------------------------------------------ write

function writeJson(relativePath, value) {
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
