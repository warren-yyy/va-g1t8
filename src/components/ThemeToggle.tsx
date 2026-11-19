'use client';

import { useTheme } from '@/lib/hooks';
import { setTheme } from '@/lib/theme';

function SunIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.55 1.55M17.15 17.15l1.55 1.55M5.3 18.7l1.55-1.55M17.15 6.85l1.55-1.55" />
    </svg>
  );
}

function MoonIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M20 14.6A8.2 8.2 0 0 1 9.4 4a8.2 8.2 0 1 0 10.6 10.6Z" />
    </svg>
  );
}

/**
 * Switches between dark (the default) and light mode. It shows what it switches to: a sun in
 * dark mode, a moon in light mode. The icon and the menu label are picked in CSS from
 * data-theme, so they are right before hydration; the label and aria-pressed follow useTheme.
 */
export default function ThemeToggle({ inMenu = false }: { inMenu?: boolean }) {
  const theme = useTheme();
  const next = theme === 'light' ? 'dark' : 'light';

  return (
    <button
      type="button"
      className={inMenu ? 'theme-toggle theme-toggle--menu' : 'theme-toggle theme-toggle--bar'}
      aria-label={`Switch to ${next} mode`}
      aria-pressed={theme === 'light'}
      onClick={() => setTheme(next)}
    >
      <SunIcon className="theme-show-dark" />
      <MoonIcon className="theme-show-light" />
      {inMenu && (
        <>
          <span className="theme-show-dark">Light mode</span>
          <span className="theme-show-light">Dark mode</span>
        </>
      )}
    </button>
  );
}
