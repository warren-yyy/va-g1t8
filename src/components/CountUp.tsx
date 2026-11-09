'use client';

import { useRef } from 'react';
import { gsap, viewportLine } from '@/lib/gsap';
import { motionAllowed, useIsomorphicLayoutEffect } from '@/lib/hooks';

// The real value is in the server-rendered HTML twice: for screen readers, and in the visual
// span, which the effect sets to 0 only at init. Each frame writes straight to the DOM, not
// to React state. Under reduced motion the number is simply left as it is.
export default function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!element || !motionAllowed()) return;

    const target = Number(value);
    const context = gsap.context(() => {
      const proxy = { current: 0 };
      element.textContent = '0';
      gsap.to(proxy, {
        current: target,
        duration: 1.6,
        ease: 'power2.out',
        scrollTrigger: { trigger: element, start: viewportLine(element, 0.8), once: true },
        onUpdate: () => {
          element.textContent = String(Math.round(proxy.current));
        },
      });
    });

    return () => {
      context.revert();
      element.textContent = value;
    };
  }, [value]);

  return (
    <>
      <span className="sr-only">{value}</span>
      <span ref={ref} className="count-up" aria-hidden="true">
        {value}
      </span>
    </>
  );
}
