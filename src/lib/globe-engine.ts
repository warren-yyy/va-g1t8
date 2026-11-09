/*
 * The globe's canvas drawing and interaction, free of React. All animation state lives
 * in this closure, and destroy() removes every frame, listener and observer.
 *
 * Geometry comes in two levels, because full 50m takes about 53ms a frame to draw:
 * - lite, simplified from 50m at build time, is drawn while the globe rotates or is dragged
 * - full 50m is fetched the first time the globe comes to rest, then cached as a bitmap, so
 *   moving the pointer between countries does not redraw the map
 */
import { geoDistance, geoGraticule10, geoOrthographic, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import type { GeometryCollection, Topology } from 'topojson-specification';
import { formatRate } from '@/lib/format';
import {
  NO_DATA_FILL,
  NO_DATA_HATCH,
  OCEAN,
  RAMPS,
  STALE_MIX,
  STALE_TINT,
  ZERO_COLOUR,
  logPosition,
  mixColours,
  type Disease,
  type GlobeData,
} from '@/lib/globe-scale';

interface ShapeProperties {
  name: string;
  c: [number, number];
  r: number;
}

export type WorldTopology = Topology<{ countries: GeometryCollection<ShapeProperties> }>;

type ShapeFeature = Feature<Polygon | MultiPolygon, ShapeProperties>;

interface Shape {
  index: number;
  iso3: string | null;
  name: string;
  centre: [number, number];
  radius: number;
  lite: ShapeFeature;
  full: ShapeFeature | null;
}

interface Batch {
  fill: string | CanvasPattern;
  stale: boolean;
  shapes: Shape[];
}

export interface GlobeEngine {
  setDisease(disease: Disease): void;
  setPaused(paused: boolean): void;
  destroy(): void;
}

export interface GlobeEngineOptions {
  canvas: HTMLCanvasElement;
  tooltip: HTMLElement;
  /** Keyboard focus inside these elements pauses the rotation. */
  focusRoots: HTMLElement[];
  data: GlobeData;
  liteTopology: WorldTopology;
  /** Fetches full 50m. Called once, the first time the globe comes to rest. */
  loadFullTopology: () => Promise<WorldTopology>;
  disease: Disease;
  paused: boolean;
}

// Centred on Southeast Asia, so Singapore is in view from the first frame.
const START_ROTATION: [number, number, number] = [-105, -5, 0];
const DEGREES_PER_SECOND = 4;
const MIN_FRAME_MS = 1000 / 30;
// Rotation may spend at most a third of the CPU on drawing: a slow device gets fewer frames
// of the slow rotation, rather than a page that cannot keep up with scrolling.
const FRAME_BUDGET_MULTIPLE = 3;
const MAX_DPR = 2;
const COLOUR_STEPS = 32;
const SINGAPORE_HIT_RADIUS = 12;
const FINE_POINTER = '(hover: hover) and (pointer: fine)';
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

// The hidden colour-index canvas gives each shape a colour spaced widely enough that
// edge blending can be told apart from a real shape colour.
const INDEX_STEP = 36;
const INDEX_BASE = 7;
const INDEX_TOLERANCE = 6;

function indexColour(index: number): string {
  const code = index + 1;
  const r = (code % INDEX_BASE) * INDEX_STEP;
  const g = (Math.floor(code / INDEX_BASE) % INDEX_BASE) * INDEX_STEP;
  const b = Math.floor(code / (INDEX_BASE * INDEX_BASE)) * INDEX_STEP;
  return `rgb(${r},${g},${b})`;
}

/** Returns the shape index, or null for a blended edge pixel. */
function decodeIndex(r: number, g: number, b: number): number | null {
  const channel = (value: number) => {
    const step = Math.round(value / INDEX_STEP);
    return Math.abs(value - step * INDEX_STEP) > INDEX_TOLERANCE ? null : step;
  };
  const a = channel(r);
  const c = channel(g);
  const e = channel(b);
  if (a === null || c === null || e === null) return null;
  const code = a + c * INDEX_BASE + e * INDEX_BASE * INDEX_BASE;
  return code === 0 ? null : code - 1;
}

function toFeatures(topology: WorldTopology): ShapeFeature[] {
  const collection = feature(topology, topology.objects.countries) as unknown as FeatureCollection<
    Polygon | MultiPolygon,
    ShapeProperties
  >;
  return collection.features;
}

function context2d(canvas: HTMLCanvasElement, settings?: CanvasRenderingContext2DSettings) {
  const context = canvas.getContext('2d', settings);
  if (!context) throw new Error('Canvas 2D is not available.');
  return context;
}

export function createGlobeEngine(options: GlobeEngineOptions): GlobeEngine {
  const { canvas, tooltip, focusRoots, data, liteTopology, loadFullTopology } = options;
  const context = context2d(canvas);
  const restCanvas = document.createElement('canvas');
  const restContext = context2d(restCanvas);
  const pickCanvas = document.createElement('canvas');
  const pickContext = context2d(pickCanvas, { willReadFrequently: true });

  const reducedMotion = window.matchMedia(REDUCED_MOTION);
  const finePointer = window.matchMedia(FINE_POINTER);
  const listeners = new AbortController();
  const { signal } = listeners;

  const shapes: Shape[] = toFeatures(liteTopology).map((lite, index) => ({
    index,
    iso3: (lite.id as string | null) ?? null,
    name: lite.properties.name,
    centre: lite.properties.c,
    radius: lite.properties.r,
    lite,
    full: null,
  }));

  const singapore = shapes.find((shape) => shape.iso3 === 'SGP');
  if (!singapore) throw new Error('Singapore is missing from the geometry.');

  const projection = geoOrthographic().clipAngle(90).precision(0);
  const path = geoPath(projection);
  const graticule = geoGraticule10();

  const rotation: [number, number, number] = [...START_ROTATION];
  let disease = options.disease;
  let size = 0;
  let dpr = 1;
  let frame = 0;
  let lastFrame = 0;
  let drawCost = 0;
  let userPaused = options.paused;
  let hovering = false;
  let focused = false;
  let dragging = false;
  let onScreen = true;
  let destroyed = false;
  let fullRequested = false;
  let fullLoaded = false;
  let restValid = false;
  let pickDirty = true;
  let hovered: Shape | null = null;
  let dragOrigin: { x: number; y: number; lambda: number; phi: number } | null = null;
  let labelFont = '';

  // ---------------------------------------------------------------- colours

  const hatch = (() => {
    const tile = document.createElement('canvas');
    tile.width = 6;
    tile.height = 6;
    const tileContext = context2d(tile);
    tileContext.fillStyle = NO_DATA_FILL;
    tileContext.fillRect(0, 0, 6, 6);
    tileContext.strokeStyle = NO_DATA_HATCH;
    tileContext.lineWidth = 1;
    tileContext.beginPath();
    tileContext.moveTo(-1, 7);
    tileContext.lineTo(7, -1);
    tileContext.moveTo(-1, 1);
    tileContext.lineTo(1, -1);
    tileContext.moveTo(5, 7);
    tileContext.lineTo(7, 5);
    tileContext.stroke();
    return tile;
  })();

  function buildBatches(forDisease: Disease): Batch[] {
    const meta = data.meta[forDisease];
    const [low, high] = RAMPS[forDisease];
    const pattern = context.createPattern(hatch, 'repeat') ?? NO_DATA_FILL;
    const groups = new Map<string, Batch>();
    const add = (key: string, fill: string | CanvasPattern, stale: boolean, shape: Shape) => {
      const group = groups.get(key);
      if (group) group.shapes.push(shape);
      else groups.set(key, { fill, stale, shapes: [shape] });
    };

    for (const shape of shapes) {
      const entry = shape.iso3 ? data.countries[shape.iso3]?.[forDisease] : null;
      if (!entry) {
        add('none', pattern, false, shape);
        continue;
      }
      const stale = entry.year < data.dataEndYear;
      const colour =
        entry.rate === 0
          ? ZERO_COLOUR
          : mixColours(low, high, Math.round(logPosition(entry.rate, meta) * COLOUR_STEPS) / COLOUR_STEPS);
      const fill = stale ? mixColours(colour, STALE_TINT, STALE_MIX) : colour;
      add(`${fill}|${stale}`, fill, stale, shape);
    }
    return [...groups.values()];
  }

  const batches: Record<Disease, Batch[]> = { dengue: buildBatches('dengue'), malaria: buildBatches('malaria') };

  // ---------------------------------------------------------------- drawing

  const faceCentre = (): [number, number] => [-rotation[0], -rotation[1]];
  const faces = (shape: Shape, centre: [number, number]) =>
    geoDistance(centre, shape.centre) - shape.radius < Math.PI / 2;
  const isAtRest = () => !frame && !dragging;

  function drawGlobe(target: CanvasRenderingContext2D, detail: 'lite' | 'full') {
    const radius = projection.scale();
    const middle = size / 2;
    const geometry = (shape: Shape) => (detail === 'full' && shape.full) || shape.lite;

    path.context(target);
    target.setTransform(dpr, 0, 0, dpr, 0, 0);
    target.clearRect(0, 0, size, size);

    target.beginPath();
    target.arc(middle, middle, radius, 0, Math.PI * 2);
    target.fillStyle = OCEAN;
    target.fill();

    target.beginPath();
    path(graticule);
    target.strokeStyle = 'rgba(241, 239, 233, 0.05)';
    target.lineWidth = 0.5;
    target.stroke();

    const centre = faceCentre();
    target.lineJoin = 'round';
    for (const batch of batches[disease]) {
      target.beginPath();
      for (const shape of batch.shapes) if (faces(shape, centre)) path(geometry(shape));
      target.fillStyle = batch.fill;
      target.fill();
      target.strokeStyle = 'rgba(11, 12, 14, 0.7)';
      target.lineWidth = 0.5;
      target.stroke();
    }

    // Older than the data's last year: paler, with an outline.
    target.strokeStyle = 'rgba(241, 239, 233, 0.85)';
    target.lineWidth = 0.8;
    for (const batch of batches[disease]) {
      if (!batch.stale) continue;
      target.beginPath();
      for (const shape of batch.shapes) if (faces(shape, centre)) path(geometry(shape));
      target.stroke();
    }

    target.beginPath();
    target.arc(middle, middle, radius, 0, Math.PI * 2);
    target.strokeStyle = 'rgba(241, 239, 233, 0.22)';
    target.lineWidth = 1;
    target.stroke();

    drawSingaporeMarker(target, centre, radius);
  }

  // Singapore is about 2px at this scale, so it always gets its own marker and label. On
  // the far side of the globe they show faintly through it.
  function drawSingaporeMarker(target: CanvasRenderingContext2D, centre: [number, number], radius: number) {
    const point = projection(singapore!.centre);
    if (!point) return;
    const [x, y] = point;
    const front = geoDistance(centre, singapore!.centre) < Math.PI / 2;
    target.save();
    target.globalAlpha = front ? 1 : 0.4;

    target.beginPath();
    target.arc(x, y, 7, 0, Math.PI * 2);
    target.strokeStyle = '#ffffff';
    target.lineWidth = 1.25;
    target.stroke();
    if (front) {
      target.beginPath();
      target.arc(x, y, 2.5, 0, Math.PI * 2);
      target.fillStyle = '#ffffff';
      target.fill();
    }

    if (!labelFont) {
      const family = getComputedStyle(document.documentElement).getPropertyValue('--sans') || 'sans-serif';
      labelFont = `500 ${size < 480 ? 12 : 13}px ${family}`;
    }
    target.font = labelFont;
    const flip = x > size / 2 + radius * 0.5;
    target.textAlign = flip ? 'right' : 'left';
    target.textBaseline = 'middle';
    const textX = x + (flip ? -12 : 12);
    target.lineWidth = 3;
    target.lineJoin = 'round';
    target.strokeStyle = 'rgba(11, 12, 14, 0.85)';
    target.strokeText('Singapore', textX, y);
    target.fillStyle = '#ffffff';
    target.fillText('Singapore', textX, y);
    target.restore();
  }

  function drawMoving() {
    const started = performance.now();
    drawGlobe(context, 'lite');
    const cost = performance.now() - started;
    drawCost = drawCost ? drawCost * 0.8 + cost * 0.2 : cost;
  }

  /** At rest: the bitmap of the map at the best detail so far, plus the hovered outline. */
  function drawAtRest() {
    if (!restValid) {
      drawGlobe(restContext, fullLoaded ? 'full' : 'lite');
      restValid = true;
    }
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(restCanvas, 0, 0);

    if (hovered && faces(hovered, faceCentre())) {
      path.context(context);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.beginPath();
      path(hovered.full ?? hovered.lite);
      context.strokeStyle = '#ffffff';
      context.lineWidth = 1.25;
      context.lineJoin = 'round';
      context.stroke();
    }
  }

  function requestFullDetail() {
    if (fullRequested) return;
    fullRequested = true;
    loadFullTopology()
      .then((topology) => {
        if (destroyed) return;
        toFeatures(topology).forEach((full, index) => {
          const shape = shapes[index];
          if (shape) shape.full = full;
        });
        fullLoaded = true;
        restValid = false;
        pickDirty = true;
        if (isAtRest() && onScreen && !document.hidden) drawAtRest();
      })
      .catch((error: unknown) => {
        // Not fatal: the simplified map stays on screen.
        if (!destroyed) console.error('Full-detail map could not load', error);
      });
  }

  function drawPickCanvas() {
    pickContext.clearRect(0, 0, size, size);
    pickContext.lineWidth = 1;
    path.context(pickContext);
    const centre = faceCentre();
    // Largest first, so small islands stay reachable on top of their neighbours.
    for (const shape of [...shapes].sort((a, b) => b.radius - a.radius)) {
      if (!faces(shape, centre)) continue;
      const colour = indexColour(shape.index);
      pickContext.beginPath();
      path(shape.full ?? shape.lite);
      pickContext.fillStyle = colour;
      pickContext.fill();
      pickContext.strokeStyle = colour;
      pickContext.stroke();
    }
    pickDirty = false;
  }

  // ---------------------------------------------------------------- hover

  function shapeAt(x: number, y: number): Shape | null | undefined {
    const marker = projection(singapore!.centre);
    if (
      marker &&
      geoDistance(faceCentre(), singapore!.centre) < Math.PI / 2 &&
      Math.hypot(x - marker[0], y - marker[1]) <= SINGAPORE_HIT_RADIUS
    ) {
      return singapore;
    }
    if (pickDirty) drawPickCanvas();
    const [r, g, b, a] = pickContext.getImageData(Math.round(x), Math.round(y), 1, 1).data;
    if (a! < 64) return null;
    const index = decodeIndex(r!, g!, b!);
    // undefined means a blended edge pixel: keep showing whatever was already hovered.
    return index === null ? undefined : (shapes[index] ?? undefined);
  }

  function tooltipText(shape: Shape): string {
    const country = shape.iso3 ? data.countries[shape.iso3] : undefined;
    const name = country?.name ?? shape.name;
    const entry = country?.[disease];
    return entry ? `${name}: ${formatRate(entry.rate)} per 100k (${entry.year})` : `${name}: no data`;
  }

  function showTooltip(shape: Shape, x: number, y: number) {
    tooltip.textContent = tooltipText(shape);
    tooltip.hidden = false;
    const width = tooltip.offsetWidth;
    const left = x + 14 + width > size ? Math.max(0, x - width - 14) : x + 14;
    const top = Math.max(0, y - 34);
    tooltip.style.transform = `translate(${left}px, ${top}px)`;
  }

  function clearHover() {
    tooltip.hidden = true;
    if (hovered) {
      hovered = null;
      if (isAtRest()) drawAtRest();
    }
  }

  // ---------------------------------------------------------------- running

  const shouldRotate = () =>
    !reducedMotion.matches && !userPaused && !hovering && !focused && !dragging && !document.hidden && onScreen;

  function moved() {
    projection.rotate(rotation);
    restValid = false;
    pickDirty = true;
  }

  function tick(now: number) {
    frame = requestAnimationFrame(tick);
    if (!lastFrame) lastFrame = now;
    const elapsed = now - lastFrame;
    if (elapsed < Math.max(MIN_FRAME_MS, drawCost * FRAME_BUDGET_MULTIPLE)) return;
    lastFrame = now;
    rotation[0] = (rotation[0] + (DEGREES_PER_SECOND * Math.min(elapsed, 500)) / 1000) % 360;
    moved();
    drawMoving();
  }

  /** Starts or stops the rotation. Coming to rest on screen brings in full detail. */
  function update() {
    if (shouldRotate()) {
      if (!frame) {
        lastFrame = 0;
        frame = requestAnimationFrame(tick);
      }
      return;
    }
    if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    if (!dragging && onScreen && !document.hidden) {
      requestFullDetail();
      drawAtRest();
    }
  }

  function resize() {
    const next = canvas.parentElement?.clientWidth ?? 0;
    const nextDpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    if (next === 0 || (next === size && nextDpr === dpr)) return;
    size = next;
    dpr = nextDpr;
    const backing = Math.round(size * dpr);
    canvas.width = backing;
    canvas.height = backing;
    restCanvas.width = backing;
    restCanvas.height = backing;
    pickCanvas.width = size;
    pickCanvas.height = size;
    labelFont = '';
    projection.translate([size / 2, size / 2]).scale(size / 2 - 2);
    moved();
    if (frame) drawMoving();
    else drawAtRest();
  }

  // ---------------------------------------------------------------- events

  const allowPointer = (event: PointerEvent) => finePointer.matches && event.pointerType === 'mouse';

  canvas.addEventListener(
    'pointerenter',
    (event) => {
      if (!allowPointer(event)) return;
      hovering = true;
      update();
    },
    { signal },
  );

  canvas.addEventListener(
    'pointerleave',
    (event) => {
      if (!allowPointer(event)) return;
      hovering = false;
      clearHover();
      update();
    },
    { signal },
  );

  canvas.addEventListener(
    'pointerdown',
    (event) => {
      if (!allowPointer(event) || event.button !== 0) return;
      dragging = true;
      dragOrigin = { x: event.clientX, y: event.clientY, lambda: rotation[0], phi: rotation[1] };
      canvas.setPointerCapture(event.pointerId);
      canvas.classList.add('is-dragging');
      tooltip.hidden = true;
      hovered = null;
      update();
    },
    { signal },
  );

  canvas.addEventListener(
    'pointermove',
    (event) => {
      if (!allowPointer(event)) return;
      if (dragging && dragOrigin) {
        const degreesPerPixel = 90 / projection.scale();
        rotation[0] = dragOrigin.lambda + (event.clientX - dragOrigin.x) * degreesPerPixel;
        rotation[1] = Math.max(-70, Math.min(70, dragOrigin.phi - (event.clientY - dragOrigin.y) * degreesPerPixel));
        moved();
        drawMoving();
        return;
      }
      const bounds = canvas.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      const shape = shapeAt(x, y);
      if (shape === undefined) return;
      if (shape === null) {
        clearHover();
        return;
      }
      if (shape !== hovered) {
        hovered = shape;
        if (isAtRest()) drawAtRest();
      }
      showTooltip(shape, x, y);
    },
    { signal },
  );

  const endDrag = (event: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    dragOrigin = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    canvas.classList.remove('is-dragging');
    update();
  };
  canvas.addEventListener('pointerup', endDrag, { signal });
  canvas.addEventListener('pointercancel', endDrag, { signal });

  // Only keyboard focus pauses: a mouse click on the toggle should not stop the globe.
  for (const root of focusRoots) {
    root.addEventListener(
      'focusin',
      (event) => {
        if ((event.target as HTMLElement).matches(':focus-visible')) {
          focused = true;
          update();
        }
      },
      { signal },
    );
    root.addEventListener(
      'focusout',
      (event) => {
        const next = event.relatedTarget as Node | null;
        if (!next || !focusRoots.some((candidate) => candidate.contains(next))) {
          focused = false;
          update();
        }
      },
      { signal },
    );
  }

  document.addEventListener('visibilitychange', update, { signal });
  reducedMotion.addEventListener(
    'change',
    () => {
      if (reducedMotion.matches) {
        rotation[0] = START_ROTATION[0];
        rotation[1] = START_ROTATION[1];
        moved();
      }
      update();
    },
    { signal },
  );

  const visibility = new IntersectionObserver((entries) => {
    onScreen = entries.some((entry) => entry.isIntersecting);
    update();
  });
  visibility.observe(canvas);

  const resizer = new ResizeObserver(resize);
  const stage = canvas.parentElement;
  if (stage) resizer.observe(stage);

  moved();
  resize();
  update();

  // The marker label uses the page font, which may arrive after the first draw.
  void document.fonts?.ready.then(() => {
    if (destroyed) return;
    labelFont = '';
    restValid = false;
    if (isAtRest()) drawAtRest();
  });

  return {
    setDisease(next) {
      disease = next;
      restValid = false;
      if (frame) drawMoving();
      else if (!dragging) drawAtRest();
      if (hovered && !tooltip.hidden) tooltip.textContent = tooltipText(hovered);
    },
    setPaused(next) {
      userPaused = next;
      update();
    },
    destroy() {
      destroyed = true;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      listeners.abort();
      visibility.disconnect();
      resizer.disconnect();
    },
  };
}
