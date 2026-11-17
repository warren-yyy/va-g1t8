'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { VIZ_SIZE, loadTableauApi } from '@/lib/tableau';

type Status = 'loading' | 'ready' | 'error';

const LOAD_ROOT_MARGIN = '800px 0px';
const LOAD_TIMEOUT_MS = 30000;

const frameVars = { '--viz-w': VIZ_SIZE.width, '--viz-h': VIZ_SIZE.height } as CSSProperties;

export default function DashboardEmbed({ url, id, title }: { url: string; id: string; title: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    const host = hostRef.current;
    const frame = frameRef.current;
    const stage = stageRef.current;
    if (!host || !frame || !stage) return;

    // In Strict Mode this effect runs, cleans up and runs again on mount. The observer
    // callback is asynchronous, so the first run is disconnected before it can fire, and
    // `cancelled` covers a load that was already in flight. Only one viz is ever created.
    let cancelled = false;
    let viz: HTMLElement | null = null;
    let interactive = false;
    let timeout: number | undefined;
    // Bumped whenever a load is abandoned, so a stale one cannot finish.
    let attempt = 0;

    // Tableau never reaches FirstInteractive if its tab panel is hidden while it is still
    // loading, even once the panel is shown again (measured). So an unfinished viz is
    // discarded when its panel hides, and a fresh one starts when it is visible again. A
    // viz that has finished loading is kept, with its filters, whatever happens.
    const abandonUnfinished = () => {
      if (interactive || cancelled) return;
      attempt += 1;
      window.clearTimeout(timeout);
      viz?.remove();
      viz = null;
      setStatus('loading');
      loader.observe(host);
    };

    // A hidden tab panel measures 0 wide. Keep the last scale rather than collapse the frame;
    // the ResizeObserver fires again with the real width when the panel is shown.
    const fit = () => {
      if (host.clientWidth === 0) {
        abandonUnfinished();
        return;
      }
      const scale = Math.min(1, host.clientWidth / VIZ_SIZE.width);
      stage.style.transform = scale < 1 ? `scale(${scale})` : 'none';
      frame.style.height = `${VIZ_SIZE.height * scale}px`;
    };

    const mount = async () => {
      const thisAttempt = attempt;
      setStatus('loading');
      let api;
      try {
        api = await loadTableauApi();
      } catch (error) {
        console.error('Tableau embedding API failed to load', error);
        if (!cancelled) setStatus('error');
        return;
      }
      if (cancelled || thisAttempt !== attempt) return;

      const { TableauEventType } = api;
      const element = document.createElement('tableau-viz');
      element.setAttribute('src', url);
      element.setAttribute('toolbar', 'bottom');
      element.setAttribute('hide-tabs', '');
      element.setAttribute('device', 'desktop');
      element.setAttribute('width', String(VIZ_SIZE.width));
      element.setAttribute('height', String(VIZ_SIZE.height));

      timeout = window.setTimeout(() => {
        if (thisAttempt === attempt) setStatus('error');
      }, LOAD_TIMEOUT_MS);
      element.addEventListener(TableauEventType.FirstInteractive, () => {
        if (thisAttempt !== attempt) return;
        interactive = true;
        window.clearTimeout(timeout);
        setStatus('ready');
      });
      element.addEventListener(TableauEventType.VizLoadError, (event) => {
        if (thisAttempt !== attempt) return;
        window.clearTimeout(timeout);
        console.error('Tableau viz failed to load', url, (event as CustomEvent).detail);
        setStatus('error');
      });

      stage.append(element);
      viz = element;
    };

    // A host inside a hidden tab panel has no box, so it never intersects: the viz loads only
    // once its tab is active and it is within LOAD_ROOT_MARGIN of the viewport. The width
    // check is a second guard against ever starting a viz at zero size.
    const loader = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting) || host.clientWidth === 0) return;
        // Stays mounted after this, so filter state survives scrolling away and back.
        loader.disconnect();
        void mount();
      },
      { rootMargin: LOAD_ROOT_MARGIN },
    );
    loader.observe(host);

    const resizer = new ResizeObserver(fit);
    resizer.observe(host);
    fit();

    return () => {
      cancelled = true;
      loader.disconnect();
      resizer.disconnect();
      window.clearTimeout(timeout);
      viz?.remove();
    };
  }, [url]);

  return (
    <div className="embed" ref={hostRef} data-state={status}>
      {/* Height is reserved in CSS before any script runs. This wrapper and its ancestors
          never get a transform: only the stage is scaled. */}
      <div className="embed__frame" ref={frameRef} style={frameVars}>
        {/* React renders no children here, so re-renders never touch the viz. */}
        <div className="embed__stage" ref={stageRef} />
        {status !== 'ready' && (
          <div className="embed__status" role={status === 'error' ? 'alert' : undefined}>
            <p className="panel__title">
              <span className="panel__id">{id}</span> {title}
            </p>
            {status === 'loading' ? (
              <p className="embed__message">
                <span className="spinner" aria-hidden="true" />
                Loading dashboard
              </p>
            ) : (
              <p className="embed__message">This dashboard could not load. Try the Tableau Public link below.</p>
            )}
            <noscript>
              <p className="embed__noscript">
                This dashboard needs JavaScript. You can still open it in Tableau Public with the link below.
              </p>
            </noscript>
          </div>
        )}
      </div>
    </div>
  );
}
