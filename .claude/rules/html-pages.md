---
paths:
  - "web/**/*.html"
---

# HTML page rules

## Every page

- `<!doctype html>`, `lang="en"`, `charset`, `viewport`.
- A unique `<title>` in the form `Page Name · cilippofilia.dev` (landing pages use just the app name). Never use
  em dashes in titles.
- `meta name="description"`, `link rel="canonical"` with the `https://cilippofilia.dev/...` URL, and the Open Graph
  set: `og:type`, `og:site_name`, `og:url`, `og:title`, `og:description`, `og:image` (absolute URL).
  Exceptions: `404.html` is `noindex` with no canonical, and `app.html` is a shared template with no fixed URL, so
  it has no canonical either.
- Favicon `/assets/favicon.svg` and `apple-touch-icon`, `meta name="theme-color" content="#000000"`.
- Exactly one `<h1>` per page.

## Site pages (`web/*.html`)

- Stylesheets in order: `/css/tokens.css`, `/css/base.css`, `/css/layout.css`, `/css/components.css`, then any
  page-specific CSS. Always use absolute `/css/...` and `/js/...` paths.
- Include `<script src="/js/nav.js"></script>` for the shared header and footer. Don't hand-write a header or footer.
- Page logic goes in a module under `web/js/` loaded with `type="module"`, not in inline `<script>` blocks.
- A new page also needs a route: `PAGES` in `router.js`, a `[[redirects]]` entry in `netlify.toml`, and its slug in
  `RESERVED_SLUGS` in `src/build/netlify.js`. Add a router test for it.

## Custom app landing pages (`web/<app>/`)

- A folder with its own `index.html` is served automatically at `/<app>/`. No router change is needed.
- Link `/css/landing.css` and `/js/landing-reveal.js` by **absolute** path. Link the app's own files (`style.css`,
  `assets/...`) by **relative** path. The local server only serves the app's own folder under `/<app>/`.
- Each app keeps its own `privacy-policy.html` in its folder.
- If the app is published, add its App Store track id → folder to `CUSTOM_APP_PAGES` in `src/server/appstore.js` so
  its card links here.

## Accessibility

- Decorative images get `alt=""` and decorative wrappers get `aria-hidden="true"`. Meaningful images get real alt
  text.
- Give `<img>` explicit `width`/`height`.
- Name `<nav>` landmarks with `aria-label` when there's more than one.
- Use `<button type="button">` for actions and `<a>` for navigation. External links get `target="_blank"
  rel="noopener"`.
