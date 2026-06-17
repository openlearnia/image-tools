# Openlearnia Image Tools

Privacy-first image utilities that run entirely in your browser — nothing is uploaded.

**Live:** [image.openlearnia.com](https://image.openlearnia.com)

## Features

- Compress, resize, convert, crop, rotate, strip metadata
- Watermark, merge/collage, favicon pack generator
- Batch processing with ZIP download
- All processing happens on your device via Web Workers

## Develop

```powershell
bun install
bun run dev
```

Open [http://localhost:4321](http://localhost:4321).

## Build

```powershell
bun run build
```

Output is in `dist/`.

## Deploy

Pushes to `main` deploy `dist/` to Cloudflare Pages via GitHub Actions (`.github/workflows/deploy.yml`). Required org secrets: `CF_API_TOKEN`, `CF_ACCOUNT_ID`. Pages project name is in `wrangler.toml`. Custom domain: `image.openlearnia.com`.

## License

MIT — see [LICENSE](LICENSE).
