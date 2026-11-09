/*
 * Renders the thin .html files through src/templates at build time (and in dev).
 * In dev the templates load through Vite, so edits to the config show on reload.
 */
export default function renderPages() {
  let server = null;

  const loadModules = async () => {
    if (server) {
      const [templates, config] = await Promise.all([
        server.ssrLoadModule('/src/templates/index.js'),
        server.ssrLoadModule('/src/site.config.js'),
      ]);
      return { renderDocument: templates.renderDocument, config: config.default };
    }
    const [templates, config] = await Promise.all([
      import('../src/templates/index.js'),
      import('../src/site.config.js'),
    ]);
    return { renderDocument: templates.renderDocument, config: config.default };
  };

  return {
    name: 'g1t8-render-pages',
    configureServer(devServer) {
      server = devServer;
    },
    hotUpdate({ file, server: hmrServer }) {
      const normalized = file.replaceAll('\\', '/');
      if (/\/src\/(site\.config\.js|templates\/|data\/)/.test(normalized)) {
        hmrServer.ws.send({ type: 'full-reload' });
        return [];
      }
      return undefined;
    },
    transformIndexHtml: {
      order: 'pre',
      async handler(html, ctx) {
        const { renderDocument, config } = await loadModules();
        return renderDocument(html, ctx.path, config);
      },
    },
  };
}
