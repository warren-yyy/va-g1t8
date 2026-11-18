import type { ReactNode } from 'react';
import { fill } from '@/lib/fill';

/** [link text](#d5a): a link to another view. The anchor is the view's id in lower case. */
export const VIEW_LINK = /\[([^\]]+)\]\(#(d\d+[a-z]?)\)/gi;

/**
 * fill() plus view links. Text like "see [Is there a best temperature?](#d4b)" becomes a
 * link that opens the D4b tab, the same as typing /#d4b in the address bar.
 */
export function fillRich(text: string): ReactNode {
  const filled = fill(text);
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of filled.matchAll(VIEW_LINK)) {
    const [whole, label, anchor] = match;
    const start = match.index ?? 0;
    if (start > last) parts.push(filled.slice(last, start));
    parts.push(
      <a key={start} href={`#${anchor.toLowerCase()}`}>
        {label}
      </a>,
    );
    last = start + whole.length;
  }
  if (parts.length === 0) return filled;
  if (last < filled.length) parts.push(filled.slice(last));
  return parts;
}
