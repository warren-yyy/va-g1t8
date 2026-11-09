// Tiny shared handle to the active Lenis instance, so the menu can stop and restart
// smooth scrolling without prop-drilling. It is null wherever Lenis is not running.
import type Lenis from 'lenis';

let instance: Lenis | null = null;

export const setLenis = (lenis: Lenis | null) => {
  instance = lenis;
};

export const getLenis = () => instance;
