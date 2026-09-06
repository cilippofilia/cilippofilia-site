# Svelte migration + Bun compile pipeline

## Goal

Rewrite the site's pages from hand-rolled HTML + vanilla-JS DOM manipulation
into Svelte components, and serve them through `Bun.serve()` with HTML
imports instead of the current hand-rolled `node:http` static server.

## Scope

All current pages are in scope, including the nine-tiles-puzzle landing
page (it turned out to be a static marketing page with a countdown timer,
not a canvas game — no special risk there).

Pages, current file → new root component:

| Route                          | Current file                              | New root component        |
|---------------------------------|--------------------------------------------|----------------------------|
| `/home`                         | `web/index.html`                           | `Home.svelte`              |
| `/style-guide`                  | `web/style-guide.html`                     | `StyleGuide.svelte`        |
| `/:slug` (generic app template) | `web/app.html`                             | `AppTemplate.svelte`       |
| `/nine-tiles-puzzle`            | `web/nine-tiles-puzzle/index.html`         | `NineTilesPuzzle.svelte`   |
| `/nine-tiles-puzzle/privacy-policy` | `web/nine-tiles-puzzle/privacy-policy.html` | `PrivacyPolicy.svelte` |

Shared components (under `web/components/`), each absorbing the equivalent
current JS file's behavior:

| Component        | Absorbs                                  |
|-------------------|-------------------------------------------|
| `Nav.svelte`       | `web/js/nav.js` (injects the header)      |
| `FloatingIcons.svelte` | `web/js/floating-icons.js`            |
| `IntroFlip.svelte` | `web/js/intro-flip.js` (scroll-driven flip-card intro animation) |
| `ProfileCard.svelte` | profile card markup currently inline in `index.html` |
| `AppsFeed.svelte`  | `web/js/apps-feed.js` (fetches `/api/appstore-apps` + `/apps.json`, renders the featured strip and published/dev grids) |
| `AppCard.svelte`   | `web/js/app-card.js` (renders one app card) |
| `Countdown.svelte` | `web/nine-tiles-puzzle/app.js` (release countdown timer) |

`AppTemplate.svelte` keeps its current client-side behavior as-is: it reads
the slug from `location.pathname` and fetches `/apps.json` itself in the
browser. No server-side data injection is being introduced for it.

## CSS

Global stylesheets (`web/css/tokens.css`, `base.css`, `layout.css`,
`components.css`, `intro.css`, and the puzzle's own `style.css`) are kept
as-is and linked from each page's `.html` entry file, same as today. They
are **not** being converted to Svelte component-scoped `<style>` blocks —
that's out of scope for this migration.

## anime.js

`web/js/intro-flip.js` currently depends on a CDN-loaded `anime.min.js`
`<script defer>` tag in `index.html`'s `<head>`, with a code comment
documenting a script-ordering dependency (`nav.js` must run before deferred
modules). This migration replaces that with an npm dependency:
`bun add animejs`, imported directly inside `IntroFlip.svelte`. This removes
the CDN tag and the load-order dependency entirely — Bun bundles animejs
like any other module.

## Server

`server.js` is rewritten around `Bun.serve()`:

- One route per page above, each backed by an HTML import (e.g.
  `import home from "./web/pages/home.html"`) whose entry script mounts the
  matching root Svelte component with Svelte 5's `mount()`.
- `bun-plugin-svelte` (the actively maintained package published under
  Bun's own npm scope conventions, `bun-plugin-svelte@0.0.6` at time of
  writing) is registered so `.svelte` imports are compiled automatically by
  Bun's bundler, in both `bun --hot server.js` (dev, with HMR) and a
  production `Bun.build()` step.
- `src/server/appstore.js` (App Store API fetch + cache) is unchanged and
  wired in as the `/api/appstore-apps` route handler.
- `src/server/static.js` shrinks to just the two cases Bun's HTML-import
  bundling doesn't cover: `/apps.json` (served from `data/apps.json`) and
  `/favicon.ico`. The current `STATIC_DIRS`/`serveWithin` manual static
  file serving is removed — assets referenced from pages/components are
  picked up by Bun's bundler through the HTML imports instead.
- Existing redirects (`/` → `/home`, `/app-store` → `/home#apps`) are kept.

## Out of scope

- No visual/behavioral redesign — this is a like-for-like port to Svelte
  components plus a build-pipeline swap, not a redesign.
- No conversion of global CSS to component-scoped styles.
- No changes to `data/apps.json`, `appstore.js`'s caching behavior, or the
  App Store API integration itself.
