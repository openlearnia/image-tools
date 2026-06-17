# Contributing to Image Tools

## Repository layout

```
image-tools/
└── projects/tools/imagetools/   ← Astro app (all development here)
```

## Setup

```powershell
cd projects/tools/imagetools
npm install
npm run dev
```

## Adding a tool

1. Add an entry to `src/data/image-tools.json`
2. Create `src/pages/<slug>.astro` using `ToolShell` and the shared `ImageEngine`
3. Link from the hub page automatically via the JSON catalog

## Pull requests

- Keep processing client-side only — no server uploads
- Run `npm run build` before submitting
- Match existing Astro + TypeScript patterns
