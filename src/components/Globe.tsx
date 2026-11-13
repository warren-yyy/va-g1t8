'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useReducedMotion } from '@/lib/hooks';
import { createGlobeEngine, type GlobeEngine, type WorldTopology } from '@/lib/globe-engine';
import {
  NO_DATA_FILL,
  NO_DATA_HATCH,
  RAMPS,
  STALE_MIX,
  STALE_TINT,
  ZERO_COLOUR,
  legendTicks,
  mixColours,
  type Disease,
  type DiseaseMeta,
  type GlobeData,
} from '@/lib/globe-scale';

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return (await response.json()) as T;
}

const ZERO_LABELS: Record<Disease, string> = {
  dengue: 'Zero reported',
  malaria: 'Zero, or not endemic per WHO',
};

const noDataSwatch: CSSProperties = {
  background: `repeating-linear-gradient(135deg, ${NO_DATA_HATCH} 0 1px, ${NO_DATA_FILL} 1px 4px)`,
};

interface GlobeProps {
  meta: Record<Disease, DiseaseMeta>;
  /** Text for the canvas's accessible label, one per disease. */
  summaries: Record<Disease, string>;
}

export default function Globe({ meta, summaries }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GlobeEngine | null>(null);
  // Read when the engine starts, which can be after the visitor has already chosen.
  const choiceRef = useRef<{ disease: Disease; paused: boolean }>({ disease: 'dengue', paused: false });

  const [disease, setDisease] = useState<Disease>('dengue');
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const tooltip = tooltipRef.current;
    const panel = panelRef.current;
    if (!canvas || !tooltip || !panel) return;

    const controller = new AbortController();
    let engine: GlobeEngine | null = null;

    Promise.all([
      fetchJson<GlobeData>('/data/globe.json', controller.signal),
      fetchJson<WorldTopology>('/data/countries-50m-lite.json', controller.signal),
    ])
      .then(([data, liteTopology]) => {
        if (controller.signal.aborted) return;
        engine = createGlobeEngine({
          canvas,
          tooltip,
          focusRoots: [canvas, panel],
          data,
          liteTopology,
          loadFullTopology: () => fetchJson<WorldTopology>('/data/countries-50m.json', controller.signal),
          disease: choiceRef.current.disease,
          paused: choiceRef.current.paused,
        });
        engineRef.current = engine;
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error('The globe could not load', error);
        setFailed(true);
      });

    return () => {
      controller.abort();
      engine?.destroy();
      engineRef.current = null;
    };
  }, []);

  const chooseDisease = (next: Disease) => {
    choiceRef.current.disease = next;
    setDisease(next);
    engineRef.current?.setDisease(next);
  };

  const togglePaused = () => {
    const next = !paused;
    choiceRef.current.paused = next;
    setPaused(next);
    engineRef.current?.setPaused(next);
  };

  const current = meta[disease];
  const [low, high] = RAMPS[disease];

  return (
    <>
      <div className="globe-stage">
        <canvas ref={canvasRef} className="globe-canvas" role="img" aria-label={summaries[disease]} />
        <div ref={tooltipRef} className="globe-tooltip" aria-hidden="true" hidden />
        {failed && <p className="globe-error">The globe could not load. The same values are in the table.</p>}
      </div>

      <div ref={panelRef} className="globe-panel">
        <noscript>
          <p className="globe-noscript">The interactive globe needs JavaScript. The same values are in this table.</p>
        </noscript>

        <div className="globe-only">
          <div className="globe-controls">
            <div className="globe-toggle" role="group" aria-label="Disease shown on the globe">
              {(['dengue', 'malaria'] as const).map((option) => (
                <button key={option} type="button" aria-pressed={disease === option} onClick={() => chooseDisease(option)}>
                  <span className={`mark mark--${option}`} aria-hidden="true" />
                  {option === 'dengue' ? 'Dengue' : 'Malaria'}
                </button>
              ))}
            </div>
            {!reducedMotion && (
              <button className="globe-pause" type="button" aria-pressed={paused} onClick={togglePaused}>
                {paused ? 'Resume rotation' : 'Pause rotation'}
              </button>
            )}
          </div>

          <p className="globe-label">{current.label}</p>
          <p className="globe-years">{current.yearLabel}</p>

          <div className="legend-scale" aria-hidden="true">
            <div className="legend-bar" style={{ background: `linear-gradient(to right, ${low}, ${high})` }} />
            <div className="legend-ticks">
              {legendTicks(current).map((tick) => (
                <span
                  key={tick.label}
                  className={tick.left === 0 ? 'is-start' : tick.left === 1 ? 'is-end' : undefined}
                  style={{ left: `${tick.left * 100}%` }}
                >
                  {tick.label}
                </span>
              ))}
            </div>
          </div>

          <ul className="legend-states">
            <li>
              <span className="swatch" style={noDataSwatch} aria-hidden="true" />
              No data
            </li>
            <li>
              <span className="swatch" style={{ background: ZERO_COLOUR }} aria-hidden="true" />
              {ZERO_LABELS[disease]}
            </li>
            <li>
              <span className="swatch" style={{ background: `linear-gradient(to right, ${low}, ${high})` }} aria-hidden="true" />
              A value, per 100k (log scale)
            </li>
            <li>
              <span
                className="swatch swatch--stale"
                style={{ background: mixColours(high, STALE_TINT, STALE_MIX) }}
                aria-hidden="true"
              />
              Paler with outline: latest year before {current.maxYear}
            </li>
          </ul>

          <p className="globe-note">Each disease has its own log scale, so colours are not comparable between diseases.</p>
        </div>
      </div>
    </>
  );
}
