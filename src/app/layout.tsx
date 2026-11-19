import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { IBM_Plex_Mono, Instrument_Sans, Instrument_Serif } from 'next/font/google';
import config from '@/site.config';
import Footer from '@/components/Footer';
import HowToButton from '@/components/HowToButton';
import InitialScroll from '@/components/InitialScroll';
import MotionStart from '@/components/MotionStart';
import Nav from '@/components/Nav';
import ProgressBar from '@/components/ProgressBar';
import { THEME_COLOURS, THEME_HEAD_SCRIPT } from '@/lib/theme';
import '@/styles/site.css';

const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', variable: '--font-serif', display: 'swap' });
const sans = Instrument_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: { default: config.site.mainQuestion, template: `%s | ${config.site.name}` },
  description: config.site.scope,
  icons: { icon: '/favicon.svg' },
};

// The dark defaults. The head script and ThemeToggle rewrite both for light mode.
export const viewport: Viewport = {
  themeColor: THEME_COLOURS.dark,
  colorScheme: 'dark',
};

// Runs before first paint. Only html.js may hide reveal targets, and the timer shows
// everything if motion has not started within 2.5s. Then the saved theme is applied, so a
// light-mode visitor never sees a dark frame (see src/lib/theme.ts).
const HEAD_SCRIPT =
  "document.documentElement.classList.add('js');window.__motionFailsafe=setTimeout(function(){document.documentElement.classList.add('motion-off')},2500);" +
  THEME_HEAD_SCRIPT;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const navItems = [
    ...config.navigation,
    ...config.extraPages.map((page) => ({ label: page.label, href: `/${page.slug}` })),
  ];

  return (
    <html
      lang="en"
      className={`${serif.variable} ${sans.variable} ${mono.variable}`}
      // The head script adds classes and data-theme to <html> before React hydrates.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: HEAD_SCRIPT }} />
      </head>
      <body>
        <MotionStart />
        <InitialScroll />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Nav brand={config.site.name} items={navItems} />
        <ProgressBar />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <Footer />
        <HowToButton title={config.problem.guideTitle} items={config.problem.guide} />
      </body>
    </html>
  );
}
