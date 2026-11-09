'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useIsomorphicLayoutEffect } from '@/lib/hooks';

/** A thin bar under the navbar showing how far down the page you are. It follows the scroll, so it stays on under reduced motion. */
export default function ProgressBar() {
  const barRef = useRef<HTMLSpanElement>(null);

  useIsomorphicLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const update = (self: ScrollTrigger) => {
      bar.style.transform = `scaleX(${self.progress})`;
    };
    const context = gsap.context(() => {
      ScrollTrigger.create({ start: 0, end: 'max', onUpdate: update, onRefresh: update });
    });
    return () => context.revert();
  }, []);

  return (
    <div className="progress" aria-hidden="true">
      <span ref={barRef} />
    </div>
  );
}
