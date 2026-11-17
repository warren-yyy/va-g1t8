'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { ScrollTrigger } from '@/lib/gsap';

interface MethodsDetailsProps {
  /** The id of the section that holds this block, such as "data-methods". */
  sectionId: string;
  summary: string;
  /** Rendered on the server. */
  children: ReactNode;
}

/** The element a link's hash points at, if it is on this page. */
function targetOf(hash: string): HTMLElement | null {
  const id = decodeURIComponent(hash.replace(/^#/, ''));
  return id ? document.getElementById(id) : null;
}

/**
 * The one collapsible block on the site, in Data, methods & limitations. It opens by
 * itself whenever a link points at the section or anything in it: on load, on hashchange,
 * and on a click, because the navbar's Next.js links change the hash with pushState, which
 * fires no hashchange.
 *
 * Opening it changes the page height, so ScrollTrigger must re-measure. A re-measure cancels
 * any smooth scroll in progress (measured: the footer link, the phone menu and a hashchange
 * all stopped short), so it waits until the page has stopped scrolling.
 */
export default function MethodsDetails({ sectionId, summary, children }: MethodsDetailsProps) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const details = ref.current;
    if (!details) return;

    // Opens the block if the target is the section or anything in it. True if it opened it.
    const openFor = (target: HTMLElement | null): target is HTMLElement => {
      if (!target || details.open || !document.getElementById(sectionId)?.contains(target)) return false;
      details.open = true;
      return true;
    };

    // On load, the browser and InitialScroll may have tried to scroll to a target that was
    // hidden in the closed block, or that the short page could not bring to the top.
    const onLoadTarget = targetOf(window.location.hash);
    if (openFor(onLoadTarget)) onLoadTarget.scrollIntoView({ behavior: 'instant', block: 'start' });

    // Chrome opens the block itself on a fragment navigation into it, and has then already
    // scrolled. Other browsers scroll first, to where the hidden target would be.
    const onHashChange = () => {
      const target = targetOf(window.location.hash);
      if (openFor(target)) target.scrollIntoView({ block: 'start' });
    };

    // Capture phase, so the block is open before the link's own handler scrolls.
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.('a[href*="#"]');
      if (!(link instanceof HTMLAnchorElement)) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== window.location.pathname) return;
      openFor(targetOf(url.hash));
    };

    const STILL_MS = 200;
    let stillTimer: number | undefined;
    const refreshWhenStill = () => {
      window.clearTimeout(stillTimer);
      stillTimer = window.setTimeout(() => {
        window.removeEventListener('scroll', refreshWhenStill);
        ScrollTrigger.refresh();
      }, STILL_MS);
    };
    const onToggle = () => {
      window.addEventListener('scroll', refreshWhenStill, { passive: true });
      refreshWhenStill();
    };

    window.addEventListener('hashchange', onHashChange);
    document.addEventListener('click', onClick, true);
    details.addEventListener('toggle', onToggle);
    return () => {
      window.clearTimeout(stillTimer);
      window.removeEventListener('scroll', refreshWhenStill);
      window.removeEventListener('hashchange', onHashChange);
      document.removeEventListener('click', onClick, true);
      details.removeEventListener('toggle', onToggle);
    };
  }, [sectionId]);

  return (
    <details className="methods__details" ref={ref}>
      <summary>{summary}</summary>
      <div className="methods__details-body">{children}</div>
    </details>
  );
}
