// Each feature loads only on the pages that use it. The Tableau code stays out of
// the homepage entirely, because no [data-embed] exists there.
if (document.querySelector('[data-embed]')) {
  import('./lib/tableau-embed.js').then(({ initEmbeds }) => initEmbeds());
}
