'use client';

import { ScrollTrigger } from '@/lib/gsap';
import { useIsomorphicLayoutEffect } from '@/lib/hooks';

/** Marks motion as started, which cancels the failsafe set by the head script. */
export default function MotionStart() {
  useIsomorphicLayoutEffect(() => {
    // Strict Mode's dev remount resets <html> to what JSX sets, clearing the script's class.
    document.documentElement.classList.add('js');
    window.clearTimeout(window.__motionFailsafe);

    // next/font swaps fonts in after the first paint, which can move trigger positions.
    let cancelled = false;
    void document.fonts?.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
