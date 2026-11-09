import { esc, normalizePath } from './helpers.js';

function navItems(config) {
  const extras = config.extraPages.map((page) => ({ label: page.label, href: `/${page.slug}` }));
  return [...config.navigation, ...extras];
}

function navList(config, currentPath) {
  const current = normalizePath(currentPath);
  return navItems(config)
    .map(({ label, href }) => {
      const here = normalizePath(href) === current ? ' aria-current="page"' : '';
      return `<li><a href="${esc(href)}"${here}>${esc(label)}</a></li>`;
    })
    .join('');
}

// The inline script runs before first paint. Only html.js may hide reveal targets, and
// the timer shows everything if the motion module has not started within 2.5s.
const HEAD_SCRIPT = `document.documentElement.classList.add('js');window.__motionFailsafe=setTimeout(function(){document.documentElement.classList.add('motion-off')},2500);`;

/** The one document wrapper every page goes through. */
export function renderShell(config, { path, title, description, smooth = false, progress = false, main }) {
  const { site } = config;
  const fullTitle = `${title} | ${site.name}`;
  return `<!doctype html>
<html lang="en"${smooth ? ' data-smooth="true"' : ''}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#0b0c0e">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>html{background:#0b0c0e;color-scheme:dark}</style>
<script>${HEAD_SCRIPT}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Instrument+Serif&display=swap">
<link rel="stylesheet" href="/src/styles/site.css">
</head>
<body>
<div class="page-fade" aria-hidden="true"></div>
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <div class="site-header__inner">
    <a class="brand" href="/">${esc(site.name)}</a>
    <nav class="site-nav" aria-label="Main">
      <ul>${navList(config, path)}</ul>
    </nav>
    <button class="menu-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="menu-overlay">
      <span aria-hidden="true"></span>
    </button>
  </div>
</header>
${progress ? '<div class="progress" data-progress aria-hidden="true"><span></span></div>' : ''}
<div class="menu-overlay" id="menu-overlay" inert>
  <nav aria-label="Main menu">
    <ul>${navList(config, path)}</ul>
  </nav>
</div>
<main id="main" tabindex="-1">
${main}
</main>
<footer class="site-footer">
  <div class="site-footer__inner">
    <p>${esc(site.course)}. ${esc(site.group)}: ${esc(config.team.join(', '))}.</p>
    <p>Global figures are annual and end in 2024. <a href="/data-methods">Data &amp; Methods</a></p>
  </div>
</footer>
<script type="module" src="/src/main.js"></script>
</body>
</html>
`;
}
