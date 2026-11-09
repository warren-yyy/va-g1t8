import type { ReactNode } from 'react';

// A template remounts on every navigation, so the CSS animation replays. An overlay fades
// out instead of a wrapper fading in: no ancestor of a dashboard is ever animated, and
// being pure CSS it cannot get stuck if a script fails.
export default function Template({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="page-fade" aria-hidden="true" />
      {children}
    </>
  );
}
