# B2 Partner Dashboard

A small React app that visualizes synthetic Backblaze B2 partner usage data for 100 customers. It uses Vite React TypeScript Tailwind minimal shadcn style components Recharts Lucide and Framer Motion.

## Features

- Seeded demo data generator stable across reloads
- Region and date range filters with search
- KPI cards and daily trend charts stored TB egress TB requests
- Sortable customers table with per customer detail dialog
- One click Sample CSV download demonstrating an ingestion schema

## Tech stack

- Vite React TypeScript
- TailwindCSS
- Minimal shadcn style UI components powered by Radix UI
- Recharts for charts and Lucide icons
- Framer Motion for simple animations

## Quick start

```bash
# install
npm install

# dev server
npm run dev

# production build
npm run build

# preview the production build
npm run preview
```

Open the local URL that Vite prints in your terminal.

## Project structure

```
b2-partner-dashboard/
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  tailwind.config.ts
  postcss.config.js
  src/
    main.tsx
    index.css
    App.tsx
    PartnerConsoleDemo.tsx
    components/ui/
      badge.tsx
      button.tsx
      card.tsx
      dialog.tsx
      input.tsx
      label.tsx
      scroll-area.tsx
      select.tsx
      tabs.tsx
      utils.tsx
```

## Notes

- The UI imports components from `@/components/ui/*` which are simple wrappers around Radix primitives styled with Tailwind
- Charts use the current text color by default adjust color by wrapping the chart in a container and styling the text color
- The Sample CSV shows the expected columns `date customer region bucket storageTB egressTB requests`

## Deploying as static site

`npm run build` emits a `dist` folder you can host on any static host

### Backblaze B2 static hosting via a CDN

One common pattern is to upload `dist` to a public bucket and serve it behind a CDN

- Build the site `npm run build`
- Upload files to your bucket with your preferred tool for example `rclone` or the `b2` CLI
- Put a CDN like Cloudflare in front of the bucket selecting the nearest B2 region and enabling caching

## License

MIT or your company standard license

## GitHub Actions CI for Backblaze B2

This repo includes a workflow that builds the site and uploads the `dist` folder to a Backblaze B2 bucket using `rclone`.

**Required repo secrets**
* `B2_KEY_ID`  B2 application key ID
* `B2_APP_KEY`  B2 application key
* `B2_BUCKET`  Destination bucket name
* `B2_PREFIX`  Optional prefix inside the bucket for example `site`

**How it works**
* On push to `main` or via manual dispatch it builds the site then syncs `dist` to `b2://$B2_BUCKET/$B2_PREFIX`
* Static assets are uploaded with long cache headers `Cache-Control: public, max-age=31536000, immutable`
* `index.html` and `404.html` are re uploaded with `Cache-Control: no-cache` so updates appear immediately

**CDN tip**
Put a CDN like Cloudflare or Fastly in front of your B2 public bucket for best performance. Map the origin to your B2 region endpoint and enable caching of immutable assets.
