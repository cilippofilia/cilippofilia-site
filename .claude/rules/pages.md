---
paths:
  - "src/routes/**/*.svelte"
  - "src/routes/**/+page.js"
  - "src/app.html"
---

# Page rules

## Every page

- `src/app.html` provides `lang="en"`, charset, viewport and `theme-color`. Don't repeat them in pages.
- Every page renders `<Seo>` (`src/lib/components/Seo.svelte`) with `title`, `description`, `url` (the canonical
  `https://cilippofilia.dev/...` URL) and, if not the default, `image`. Titles take the form
  `Page Name · cilippofilia.dev` (landing pages use just the app name). Never use em dashes in titles. The 404 passes
  `noindex` and no `url`.
- Favicon links come from the layout (`(site)`) or the page's own `<svelte:head>` (landing pages, the error page).
- Exactly one `<h1>` per page. The style guide is the one exception: its type specimen shows a sample `<h1>`.
- Pages are prerendered (`prerender = true` in the root `+layout.js`). No inline `<script>` or `on…=` attributes in
  markup: the hash-based CSP only allows SvelteKit's own bootstrap, and the build test fails on them.

## Site pages (`src/routes/(site)/`)

- A new page is a folder with `+page.svelte`; the `(site)` layout supplies the header, footer and shared CSS.
- Add a new public page's path to `SITE_PAGES` in `src/lib/site-pages.js` so it lands in `sitemap.xml`, and add its
  first path segment to `RESERVED_SLUGS` in `src/lib/apps/dev-apps.js` so no `apps.json` entry can claim it.
- In-development app pages come from `data/apps.json` via `src/routes/(site)/[slug]/`; don't hand-write them.

## App landing pages (`src/routes/(landing)/<app>/`)

- `+page.svelte` plus `+page.js` with `trailingSlash = "always"` (so `/<app>` redirects to `/<app>/`), and
  `privacy-policy/` with `csr = false` and `trailingSlash = "never"`, which prerenders it to
  `<app>/privacy-policy.html`, the URL App Store listings use. Add the slug to `PRIVACY_HTML` in `src/hooks.js`.
- The app's images live in `static/<app>/assets/`.
- Add the slug to `LANDING_APPS` in `src/lib/apps/landing-apps.js`; that puts both pages in the sitemap and reserves
  the slug.
- If the app is published, add its App Store track id → slug to `CUSTOM_APP_PAGES` in `src/lib/server/appstore.js`
  so its card links here.

## Accessibility

- Decorative images get `alt=""` and decorative wrappers get `aria-hidden="true"`. Meaningful images get real alt
  text.
- Give `<img>` explicit `width`/`height`.
- Name `<nav>` landmarks with `aria-label` when there's more than one.
- Use `<button type="button">` for actions and `<a>` for navigation. External links get `target="_blank"
  rel="noopener"`.
