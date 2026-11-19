'use client';

import { useEffect, useRef, useState } from 'react';

interface HowToButtonProps {
  title: string;
  items: string[];
}

const SEEN_KEY = 'how-to-seen';

/**
 * "How to use this site", as a round button fixed to the bottom-right of every screen. It opens a
 * small card. On a first visit the card opens by itself once, shortly after load, then folds into the
 * button when it is closed; the button stays. It does not take focus unless the visitor opens it.
 * localStorage only remembers that the card was shown, and the card works without it.
 */
export default function HowToButton({ title, items }: HowToButtonProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  function markSeen() {
    try {
      window.localStorage.setItem(SEEN_KEY, '1');
    } catch {
      // Private window or blocked storage: the card just shows again next visit.
    }
  }

  function close(returnFocus: boolean) {
    setOpen(false);
    markSeen();
    if (returnFocus) buttonRef.current?.focus();
  }

  // First visit: open once, after the opening animation has settled.
  useEffect(() => {
    let seen = false;
    try {
      seen = window.localStorage.getItem(SEEN_KEY) === '1';
    } catch {
      seen = false;
    }
    if (seen) return;
    const timer = window.setTimeout(() => setOpen(true), 3500);
    return () => window.clearTimeout(timer);
  }, []);

  // Escape closes it, and so does a click anywhere outside the card.
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') close(true);
    }
    function onPointer(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) close(false);
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  function toggle() {
    if (open) {
      close(false);
    } else {
      setOpen(true);
      window.setTimeout(() => closeRef.current?.focus(), 0);
    }
  }

  return (
    <div className="howto" ref={rootRef}>
      <div className="howto__card" id="howto-card" role="dialog" aria-label={title} hidden={!open}>
        <div className="howto__head">
          <h2 className="howto__title">{title}</h2>
          <button ref={closeRef} type="button" className="howto__close" onClick={() => close(true)} aria-label="Close">
            &times;
          </button>
        </div>
        <ul className="howto__list">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <button
        ref={buttonRef}
        type="button"
        className="howto__button"
        aria-expanded={open}
        aria-controls="howto-card"
        onClick={toggle}
      >
        <span aria-hidden="true">?</span>
        <span className="sr-only">{title}</span>
      </button>
    </div>
  );
}
