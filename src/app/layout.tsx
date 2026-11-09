import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { IBM_Plex_Mono, Instrument_Sans, Instrument_Serif } from 'next/font/google';
import config from '@/site.config';
import Footer from '@/components/Footer';
import MotionStart from '@/components/MotionStart';
import Nav from '@/components/Nav';
import SmoothScroll from '@/components/SmoothScroll';
import '@/styles/site.css';

const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', variable: '--font-serif', display: 'swap' });
const sans = Instrument_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: { default: config.site.mainQuestion, template: `%s | ${config.site.name}` },
  description: config.site.scope,
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#0b0c0e',
  colorScheme: 'dark',
};

// Runs before first paint. Only html.js may hide reveal targets, and the timer shows
// everything if motion has not started within 2.5s.
const HEAD_SCRIPT =
  "document.documentElement.classList.add('js');window.__motionFailsafe=setTimeout(function(){document.documentElement.classList.add('motion-off')},2500);";

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const navItems = [
    ...config.navigation,
    ...config.extraPages.map((page) => ({ label: page.label, href: `/${page.slug}` })),
  ];
  const smoothPaths = [
    '/',
    '/data-methods',
    ...(config.smoothScrollOnPartPages ? config.parts.map((part) => `/${part.slug}`) : []),
  ];

  return (
    <html
      lang="en"
      className={`${serif.variable} ${sans.variable} ${mono.variable}`}
      // The head script adds classes to <html> before React hydrates.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: HEAD_SCRIPT }} />
      </head>
      <body>
        <MotionStart />
        <SmoothScroll paths={smoothPaths} />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Nav brand={config.site.name} items={navItems} />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
