---
paths:
  - "src/hooks.js"
  - "src/hooks.server.js"
  - "src/routes/**/+server.js"
  - "src/lib/server/**"
  - "netlify.toml"
  - "vite.config.js"
  - "data/**"
---

# Server, build and deploy rules

## Module style

- Everything is ES modules (`package.json` has `"type": "module"`). Import shared code with the `#lib/...` subpath
  alias (it maps to `src/lib/`; SvelteKit 3 has no `$lib`), or with relative paths inside `src/lib/`. Bun resolves
  both, so tested files can use either.
- `src/lib/server/appstore.js` also runs inside the Netlify Function on Node, **not Bun**. Never use Bun-only APIs
  (`Bun.file`, `bun:sqlite`, `Bun.$`) in it or anything it imports.
- `bun:sqlite` is only ever loaded by `maze-scores.js` / `notfound-scores.js` / `runner-scores.js`, through a
  non-literal dynamic `import()` so neither Vite nor Netlify's bundler follows it, and those modules are only ever
  loaded by `score-stores.js`, which returns `null` when not on Bun (or for a name not in its `STORES` map). Keep it
  that way.
- Resolve paths from `process.cwd()` (see `src/lib/server/paths.js`), not `__dirname`, which stops pointing into
  `src/` once Vite has bundled the server code.

## Endpoints (`src/routes/**/+server.js`)

- Keep them thin: export `prerender = false` and hand the request to a function in `src/lib/server/` that takes a
  `Request` (and any store) and returns a `Response`. That function is what gets tested.
- JSON handlers treat a malformed or oversized body (`MAX_BODY_BYTES`) as "no input" and still answer 200 with the
  current state. Validate numbers (`Number.isFinite`, `Number.isInteger`, `> 0`) before persisting.
- Score endpoints answer `503` JSON when there is no store (Netlify). Client code must treat any non-OK response as
  "no scores" and play on.
- `/api/appstore-apps` keeps its cache and stale fallback in `appstore.js`, and sends `appstoreCacheControl(apps)`
  so an empty cold-start result is never cached by the CDN.

## Hooks

- `src/hooks.server.js` `handle` answers the dev redirects and `/favicon.ico`, refuses (403) any non-GET/HEAD to
  `/api/*` whose `Origin` differs from the request's own origin, and puts `SECURITY_HEADERS` on every response it
  handles. The CSP is **appended**, not set, so SvelteKit's own hashed policy on on-demand pages survives alongside
  it. Don't weaken the origin check; SvelteKit's built-in CSRF check only covers form content types.
- `src/hooks.js` `reroute` maps the landing pages' old `/<app>/privacy-policy.html` URLs onto their routes. App
  Store listings link to those URLs; keep them working.

## Security headers and CSP

- `SECURITY_HEADERS` in `src/lib/server/security-headers.js` must equal the `[[headers]] for = "/*"` block in
  `netlify.toml`. `src/build-output.test.js` compares them, so change both together.
- `csp` in `vite.config.js` sets only `script-src`, in hash mode, which SvelteKit writes as a `<meta>` tag on every
  prerendered page. Never add `style-src` there: SvelteKit would hash it and switch off `'unsafe-inline'`, breaking
  every `style="..."` attribute. The header's `script-src 'self' 'unsafe-inline'` is safe only because that meta
  policy narrows it; the build test checks every page carries it.
- A new external image, script or API host must be added to the CSP in both header places.

## Redirects

- `REDIRECTS` in `src/hooks.server.js` must match the `[[redirects]]` in `netlify.toml` (`/` → `/home`,
  `/app-store` → `/home#apps`). Prerendered pages on Netlify never reach the hook, so a redirect missing from
  `netlify.toml` works locally and not in production.

## Persisted state

- New persisted state lives under `SCORES_DIR` (`paths.js`), created with `ensureScoresDir()` when first used, so
  tests write to `data/.test/` and importing a module never touches the filesystem.
- Dev checks that POST scores should run the server with `SCORES_DIR_OVERRIDE=data/.test` so they don't land in the
  real leaderboard.
- Add any new runtime files to `.gitignore`.

## `data/apps.json`

- Entry shape: `slug`, `name`, `tagline`, `description`, `platforms`, `status`, `icon`, `appStoreUrl`.
- `status` is one of `Beta`, `In development`, `Planning`, `Discovery`.
- It's imported at build time (`src/lib/apps/dev-apps.js`): each valid entry is prerendered to `/<slug>`, so a change
  shows up after a restart of `vite dev` or the next deploy. Slugs must match `SLUG_PATTERN` and must not be in
  `RESERVED_SLUGS` (fixed routes plus `LANDING_APPS`); `validDevApps` drops any that are.

## `data/journey.json`

- The home page's "How I got here" stops, in journey order, imported at build time by `src/lib/journey/journey.js`.
  Stop shape: `id` (unique), `place`, `coords` (`[lat, lon]`, inside the map's bounds in `europe-map.js`), `year`
  (`"2019"` or `"2019–2020"`), `title`, `body`, `photos`.
- A photo is `src` (or `icon` for an app icon slide), `alt`, `width`, `height`, and optionally `caption`, `credit`
  (`{ name, url? }`, https only), `place` + `coords` (a trip: the stop is also listed under that place's marker),
  `natural` (keeps its own shape instead of the 3:2 frame; for screenshots) and `still` (a still first frame for an
  animated photo, shown when motion is turned down).
- Photos live in `static/assets/journey/` as WebP cropped to 3:2, at most 1200×800, unless `natural`.
  `width`/`height` are the file's real size. Back-to-back stops in the same place share a date pill; places closer
  than `NEAR` share a map marker.
- `src/lib/journey/journey.test.js` checks the real file: unique ids, every place on the map, every photo present
  with alt text and a size, https credit links.
