# Rimi Riga Marathon Elite 2026 Embed

A Vite + React embed app for the Rimi Riga Marathon elite field.

## GitHub / Cloudflare files

Keep this structure in the repo root:

```txt
public/
  elite.csv
  logo.svg
src/
  main.tsx
  styles.css
  vite-env.d.ts
index.html
package.json
tsconfig.json
vite.config.ts
wrangler.toml
```

## Cloudflare build settings

Build command:

```txt
npm run build
```

Deploy command:

```txt
npx wrangler deploy
```

## Data

The app first tries to load the live CSV from:

```txt
https://raw.githubusercontent.com/davis-rukitis-nc/elite-2026/refs/heads/main/public/elite.csv
```

If that fails, it falls back to:

```txt
/public/elite.csv
```

BIB numbers are only shown if the CSV contains real BIB values. They are not generated automatically.
