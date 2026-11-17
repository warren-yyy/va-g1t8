'use client';

import { useEffect } from 'react';

// Tab panels (#d1 to #d13) are scrolled to by DashboardTabs once the right tab is selected.
const TAB_PANEL = /^d\d+$/i;

/**
 * Lands a link like /#singapore on its section, then turns on smooth scrolling.
 *
 * With scroll-behavior: smooth set from the start, Chrome animates the jump to the hash on
 * load too, and layout settling during hydration stops it partway (measured: it landed at a
 * different point each time). So the page loads with instant scrolling, jumps to the target,
 * jumps again once fonts have swapped in unless the visitor has scrolled since, and only
 * then adds html.smooth-scroll, which nav clicks use.
 */
export default function InitialScroll() {
  useEffect(() => {
    const root = document.documentElement;
    let cancelled = false;
    let userScrolled = false;
    const markScrolled = () => {
      userScrolled = true;
    };
    const inputs = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;
    inputs.forEach((type) => window.addEventListener(type, markScrolled, { passive: true, once: true }));

    const jump = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id || TAB_PANEL.test(id)) return;
      document.getElementById(id)?.scrollIntoView({ behavior: 'instant', block: 'start' });
    };

    jump();
    void (document.fonts?.ready ?? Promise.resolve()).then(() => {
      if (cancelled) return;
      if (!userScrolled) jump();
      root.classList.add('smooth-scroll');
    });

    return () => {
      cancelled = true;
      inputs.forEach((type) => window.removeEventListener(type, markScrolled));
      root.classList.remove('smooth-scroll');
    };
  }, []);

  return null;
}
