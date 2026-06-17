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
cd projects/tools/imagetools
npm install
npm run dev
```

Open [http://localhost:4321](http://localhost:4321).

## Build

```powershell
cd projects/tools/imagetools
npm run build
```

Output is in `projects/tools/imagetools/dist/`.

## Deploy

Cloudflare Pages: connect `openlearnia/image-tools`, set root directory to `projects/tools/imagetools`, build command `npm run build`, output `dist`. Custom domain: `image.openlearnia.com`.

See [CONTRIBUTING.md](CONTRIBUTING.md) and `.github/workflows/deploy.yml`.

## License

MIT — see [LICENSE](LICENSE).
