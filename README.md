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

Cloudflare Pages: connect `openlearnia/image-tools`, build command `bun run build`, output `dist`, root directory `.` (repo root). Custom domain: `image.openlearnia.com`.

See [CONTRIBUTING.md](CONTRIBUTING.md) and `.github/workflows/deploy.yml`.

## License

MIT — see [LICENSE](LICENSE).
