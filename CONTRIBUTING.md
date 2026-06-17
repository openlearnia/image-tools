# Contributing to Image Tools

## Setup

```powershell
bun install
bun run dev
```

## Adding a tool

1. Add an entry to `src/data/image-tools.json`
2. Create `src/pages/<slug>.astro` using `ToolShell` and the shared `ImageEngine`
3. Link from the hub page automatically via the JSON catalog

## Pull requests

- Keep processing client-side only — no server uploads
- Run `bun run build` before submitting
- Match existing Astro + TypeScript patterns
