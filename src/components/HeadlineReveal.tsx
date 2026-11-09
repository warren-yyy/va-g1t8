'use client';

import { Fragment, useRef, type ElementType } from 'react';
import { gsap } from '@/lib/gsap';
import { motionAllowed, useIsomorphicLayoutEffect } from '@/lib/hooks';

interface HeadlineRevealProps {
  as?: ElementType;
  id?: string;
  className?: string;
  text: string;
}

// Each word rises from behind a mask. Screen readers get the whole heading as one string, and
// the bottom padding on the mask (see .headline__mask) keeps descenders from being clipped.
export default function HeadlineReveal({ as: Tag = 'h1', id, className, text }: HeadlineRevealProps) {
  const ref = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!element || !motionAllowed()) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        '.headline__word',
        { yPercent: 115, opacity: 1 },
        { yPercent: 0, opacity: 1, duration: 1.15, stagger: 0.06, ease: 'power4.out' },
      );
    }, element);
    return () => context.revert();
  }, []);

  return (
    <Tag ref={ref} id={id} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.split(' ').map((word, index) => (
          <Fragment key={`${word}-${index}`}>
            {index > 0 && ' '}
            <span className="headline__mask">
              <span className="headline__word">{word}</span>
            </span>
          </Fragment>
        ))}
      </span>
    </Tag>
  );
}
