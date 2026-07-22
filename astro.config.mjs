import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://image-tools.openlearnia.com',
  output: 'static',
  integrations: [sitemap()],
  vite: {
    worker: {
      format: 'es',
    },
  },
});
