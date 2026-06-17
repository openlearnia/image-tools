import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://image-tools.openlearnia.com',
  output: 'static',
  vite: {
    worker: {
      format: 'es',
    },
  },
});
