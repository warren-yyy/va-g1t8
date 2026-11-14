'use client';

import { Children, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { ScrollTrigger } from '@/lib/gsap';

export interface TabInfo {
  /** Dashboard id, such as "D1". Its lowercase form is the panel's id and deep link. */
  id: string;
  label: string;
}

interface DashboardTabsProps {
  /** Accessible name of the tab list, such as "Part 1 dashboards". */
  label: string;
  tabs: TabInfo[];
  /** One panel per tab, in the same order, rendered on the server. */
  children: ReactNode;
}

const anchorOf = (id: string) => id.toLowerCase();

/**
 * WAI-ARIA tabs with manual activation: arrow keys, Home and End move focus between tabs,
 * and Enter, Space or a click selects one. Every panel stays mounted and inactive ones are
 * only hidden, so a dashboard that has loaded keeps its filters when you switch away and
 * back. A hidden panel has no size, so its embed's IntersectionObserver never fires and no
 * viz starts until its tab is active and near the viewport.
 *
 * #d1 to #d13 select the matching tab and scroll to it, on load and on hashchange.
 */
export default function DashboardTabs({ label, tabs, children }: DashboardTabsProps) {
  const panels = Children.toArray(children);
  const rootRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  // Set when a deep link selects a tab: scroll once that tab's panel is visible.
  const pendingScroll = useRef<ScrollBehavior | null>(null);
  const hasTabs = tabs.length > 1;

  useEffect(() => {
    const fromHash = (behavior: ScrollBehavior) => {
      const hash = window.location.hash.slice(1).toLowerCase();
      const index = tabs.findIndex((tab) => anchorOf(tab.id) === hash);
      if (index === -1) return;
      if (index === activeRef.current) {
        // Already visible, so there is no re-render to wait for.
        rootRef.current?.scrollIntoView({ behavior, block: 'start' });
        return;
      }
      pendingScroll.current = behavior;
      setActive(index);
    };
    // On load, jump: the browser's own attempt failed if the panel was hidden.
    fromHash('instant');
    const onHashChange = () => fromHash('smooth');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [tabs]);

  // After a switch: finish any deep-link scroll, and let ScrollTrigger measure the new layout.
  useEffect(() => {
    activeRef.current = active;
    if (pendingScroll.current) {
      const behavior = pendingScroll.current;
      pendingScroll.current = null;
      rootRef.current?.scrollIntoView({ behavior, block: 'start' });
    }
    const frame = window.requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => window.cancelAnimationFrame(frame);
  }, [active]);

  const select = (index: number) => {
    if (index === active) return;
    setActive(index);
    window.history.replaceState(window.history.state, '', `#${anchorOf(tabs[index]!.id)}`);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = tabs.length - 1;
    const next =
      event.key === 'ArrowRight'
        ? (index + 1) % tabs.length
        : event.key === 'ArrowLeft'
          ? (index - 1 + tabs.length) % tabs.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="tabs" ref={rootRef}>
      {hasTabs && (
        <div className="tabs__list" role="tablist" aria-label={label}>
          {tabs.map((tab, index) => {
            const anchor = anchorOf(tab.id);
            const selected = index === active;
            return (
              <button
                key={tab.id}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                type="button"
                role="tab"
                id={`tab-${anchor}`}
                className="tabs__tab"
                aria-selected={selected}
                aria-controls={anchor}
                tabIndex={selected ? 0 : -1}
                onClick={() => select(index)}
                onKeyDown={(event) => onKeyDown(event, index)}
              >
                <span className="tabs__id">{tab.id}</span> {tab.label}
              </button>
            );
          })}
        </div>
      )}
      {panels.map((panel, index) => {
        const anchor = anchorOf(tabs[index]!.id);
        return hasTabs ? (
          <div
            key={anchor}
            className="tabs__panel"
            role="tabpanel"
            id={anchor}
            aria-labelledby={`tab-${anchor}`}
            hidden={index !== active}
          >
            {panel}
          </div>
        ) : (
          <div key={anchor} className="tabs__panel" id={anchor}>
            {panel}
          </div>
        );
      })}
    </div>
  );
}
