'use client';

import { useRef, type ElementType, type ReactNode } from 'react';
import { gsap, viewportLine } from '@/lib/gsap';
import { motionAllowed, useIsomorphicLayoutEffect } from '@/lib/hooks';

interface RevealProps {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

// Fades and lifts its children into view as they scroll up the page. Only html.js hides
// them, so the text stays visible without JavaScript and under reduced motion. Never wrap
// a dashboard panel in this: nothing around a Tableau stage may be transformed.
export default function Reveal({ as: Tag = 'div', className, children }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!element || !motionAllowed()) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        element,
        { autoAlpha: 0, y: 28 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: { trigger: element, start: viewportLine(element, 0.85), once: true },
        },
      );
    });
    return () => context.revert();
  }, []);

  return (
    <Tag ref={ref} className={className ? `reveal ${className}` : 'reveal'}>
      {children}
    </Tag>
  );
}
