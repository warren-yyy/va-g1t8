/*
 * Draws the Singapore cluster map as a static SVG. A flat projection is accurate at this scale,
 * and unlike d3-geo's spherical one it does not care which way a polygon's rings wind.
 */
export interface Cluster {
  locality: string;
  cases: number;
  lon: number;
  lat: number;
}

export interface SubzoneRings {
  rings: number[][][];
}

export const MAP_WIDTH = 800;
const PADDING = 6;

// Circle area shows cases.
const radiusFor = (cases: number) => 2.2 * Math.sqrt(cases);

export function renderClusterMap(subzones: SubzoneRings[], clusters: Cluster[]): { svg: string; height: number } {
  const points = subzones.flatMap((subzone) => subzone.rings.flat());
  const longitudes = points.map((point) => point[0]!);
  const latitudes = points.map((point) => point[1]!);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);

  const shrink = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const scale = (MAP_WIDTH - 2 * PADDING) / ((maxLon - minLon) * shrink);
  const height = Math.ceil((maxLat - minLat) * scale + 2 * PADDING);
  const project = (lon: number, lat: number): [number, number] => [
    Number(((lon - minLon) * shrink * scale + PADDING).toFixed(1)),
    Number(((maxLat - lat) * scale + PADDING).toFixed(1)),
  ];

  const land = subzones
    .flatMap((subzone) => subzone.rings)
    .map((ring) => `M${ring.map((point) => project(point[0]!, point[1]!).join(',')).join('L')}Z`)
    .join('');

  const dots = [...clusters]
    .sort((a, b) => b.cases - a.cases)
    .map((cluster) => {
      const [x, y] = project(cluster.lon, cluster.lat);
      return `<circle cx="${x}" cy="${y}" r="${radiusFor(cluster.cases).toFixed(1)}"/>`;
    })
    .join('');

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MAP_WIDTH} ${height}" width="${MAP_WIDTH}" height="${height}">` +
    `<path d="${land}" fill="#262a30" stroke="#0b0c0e" stroke-width="0.6" fill-rule="evenodd"/>` +
    `<g fill="#E15759" fill-opacity="0.82" stroke="#f1efe9" stroke-width="0.8">${dots}</g>` +
    `</svg>\n`;
  return { svg, height };
}
