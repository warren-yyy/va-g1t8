/*
 * Light and dark mode. The theme is data-theme on <html>: the head script in
 * src/app/layout.tsx sets it before first paint from localStorage, and ThemeToggle changes
 * it. Dark is the default. The colours themselves are tokens in src/styles/site.css and,
 * for the globe, palettes in src/lib/globe-scale.ts.
 */
// No React here: the root layout, a server component, imports the head script from this file.
// The hook is useTheme in src/lib/hooks.ts.

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';
export const DEFAULT_THEME: Theme = 'dark';

/** <meta name="theme-color"> for each theme: the page background. */
export const THEME_COLOURS: Record<Theme, string> = { dark: '#0b0c0e', light: '#faf9f6' };

/**
 * The head script: reads the saved theme and applies it before the page paints. Storage can
 * throw (private windows, blocked cookies), so the read is wrapped and falls back to dark.
 * Next renders the theme-color and color-scheme metas before this script, so it can update them.
 */
export const THEME_HEAD_SCRIPT =
  `(function(){var t;try{t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})}catch(e){}` +
  `if(t!=='light'&&t!=='dark')t=${JSON.stringify(DEFAULT_THEME)};` +
  `var c=${JSON.stringify(THEME_COLOURS)};document.documentElement.setAttribute('data-theme',t);` +
  `var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',c[t]);` +
  `m=document.querySelector('meta[name="color-scheme"]');if(m)m.setAttribute('content',t)})();`;

export function readTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

/** Applies a theme now and saves it. Saving can fail; the theme still applies for this visit. */
export function setTheme(theme: Theme): void {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOURS[theme]);
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', theme);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private window or blocked storage: the choice lasts until the page is closed.
  }
}

/** Calls onChange whenever data-theme changes. Returns the unsubscribe function. */
export function subscribeTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}
