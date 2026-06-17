# Deploy Image Tools to image.openlearnia.com

## Cloudflare Pages setup

1. Create a new Pages project: **openlearnia-image-tools**
2. Connect repository: `github.com/openlearnia/image-tools`
3. Build settings:
   - **Root directory:** `projects/tools/image-tools`
   - **Build command:** `bun run build`
   - **Build output:** `dist`
4. Environment: Node.js 22 (default)

## Custom domain

1. In Pages → **Custom domains** → add `image.openlearnia.com`
2. Add the CNAME record Cloudflare provides to your DNS (or use Cloudflare DNS on openlearnia.com)

## Verify

- `https://image.openlearnia.com/` — tool hub
- `https://image.openlearnia.com/compress` — sample tool
- Footer links back to `https://openlearnia.com`

## Marketing site link

Ensure [openlearnia.com/tools](https://openlearnia.com/tools) lists Image Tools with `url: https://image.openlearnia.com`.
