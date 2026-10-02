# SvelteKit migration: design

Date: 2026-10-02
Branch: `svelte-migration` (branched from `fix-flip-backface`, so it includes the flip-card backface fix)

## Goal

Rewrite cilippofilia.dev as a SvelteKit app. All HTML, CSS and client JS moves into Svelte components and routes. SvelteKit's file-based routing replaces the hand-rolled router (`server.js`, `src/server/router.js`, `src/server/static.js`) and the Netlify routing kept in sync with it by hand (`src/build/netlify.js`, `netlify/functions/`, most of `netlify.toml`).

### Decisions made

- Full SvelteKit rewrite, not Svelte components inside the current Bun multi-page setup.
- Deploy with `@sveltejs/adapter-netlify`. Pages are prerendered. Dynamic endpoints become Netlify Functions.
- The four app landing pages (nine-tiles-puzzle, drinko, iterly, itswritten) become Svelte routes, not static files.

### Assumptions

- **Like-for-like port.** Every current URL, page, game, animation and visual detail is kept. No redesign or copy changes ride along.
- **Bun remains the toolchain.** Vite runs under Bun (`bunx --bun vite dev`, `bunx --bun vite build`), so `bun:sqlite` works in dev and `bun test` is still the test runner.
- **The "no frameworks" rule is lifted for this branch.** `CLAUDE.md`, `README.md` and the `.claude/rules/` files are rewritten to describe the new setup.

### Success criteria

1. Every route that exists today answers with the same content and status code, both under `vite dev` and on a Netlify deploy preview:
   - `/`, `/home`, `/app-store`, `/style-guide`, `/privacy`, `/terms`, `/favicon.ico`, `/robots.txt`, `/sitemap.xml`
   - every in-development app slug, each landing page and its `privacy-policy`
   - `/api/appstore-apps`, and the 404 page
2. The tests for the pure game and app logic pass unchanged.
3. The security headers are present on every response, with the CSP change described below.
4. The maze and 404 games play on Netlify without saving scores, as they do today.
5. `bun test` passes, and `bun run build` produces a working Netlify deploy.

## Dependencies

- Runtime: `svelte`, `@sveltejs/kit`, `animejs` (existing).
- Dev: `vite`, `@sveltejs/vite-plugin-svelte`, `@sveltejs/adapter-netlify`, `prettier-plugin-svelte` (registered in `.prettierrc` under `plugins`, with an `overrides` entry for `*.svelte`).
- No other additions.

## Architecture

```
src/
  app.html                         shell: lang="en", charset, viewport, theme-color, favicon links, %sveltekit.head%
  hooks.server.js                  security headers, dev redirects, cross-origin POST guard
  lib/
    styles/                        tokens.css, base.css, layout.css, components.css (global), landing.css
    components/                    Header, Footer, Seo, FloatingIcons, IntroFlip, AppCard, FeaturedStrip,
                                   AppDetail, AppStatus, MazeExplainer
    actions/reveal.js              use:reveal (replaces reveal.js and landing-reveal.js)
    games/                         MazeGame.svelte, NotFoundGame.svelte,
                                   maze-wilson.js, maze-move.js, notfound-game-logic.js (+ tests)
    apps/                          app-status.js and the data-shaping logic left from app-card/app-detail (+ tests)
    server/                        appstore.js, dev-apps.js, maze-scores.js, notfound-scores.js, security-headers.js
  routes/
    +error.svelte                  the 404 page with the whack-a-broken-link game
    (site)/
      +layout.svelte               global site CSS, Header, Footer, FloatingIcons where used
      home/+page.svelte
      style-guide/+page.svelte
      privacy/+page.svelte
      terms/+page.svelte
      [slug]/+page.server.js       in-development apps from data/apps.json, prerendered via entries()
      [slug]/+page.svelte
    (landing)/
      +layout.svelte               landing.css only, never the site tokens/components
      nine-tiles-puzzle/{+layout.svelte, +page.svelte, privacy-policy/+page.svelte}
      drinko/...
      iterly/...
      itswritten/...
    api/
      appstore-apps/+server.js     prerender = false; Netlify Function on deploy
      maze-score/+server.js        prerender = false; Bun only, 503 elsewhere
      notfound-score/+server.js    prerender = false; Bun only, 503 elsewhere
    sitemap.xml/+server.js         prerendered from a single route list
static/
  assets/                          everything now under web/assets/ plus each landing page's assets/
  robots.txt
data/apps.json                     unchanged
svelte.config.js                   adapter-netlify, prerender defaults, kit.csp (hash mode)
vite.config.js
```

### Deleted

- `server.js`
- `src/server/router.js`, `src/server/static.js`, and their tests (replaced as described under Testing)
- `src/build/netlify.js` and its test, and the generated `web/_redirects` and `web/apps.json`
- `netlify/functions/appstore-apps.mjs`
- `src/client/floating-icons.js` and the separate `bun build` bundle step
- `web/` (every page, stylesheet and script moves into `src/` or `static/`)

### Routing

- Pages are prerendered by default (`export const prerender = true` in the root layout). The API routes opt out.
- `[slug]` exports `entries()` returning each valid slug from `data/apps.json`, applying the same slug pattern and reserved-name rules as today. Unknown slugs throw `error(404)` and render `+error.svelte`.
- The landing route folders take priority over `[slug]` because SvelteKit ranks static segments above parameters. That replaces the router's "custom site folder wins" rule.
- Trailing slashes:
  - Landing pages set `trailingSlash = 'always'`, so `/drinko` redirects to `/drinko/` as it does today.
  - Site pages keep `'never'` (`/home`, `/privacy`).
- Redirects:
  - `/` → `/home` (302) and `/app-store` → `/home#apps` (301) stay as `[[redirects]]` in `netlify.toml`.
  - `hooks.server.js` mirrors them for dev.
  - These are the only rules still kept in sync by hand.
- `/favicon.ico` is served by a `netlify.toml` rewrite to `/assets/favicon.svg`, mirrored in `hooks.server.js`.
- `/apps.json` is dropped as a public URL. Nothing on the site needs it once the data is imported at build time. It stays only if something outside the site turns out to depend on it.

## Components and styling

### Layout groups

- **`(site)`** imports `tokens.css` → `base.css` → `layout.css` → `components.css` as global CSS, in that order, and renders `Header` and `Footer`.
  - `Header` gets the active link from `$page.url.pathname`.
  - The "App Store" link scrolls smoothly when already on `/home`. That logic currently lives in `nav.js`.
- **`(landing)`** imports only `landing.css`. Each app's `+layout.svelte` carries that app's theme tokens (currently `web/<app>/style.css`) in a `:global` block scoped to a wrapper class. Landing pages still never load the site's tokens or components.
- **`+error.svelte`** has its own minimal shell. It is `noindex` and has no canonical URL.

### Styles

- **Shared, imported by the layouts:** `tokens.css`, `base.css`, `layout.css`, `components.css`, and `landing.css`.
- **Page stylesheets stay as global CSS files,** imported by the page or component that owns them: `intro.css`, `maze-game.css`, `notfound-game.css`, `legal.css`, `style-guide.css`, and each app's `style.css`.
  - They don't become scoped `<style>` blocks.
  - The games and the intro animation create elements in JS (chips, shards, leaderboard rows, the flying profile card), and Svelte's scoping classes never reach those elements.
  - Moving these rules into scoped blocks would also raise their specificity and change what wins in the cascade.
- **Scoped `<style>` is for new rules** that belong to one component and only style markup that component renders itself.

### Navigation

- `<body data-sveltekit-reload>` in `src/app.html` makes every link a full page load. That matches today's multi-page site.
- Each page's global stylesheet, `:root` theme tokens and window listeners therefore start fresh on every page, and can't carry over from the previous one.
- Client-side navigation can be turned on later as its own change.
- **The existing CSS rules all carry over:**
  - tokens first
  - glass never stacks
  - `@supports not (backdrop-filter)` and `prefers-reduced-transparency` fallbacks
  - `prefers-reduced-motion` overrides
  - hover inside `@media (hover: hover)`
  - dark only

### Components

| Component | Replaces |
|---|---|
| `Header`, `Footer` | `web/js/nav.js` |
| `Seo` | per-page `<title>`, description, canonical, Open Graph tags (via `<svelte:head>`) |
| `FloatingIcons` | `src/client/floating-icons.js`. animejs is imported in `onMount`; reduced motion is respected. |
| `IntroFlip` | `web/js/intro-flip.js` |
| `use:reveal` | `web/js/reveal.js`, `web/js/landing-reveal.js` |
| `AppCard`, `FeaturedStrip`, `AppDetail`, `AppStatus` | HTML-string rendering in `app-card.js`, `app-detail.js`; `apps-feed.js`, `app-page.js` |
| `MazeGame`, `MazeExplainer` | `maze-game.js`, `maze-explainer.js` |
| `NotFoundGame` | `notfound-game.js` |
| (removed) | `web/js/html.js` (`escapeHtml`): Svelte escapes interpolated text |
| (removed) | `web/js/style-guide.js`: folded into the style-guide page |

### Logic and DOM stay separate

- The pure-logic modules keep no DOM access and keep their tests: `maze-wilson.js`, `maze-move.js`, `notfound-game-logic.js`, `app-status.js`.
- Components import them.
- The data-shaping parts of `app-card.js` and `app-detail.js` (ordering, featured selection, labels) are pulled out into plain functions with tests. Their string templates become Svelte markup.

All interactive behaviour is wired in `onMount` or actions, so the prerendered HTML matches today's markup and is usable before hydration.

**The four large imperative modules** are `intro-flip.js`, `maze-game.js`, `maze-explainer.js` and `notfound-game.js`.
- They keep their internals.
- Each one's top-level bootstrap (`document.querySelector(...)` or `DOMContentLoaded`) becomes an exported `init…(root, { signal })` function.
- The owning component renders the same static markup and calls the function from `onMount`. It passes an `AbortSignal` that it aborts on destroy.
- Every `addEventListener` gets `{ signal }`, and timer and `requestAnimationFrame` loops stop once `signal.aborted` is set. Without this, Vite's hot reload would stack duplicate listeners in dev.
- The markup these modules mutate stays static in the component (no reactive bindings), so Svelte never fights them over the same nodes.

**Landing privacy policies keep their `.html` URLs** (for example `/drinko/privacy-policy.html`), since App Store listings link to them.
- Each lives at `routes/(landing)/<app>/privacy-policy/+page.svelte` with `trailingSlash = 'never'` and `csr = false`.
- `trailingSlash = 'never'` makes the prerenderer write it as `<app>/privacy-policy.html`.
- `csr = false` means the page loads no JS, since it has none today.
- A `reroute` hook in `src/hooks.js` maps the `.html` path onto the route, so it resolves in `vite dev` too.

## Data flow

### App Store feed

- `/home` is prerendered. `FeaturedStrip` and the apps grid fetch `/api/appstore-apps` in `onMount`.
- On failure the "What's on the App Store" section stays hidden, as it does today.
- `api/appstore-apps/+server.js` calls `src/lib/server/appstore.js`. The behaviour is kept: the iTunes lookup, the 10-minute in-memory cache, the stale-cache fallback, `CUSTOM_APP_PAGES`, and the `Cache-Control` the Netlify Function sends today.
- It must keep running on Node inside the Netlify Function, so it gets no Bun-only APIs.
- The server modules move from CommonJS to ES modules, because Vite's SSR build expects ESM source.
- `appstore.js` switches from `https.get` to `fetch` with `AbortSignal.timeout(8000)`. Bun and Node 18+ both have `fetch`.
- `fetch` is injectable, so the cache and stale fallback can be tested without the network.
- Paths resolve from `process.cwd()` (the repo root under `vite`, `bun test` and Netlify's build) instead of `__dirname`, which no longer points into `src/` once Vite has bundled the code.

### In-development apps

- `data/apps.json` is imported at build time by `[slug]/+page.server.js` and by the home page's load function.
- Each dev app page is prerendered.

### Scores

- `api/maze-score` and `api/notfound-score` keep today's request and response shapes:
  - `GET` → current best / top
  - `POST` with JSON → submit, then return the updated best / top
- **Netlify:** if `typeof Bun === "undefined"`, the handler returns `503` before touching storage.
- **Bun:** otherwise the handler dynamic-imports `maze-scores.js` or `notfound-scores.js`.
- Both SQLite modules (and `bun:sqlite`) are kept out of the Netlify function bundle. They are marked external, and the code path is only reached on Bun.
- The 1 KB body cap stays: a larger body counts as no input. So does malformed JSON.
- `SCORES_DIR` / `SCORES_DIR_OVERRIDE` keeps its current behaviour, so tests write to `data/.test/`.
- Both games already catch failed requests and play on, which covers the 503.
- The request handling lives in `src/lib/server/score-api.js` as plain functions that take a `Request` and a store (or `null` off Bun). The tests cover them without a server.
- The `+server.js` files only wire them to the store loader.

### 404 on Netlify

- adapter-netlify sends every path that has no prerendered file to its server function.
- That function renders `+error.svelte` with status 404, so the old `web/404.html` file has no direct replacement.

## Security

### Headers

- `src/lib/server/security-headers.js` holds the header list.
- `hooks.server.js` applies it to every response in dev and from server routes.
- `netlify.toml [[headers]]` applies the same list to static files.
- A test fails if the two drift apart.

### Content-Security-Policy

- SvelteKit adds an inline bootstrap script to each prerendered page, which `script-src 'self'` blocks.
- `kit.csp` runs in `mode: 'hash'` with only `script-src: ['self']` set. SvelteKit then writes a `<meta http-equiv="Content-Security-Policy">` on each prerendered page that includes the bootstrap script's hash.
  - Only `script-src` goes in `kit.csp`. If `style-src` were there too, SvelteKit would add hashes to it, which switches off `'unsafe-inline'` and breaks every `style="…"` attribute.
- The header CSP's `script-src` becomes `'self' 'unsafe-inline'`.
  - It can't simply be removed. Without it, scripts fall back to `default-src 'self'`, which still blocks the bootstrap.
  - The browser enforces both policies, so a script has to pass both. The header allows inline scripts in general, and the meta tag narrows that to the one hashed bootstrap. The net effect is the same as today's `'self'`-only rule plus that one script.
  - The build test checks that every prerendered page carries the meta CSP, and that its `script-src` has no `'unsafe-inline'`. That makes sure no page relies on the header alone.
- Every other directive stays in the header unchanged.
- `frame-ancestors` can't be set from a `<meta>` CSP, but it stays in the header, and `X-Frame-Options: DENY` stays as well.
- `style-src 'self' 'unsafe-inline'` is unchanged. Svelte's scoped styles are emitted to CSS files, and inline `style=` attributes already rely on `'unsafe-inline'`.

### Request guards

- **Host.** Today's `isLocalHost` check guards against DNS rebinding. Vite's dev server does the same job by rejecting unknown `Host` headers (`server.allowedHosts`).
- **Cross-origin writes.** Today's `isForeignWrite` check moves to `hooks.server.js`. A non-`GET`/`HEAD` request to `/api/*` whose `Origin` header is present and differs from the request URL's own origin (or doesn't parse) gets `403`. One rule covers dev (`http://localhost:4321`) and production. SvelteKit's built-in `csrf.checkOrigin` covers only form content types, not JSON.
- **Bind address.** The dev server binds to `127.0.0.1` only (`server.host`), as `server.js` does now.

## Testing

All tests run under `bun test`, colocated as `*.test.js`.

- **Moved unchanged:** `maze-wilson.test.js`, `maze-move.test.js`, `notfound-game-logic.test.js`, `app-status.test.js`, `maze-scores.test.js`.
- **Rewritten:** `app-card.test.js` and `app-detail.test.js` now test the extracted data-shaping functions. `html.test.js` is deleted along with `html.js`.
- **Endpoint tests** call the exported `GET` and `POST` handlers directly with `Request` objects. They cover:
  - score validation and the body cap
  - malformed JSON
  - the 503 path when not on Bun (simulated by injecting the runtime check)
  - the appstore endpoint serving cached data
- **Hook tests** cover:
  - headers on responses
  - the dev redirects
  - `403` for a cross-origin `POST`
  - same-origin `POST` passing through
- **Build test** (slow; runs `vite build` once in a `beforeAll`). It checks the prerendered output:
  - every expected route has an HTML file
  - each page has exactly one `<h1>`
  - required meta tags are present (title with `·`, description, canonical, OG set, favicon, theme-color), with the 404 and dev-app exceptions
  - there are no inline scripts other than SvelteKit's hashed bootstrap, and no `on…=` attributes
  - the sitemap lists every public page
  - the header CSP in `netlify.toml` matches `security-headers.js`
- `src/test-setup.js`, `.env.test` and `bunfig.toml` keep isolating score databases under `data/.test/`.

Before merging, check by hand on a Netlify deploy preview: click through every route listed under Success criteria and check the browser console for CSP violations.

## Scripts

| Script | Command |
|---|---|
| `dev` | `bunx --bun vite dev` (binds `127.0.0.1:4321`) |
| `build` | `bunx --bun vite build` |
| `preview` | `bunx --bun vite preview` |
| `test` | `bun test` |
| `format` / `format:check` | unchanged commands; `prettier-plugin-svelte` makes them cover `.svelte` files. New `.svelte` files are formatted as they're written. |

`netlify.toml` `[build]`: `command = "bun run build"`, and `publish` set to whatever adapter-netlify requires (`build`).

## Documentation

Rewrite `CLAUDE.md`, `README.md` and `.claude/rules/*`:

- `server.md` → endpoints, hooks, `src/lib/server`, Node compatibility for `appstore.js`
- `client-js.md` → components, actions, logic/DOM separation
- `css.md` → global vs scoped, layout groups
- `html-pages.md` → `Seo` component, routes, sitemap
- `testing.md` → endpoint, hook and build tests
- `general.md` → lift "no frameworks", keep Svelte/SvelteKit as the only framework

## Risks

- **adapter-netlify bundling `bun:sqlite`.** If marking it external isn't enough, the fallback is to resolve the score modules through a path the bundler can't follow statically. The plan's first spike checks this before any page work starts.
- **Visual drift.** Moving global CSS into scoped styles can change specificity. Mitigation: port one page at a time and compare it side by side against `main` running on `bun server.js`.
- **Bun + Vite compatibility.** If `bunx --bun vite` misbehaves, dev can run Vite on Node. The score endpoints then return 503 in dev too, and that's acceptable.

## Out of scope

- Redesigns, copy edits and new pages.
- Persistent production scores (for example Netlify Blobs).
- TypeScript conversion.
- Formatting files that this work doesn't touch.
