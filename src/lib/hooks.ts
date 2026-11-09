'use client';

import { useEffect, useLayoutEffect, useSyncExternalStore } from 'react';

// Avoids the SSR warning for useLayoutEffect while keeping layout-timed effects.
export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// Tracks the user's "reduce motion" OS setting, and updates if it changes.
// useSyncExternalStore keeps it SSR-safe: false on the server, no state-in-effect cascade.
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const query = window.matchMedia(REDUCED_MOTION_QUERY);
      query.addEventListener('change', onStoreChange);
      return () => query.removeEventListener('change', onStoreChange);
    },
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

/**
 * True when animations may run: no reduced-motion setting, and the failsafe in the root
 * layout has not already revealed everything because scripts were slow to start.
 */
export function motionAllowed(): boolean {
  return (
    !window.matchMedia(REDUCED_MOTION_QUERY).matches &&
    !document.documentElement.classList.contains('motion-off')
  );
}
