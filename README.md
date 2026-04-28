# Rimi Riga Marathon Elite Showcase 2026

## New in this version

- Clickable athlete cards and table rows
- Profile overlay/modal inside the iframe
- Profile fields: PB, event, country, year, highlight, bio, links, tags
- Search, distance/gender/country filters, sorting, cards/table view
- CSV-driven data source

## Data

Local fallback file:

```text
public/elite.csv
```

For live GitHub data, set this Cloudflare Pages environment variable:

```text
VITE_ELITE_CSV_URL=https://raw.githubusercontent.com/davis-rukitis-nc/elite-2026/refs/heads/main/elite.csv
```

Expected semicolon-delimited CSV columns:

```csv
BIB Nr.;Athlete;Country;Country Code;Year;Date of birth;Personal Best Time;Personal Best City/Year;Distance;Gender;Image;Highlight;Instagram;Bio;Profile URL;Source URL;Tags
```

Optional columns can be left empty. The app also supports the older 2025 column names.

## Cloudflare Pages settings

```text
Framework preset: Vite
Build command: npm run build
Build output directory: dist
```

## Local development

```bash
npm install
npm run dev
```

## Embed example

```html
<div style="width:100%;display:flex;justify-content:center;align-items:flex-start;box-sizing:border-box;">
  <iframe
    src="https://YOUR-CLOUDFLARE-PAGES-URL.pages.dev/"
    style="width:100%;max-width:1100px;height:860px;border:0;display:block;background:transparent;"
    loading="lazy"></iframe>
</div>
```

The profile overlay opens inside the iframe, so keep enough iframe height for a comfortable modal.
