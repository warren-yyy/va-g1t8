'use client';

import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import { flushSync } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavItem } from '@/site.config';

const COLLAPSE_QUERY = '(min-width: 1101px)';

// Sections with no nav item of their own count towards the item before them.
const SECTION_ALIASES: Record<string, string> = { problem: 'home' };

// A band one pixel tall, 35% of the way down the viewport. The section crossing it is current.
const SPY_MARGIN = '-35% 0px -65% 0px';

function normalizePath(path: string): string {
  return path.replace(/\.html$/, '').replace(/\/+$/, '') || '/';
}

/** The section id an item points at on the home page, or null for a separate page. */
function sectionOf(href: string): string | null {
  const [path, hash] = href.split('#');
  return normalizePath(path || '/') === '/' && hash ? hash : null;
}

export default function Nav({ brand, items }: { brand: string; items: NavItem[] }) {
  const pathname = normalizePath(usePathname());
  const onHome = pathname === '/';
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState<string | null>(null);

  const closeAndRestoreFocus = () => {
    setOpen(false);
    toggleRef.current?.focus();
  };

  // Scrollspy: aria-current follows the section under the band, not the URL.
  useEffect(() => {
    if (!onHome) return;
    const ids = [
      ...items.map((item) => sectionOf(item.href)).filter((id): id is string => id !== null),
      ...Object.keys(SECTION_ALIASES),
    ];
    const sections = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    const spy = new IntersectionObserver(
      (entries) => {
        const crossing = entries.filter((entry) => entry.isIntersecting).at(-1);
        if (crossing) setCurrentSection(SECTION_ALIASES[crossing.target.id] ?? crossing.target.id);
      },
      { rootMargin: SPY_MARGIN },
    );
    sections.forEach((section) => spy.observe(section));
    return () => spy.disconnect();
  }, [items, onHome]);

  // A layout effect, so flushSync in onMenuLinkClick has unlocked the page before it scrolls.
  useLayoutEffect(() => {
    if (!open) return;

    const root = document.documentElement;
    const behindMenu = [document.getElementById('main'), document.querySelector('.site-footer')];
    root.classList.add('menu-open');
    behindMenu.forEach((element) => element?.setAttribute('inert', ''));

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    window.addEventListener('keydown', onKeyDown);

    // The overlay does not exist above the breakpoint, so widening the window closes it.
    const wide = window.matchMedia(COLLAPSE_QUERY);
    const onWide = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };
    wide.addEventListener('change', onWide);

    return () => {
      root.classList.remove('menu-open');
      behindMenu.forEach((element) => element?.removeAttribute('inert'));
      window.removeEventListener('keydown', onKeyDown);
      wide.removeEventListener('change', onWide);
    };
  }, [open]);

  // In the overlay, close first so the page can scroll, then move focus to the section,
  // because the toggle that would normally get focus back is no longer where the user is.
  const onMenuLinkClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    const id = sectionOf(href);
    const target = id && onHome ? document.getElementById(id) : null;
    if (!target) {
      setOpen(false);
      return;
    }
    event.preventDefault();
    flushSync(() => setOpen(false));
    window.history.pushState(null, '', `#${id}`);
    target.scrollIntoView();
    target.focus({ preventScroll: true });
  };

  const isCurrent = (href: string) => {
    const id = sectionOf(href);
    return id ? onHome && id === currentSection : normalizePath(href) === pathname;
  };

  const list = (inMenu: boolean) => (
    <ul>
      {items.map(({ label, href }) => {
        // "1 Burden": the number goes in the mono face, where a 1 cannot be misread as an l.
        const numbered = label.match(/^(\d+) (.+)$/);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={isCurrent(href) ? 'true' : undefined}
              onClick={inMenu ? (event) => onMenuLinkClick(event, href) : undefined}
            >
              {numbered ? (
                <>
                  <span className="nav-number">{numbered[1]}</span> {numbered[2]}
                </>
              ) : (
                label
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <Link className="brand" href="/#home">
            {brand}
          </Link>
          <nav className="site-nav" aria-label="Main">
            {list(false)}
          </nav>
          <button
            ref={toggleRef}
            className="menu-toggle"
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="menu-overlay"
            onClick={() => (open ? closeAndRestoreFocus() : setOpen(true))}
          >
            <span aria-hidden="true" />
          </button>
        </div>
      </header>
      {/* A sibling of the header: a fixed child of a blurred header would be trapped in its box. */}
      <div className={open ? 'menu-overlay is-open' : 'menu-overlay'} id="menu-overlay" inert={!open}>
        <nav aria-label="Main menu">{list(true)}</nav>
      </div>
    </>
  );
}
