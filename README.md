# Rimi Riga Marathon Elite Runners 2026

Small React/Vite embed for the 2026 elite runner field.

## Data

The app loads the live CSV from:

`https://raw.githubusercontent.com/davis-rukitis-nc/elite-2026/refs/heads/main/public/elite.csv`

It also falls back to `/elite.csv` if needed.

## Deploy

Cloudflare Workers & Pages settings:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Output directory: handled by `wrangler.toml` as `./dist`

## Embed

```html
<div style="width:100%;display:flex;justify-content:center;align-items:flex-start;box-sizing:border-box;">
  <iframe src="https://elite.marathon-data.workers.dev/" style="width:100%;max-width:840px;height:860px;border:0;display:block;background:transparent;" loading="lazy"></iframe>
</div>
```

If the parent page supports the `rrm-widget-height` postMessage, the app also sends automatic height updates.
