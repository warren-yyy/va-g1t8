'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useReducedMotion } from '@/lib/hooks';
import { setLenis } from '@/lib/lenis';

// GSAP's own defaults, restored when Lenis stops so its setting does not leak to other routes.
const DEFAULT_LAG_THRESHOLD = 500;
const DEFAULT_LAG_ADJUST = 33;

/**
 * Lenis smooth scrolling on the routes listed in `paths`, kept in sync with ScrollTrigger.
 * Everywhere else, including under reduced motion, the page scrolls natively. Part pages stay
 * native because Lenis cannot see wheel events over a Tableau iframe.
 */
export default function SmoothScroll({ paths }: { paths: string[] }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const active = paths.includes(pathname.replace(/\/+$/, '') || '/') && !reducedMotion;

  useEffect(() => {
    if (!active) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
    });
    setLenis(lenis);

    lenis.on('scroll', ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(DEFAULT_LAG_THRESHOLD, DEFAULT_LAG_ADJUST);
      lenis.destroy();
      setLenis(null);
    };
  }, [active]);

  // Let each new page settle, then recalculate its scroll-driven animations.
  useEffect(() => {
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 150);
    return () => window.clearTimeout(id);
  }, [pathname, active]);

  return null;
}
