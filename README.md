# Big Horn Recreation

The Big Horn Community Recreation & Early Learning Center website, migrated to Astro and TypeScript. Shared components render structured content; the four original public URLs, donation details, news, and assets are preserved.

## Run locally

Requires Node.js 22.12 or newer and npm.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:4321**. Changes to content, components, and styles update the local site automatically. Astro 7 runs its development server in the background; `npx astro dev stop` stops it, and `npx astro dev logs` shows its log.

## Work on the site

The production domain is `https://bighornrec.org` (configured in `astro.config.mjs`). `public/robots.txt` allows crawling and points to `public/sitemap.xml`, which lists the four public pages with their production `.html` URLs. Update the sitemap when adding or removing public pages; omit the 404 page.

Hosting uses GitHub Pages through `.github/workflows/static.yml`. The branded error page in `src/pages/404.astro` builds to `dist/404.html`, which GitHub Pages serves for missing URLs. It includes `noindex` metadata and root-relative navigation so links work even from missing nested paths. Preview it locally at `/404` or visit an unknown URL.

- `content/pages/*.json`: page headings, descriptions, sections, images, and donation information. Section bodies use Markdown.
- `content/news.json`: dated news entries, newest first when rendered. `order` resolves same-date ordering.
- `content/site.json`: shared branding, navigation, and contact email.
- `src/components/Page.astro`: shared page and section rendering.
- `src/layouts/SiteLayout.astro`: navigation, footer, metadata, and mobile menu.
- `src/styles/site.css`: responsive styling and brand colors.
- `public/images/`: all original assets, including unused logo variants and PDFs.
- `legacy/`: untouched original HTML, CSS, and assets for comparison. These are excluded from the public build.

The site is maintained as an app by Codex. No CMS, database, cloud account, or environment secrets are required. It works locally; the original Google Fonts URLs remain an optional external request, with system font fallbacks.

## Validate and build

The favicon set uses the new WebP logos: transparent artwork for the 16/32px PNGs and 16/32/48px ICO, and blue artwork for Apple (180px) and Android (192/512px). Regenerate with `npm run icons` on macOS (uses the built-in `sips` tool). `public/site.webmanifest` links the Android icons; the shared layout links the browser and Apple icons. Bump the icon URL version when replacing artwork to refresh browser caches.

```sh
npm run check
npm run build
npm test
npm run preview
```

Tests inspect the generated output to check original content, donation and news links, local asset paths, fragment targets, and asset hashes. Run the build before the tests. When intentionally changing old copy, update the migration assertions accordingly.

Astro exports `index.html`, `corporate.html`, `individual.html`, `news.html`, and `404.html` into `dist/`. Development middleware supports those same `.html` URLs. The existing GitHub Pages workflow now checks, builds, tests, and uploads only `dist/`; a future push to `main` will deploy through that workflow. This migration itself does not publish anything.

`scripts/migrate-legacy.mjs` is the one-time importer. Do not rerun it after editing current content: it replaces content with the archived source.
