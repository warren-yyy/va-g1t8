import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import renderPages from './scripts/render-plugin.mjs';
import config from './src/site.config.js';

const pages = [
  'index',
  'burden',
  'drivers',
  'dengue-vs-malaria',
  'singapore',
  'conclusion',
  'data-methods',
  ...config.extraPages.map((page) => page.slug),
];

export default defineConfig({
  appType: 'mpa',
  plugins: [renderPages()],
  build: {
    rolldownOptions: {
      input: Object.fromEntries(pages.map((page) => [page, resolve(import.meta.dirname, `${page}.html`)])),
    },
  },
});
