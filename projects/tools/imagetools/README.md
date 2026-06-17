# Image Tools (Astro webapp)

Privacy-first image utilities at [image.openlearnia.com](https://image.openlearnia.com).

```powershell
npm install
npm run dev
```

## Architecture

- `src/lib/image/` — ImageEngine, Web Worker, batch/ZIP helpers
- `src/scripts/` — per-tool client UI logic
- `src/pages/` — one route per tool

All processing runs client-side; no uploads.
