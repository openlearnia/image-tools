import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://image.openlearnia.com',
  output: 'static',
  vite: {
    worker: {
      format: 'es',
    },
  },
});
