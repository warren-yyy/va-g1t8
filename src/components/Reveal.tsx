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

    // Opacity, not autoAlpha: visibility:hidden would take any link inside out of the tab order,
    // so a keyboard user would skip every card that has not scrolled into view yet.
    let tween: gsap.core.Tween | undefined;
    const context = gsap.context(() => {
      tween = gsap.fromTo(
        element,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: { trigger: element, start: viewportLine(element, 0.85), once: true },
        },
      );
    });

    // If focus lands inside before the reveal has played, finish it at once, so the focus
    // ring is never on something invisible.
    const showNow = () => {
      tween?.scrollTrigger?.kill(false, true);
      tween?.progress(1);
    };
    element.addEventListener('focusin', showNow);

    return () => {
      element.removeEventListener('focusin', showNow);
      context.revert();
    };
  }, []);

  return (
    <Tag ref={ref} className={className ? `reveal ${className}` : 'reveal'}>
      {children}
    </Tag>
  );
}
