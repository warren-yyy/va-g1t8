import type { ReactNode } from 'react';
import { fill } from '@/lib/fill';

// One pass over the text: a view link, **bold** or *italic*, whichever comes first.
// They do not nest, so keep a link's text and a bold phrase separate.
const MARKUP = /\[([^\]]+)\]\(#(d\d+[a-z]?)\)|\*\*(.+?)\*\*|==(.+?)==|\*(.+?)\*/g;

/**
 * fill() plus light formatting for a view's text:
 *   [link text](#d5a)  a link that opens that view's tab, like typing /#d5a
 *   **bold**           for the phrase a skimming reader should catch
 *   ==blue==           for a point worth highlighting in blue (the --highlight colour)
 *   *italic*           for a stressed word
 */
export function fillRich(text: string): ReactNode {
  const filled = fill(text);
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of filled.matchAll(MARKUP)) {
    const [whole, linkText, anchor, bold, blue, italic] = match;
    const start = match.index ?? 0;
    if (start > last) parts.push(filled.slice(last, start));
    if (anchor !== undefined) {
      parts.push(
        <a key={start} href={`#${anchor.toLowerCase()}`}>
          {linkText}
        </a>,
      );
    } else if (bold !== undefined) {
      parts.push(<strong key={start}>{bold}</strong>);
    } else if (blue !== undefined) {
      parts.push(
        <span key={start} className="hl">
          {blue}
        </span>,
      );
    } else {
      parts.push(<em key={start}>{italic}</em>);
    }
    last = start + whole.length;
  }
  if (parts.length === 0) return filled;
  if (last < filled.length) parts.push(filled.slice(last));
  return parts;
}
