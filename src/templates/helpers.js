// Small string helpers shared by the build-time page templates.

export function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** Fills {tokens} from stats.json and fails the build if a token is unknown. */
export function fill(text, tokens = {}) {
  return String(text ?? '').replace(/\{(\w+)\}/g, (match, key) => {
    if (!(key in tokens)) throw new Error(`Unknown token ${match} in "${text}". Run npm run data, or fix the wording.`);
    return String(tokens[key]);
  });
}

/** A reference to an external page, opened in a new tab and announced as such. */
export function externalLink(href, label, className = '') {
  const cls = className ? ` class="${esc(className)}"` : '';
  return `<a${cls} href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label)}<span class="sr-only"> (opens in a new tab)</span></a>`;
}

export function normalizePath(path) {
  const clean = String(path ?? '/')
    .replace(/[?#].*$/, '')
    .replace(/\.html$/, '')
    .replace(/\/index$/, '/')
    .replace(/\/+$/, '');
  return clean || '/';
}
