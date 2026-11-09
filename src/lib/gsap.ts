// Central GSAP setup. Import { gsap, ScrollTrigger } from '@/lib/gsap' in any client
// component. Plugins are registered once, only in the browser.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * ScrollTrigger's "top 85%", plus one guarantee: an element too near the end of the page to
 * ever reach that line, as on a very tall monitor, still plays at the bottom of the page.
 * clamp() would do this too, but it also moves elements in the first screenful to a start of
 * exactly 0, and those then wait for the first scroll instead of playing on load.
 */
export function viewportLine(element: Element, fraction: number) {
  return () =>
    Math.min(
      element.getBoundingClientRect().top + window.scrollY - window.innerHeight * fraction,
      ScrollTrigger.maxScroll(window) - 1,
    );
}

export { gsap, ScrollTrigger };
