/*
 * npm run refresh:clusters
 *
 * Downloads NEA's dengue clusters from data.gov.sg and writes a dated snapshot:
 *   src/data/nea-clusters.json      what the homepage lists
 *   public/data/sg-clusters-map.svg the map
 *
 * It has to run in Node. The poll-download call allows cross-origin requests, but the S3 file
 * it points to has no CORS header, so a browser cannot read it. If anything fails, nothing is
 * written and the old snapshot stays.
 *
 * To seed from the cleaned data pack instead of the network:
 *   npm run refresh:clusters -- --from-file=path/to/nea_clusters_now.geojson
 */
import fs from 'node:fs';
import path from 'node:path';
import { MAP_WIDTH, renderClusterMap, type Cluster, type SubzoneRings } from './lib/cluster-map';

const ROOT = path.resolve(import.meta.dirname, '..');
const SNAPSHOT = path.join(ROOT, 'src/data/nea-clusters.json');
const MAP = path.join(ROOT, 'public/data/sg-clusters-map.svg');
const SUBZONES = path.join(ROOT, 'src/data/sg-subzones.json');

const DATASET = 'd_dbfabf16158d1b0e1c420627c0819168';
const API = `https://api-open.data.gov.sg/v1/public/api/datasets/${DATASET}`;
const HEADERS = { 'User-Agent': 'IS428 student project data script' };
const TIMEOUT_MS = 60000;

interface GeoFeature {
  properties: Record<string, unknown> | null;
  geometry: { type: string; coordinates: unknown } | null;
}

interface GeoCollection {
  features: GeoFeature[];
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return (await response.json()) as T;
}

/** The same steps as the notebook: poll, ask for the file if it is not ready, poll again. */
async function fetchClusters(): Promise<GeoCollection> {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const poll = await getJson<{ data?: { url?: string } }>(`${API}/poll-download`);
    const url = poll.data?.url;
    if (url) return getJson<GeoCollection>(url);
    await getJson<unknown>(`${API}/initiate-download`);
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error('data.gov.sg returned no download link');
}

/** data.gov.sg keeps attributes in an HTML table in `Description`, and the notebook unpacks them the same way. */
function readProperties(feature: GeoFeature): Record<string, unknown> {
  const properties: Record<string, unknown> = { ...feature.properties };
  const description = properties.Description ?? properties.description;
  if (typeof description === 'string' && description.includes('<td')) {
    for (const match of description.matchAll(/<th>\s*(.*?)\s*<\/th>\s*<td>\s*(.*?)\s*<\/td>/gs)) {
      properties[match[1]!.trim()] = match[2]!.replace(/<.*?>/g, '').trim();
    }
  }
  return properties;
}

function vertices(coordinates: unknown): number[][] {
  if (!Array.isArray(coordinates)) return [];
  if (typeof coordinates[0] === 'number') return [coordinates as number[]];
  return coordinates.flatMap(vertices);
}

function toCluster(feature: GeoFeature): Cluster {
  const properties = readProperties(feature);
  const locality = String(properties.LOCALITY ?? '').trim();
  const cases = Number(properties.CASE_SIZE);
  const points = vertices(feature.geometry?.coordinates);
  if (!locality) throw new Error('a cluster has no LOCALITY');
  if (!Number.isFinite(cases)) throw new Error(`${locality} has no CASE_SIZE`);
  if (!points.length) throw new Error(`${locality} has no geometry`);
  return {
    locality,
    cases,
    lon: Number((points.reduce((sum, point) => sum + point[0]!, 0) / points.length).toFixed(5)),
    lat: Number((points.reduce((sum, point) => sum + point[1]!, 0) / points.length).toFixed(5)),
  };
}

const todayInSingapore = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore' }).format(new Date());

function currentSnapshotDate(): string {
  if (!fs.existsSync(SNAPSHOT)) return 'none yet';
  return (JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8')) as { asOf: string }).asOf;
}

async function main() {
  const fromFile = process.argv.find((argument) => argument.startsWith('--from-file='))?.split('=')[1];

  let collection: GeoCollection;
  let asOf: string;
  if (fromFile) {
    collection = JSON.parse(fs.readFileSync(fromFile, 'utf8')) as GeoCollection;
    const stamped = collection.features[0]?.properties?.download_date;
    if (typeof stamped !== 'string') throw new Error(`${fromFile} has no download_date`);
    asOf = stamped;
  } else {
    collection = await fetchClusters();
    asOf = todayInSingapore();
  }

  if (!Array.isArray(collection.features)) throw new Error('the file has no features');
  const clusters = collection.features.map(toCluster);

  const { subzones } = JSON.parse(fs.readFileSync(SUBZONES, 'utf8')) as { subzones: SubzoneRings[] };
  const { svg, height } = renderClusterMap(subzones, clusters);

  // Everything has worked by this point, so it is safe to replace the old snapshot.
  fs.writeFileSync(MAP, svg);
  fs.writeFileSync(
    SNAPSHOT,
    `${JSON.stringify({ asOf, source: 'NEA via data.gov.sg', map: { width: MAP_WIDTH, height }, clusters }, null, 2)}\n`,
  );
  console.log(
    `Snapshot written: ${clusters.length} clusters, ${clusters.reduce((sum, cluster) => sum + cluster.cases, 0)} cases, as of ${asOf}. Map is ${(svg.length / 1024).toFixed(0)} KB.`,
  );
}

main().catch((error: unknown) => {
  console.error(`Could not refresh the clusters: ${(error as Error).message}`);
  console.error(`Nothing was written. The existing snapshot stays (as of ${currentSnapshotDate()}).`);
  process.exit(1);
});
