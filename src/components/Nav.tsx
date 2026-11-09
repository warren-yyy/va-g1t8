'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getLenis } from '@/lib/lenis';
import type { NavItem } from '@/site.config';

const COLLAPSE_QUERY = '(min-width: 1101px)';

function normalizePath(path: string): string {
  return path.replace(/\.html$/, '').replace(/\/+$/, '') || '/';
}

export default function Nav({ brand, items }: { brand: string; items: NavItem[] }) {
  const pathname = normalizePath(usePathname());
  const toggleRef = useRef<HTMLButtonElement>(null);
  const previousPath = useRef(pathname);

  // The menu is open for one path only, so any navigation closes it, including back and forward.
  const [openOnPath, setOpenOnPath] = useState<string | null>(null);
  const open = openOnPath === pathname;

  const closeAndRestoreFocus = () => {
    setOpenOnPath(null);
    toggleRef.current?.focus();
  };

  // After a client-side navigation, keyboard and screen-reader users continue from main.
  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const root = document.documentElement;
    const behindMenu = [document.getElementById('main'), document.querySelector('.site-footer')];
    root.classList.add('menu-open');
    behindMenu.forEach((element) => element?.setAttribute('inert', ''));
    getLenis()?.stop();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpenOnPath(null);
      toggleRef.current?.focus();
    };
    window.addEventListener('keydown', onKeyDown);

    // The overlay does not exist above the breakpoint, so widening the window closes it.
    const wide = window.matchMedia(COLLAPSE_QUERY);
    const onWide = (event: MediaQueryListEvent) => {
      if (event.matches) setOpenOnPath(null);
    };
    wide.addEventListener('change', onWide);

    return () => {
      root.classList.remove('menu-open');
      behindMenu.forEach((element) => element?.removeAttribute('inert'));
      getLenis()?.start();
      window.removeEventListener('keydown', onKeyDown);
      wide.removeEventListener('change', onWide);
    };
  }, [open]);

  const list = (
    <ul>
      {items.map(({ label, href }) => (
        <li key={href}>
          <Link href={href} aria-current={normalizePath(href) === pathname ? 'page' : undefined}>
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <Link className="brand" href="/">
            {brand}
          </Link>
          <nav className="site-nav" aria-label="Main">
            {list}
          </nav>
          <button
            ref={toggleRef}
            className="menu-toggle"
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="menu-overlay"
            onClick={() => (open ? closeAndRestoreFocus() : setOpenOnPath(pathname))}
          >
            <span aria-hidden="true" />
          </button>
        </div>
      </header>
      {/* A sibling of the header: a fixed child of a blurred header would be trapped in its box. */}
      <div className={open ? 'menu-overlay is-open' : 'menu-overlay'} id="menu-overlay" inert={!open}>
        <nav aria-label="Main menu">{list}</nav>
      </div>
    </>
  );
}
