# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Commands

- `bun run dev` — build the JS bundle, then run the server with `--watch` (restarts on file changes)
- `bun run build` — bundle `src/client/floating-icons.js` into `web/js/floating-icons.bundle.js` (minified); run this after editing that file, since the bundle is gitignored and not auto-rebuilt by `bun server.js` (Netlify builds it on deploy)
- `bun run start` — build once, then run the server without `--watch`
- `bun server.js` — run the server directly, no rebuild (fine if you haven't touched `src/client/`)
- `bun test` — run all tests (uses `bun:test`, colocated as `*.test.js` next to the code they cover, e.g. `src/server/router.test.js`, `web/js/app-card.test.js`)
- `bun test src/server/router.test.js` — run a single test file
- Tests write their score databases to `data/.test/` instead of the real `data/*.db`: `bun test` auto-loads `.env.test`, which sets `SCORES_DIR_OVERRIDE` (read by `src/server/static.js` as `SCORES_DIR`), and the `bunfig.toml` preload `src/test-setup.js` wipes that folder at the start of each run so tables never carry over between runs. Keep new persisted state behind `SCORES_DIR` so tests can't touch the files a running server reads.
- The server binds to `127.0.0.1` only and listens on port 4321 by default (`PORT=xxxx bun server.js` to change it). Open `http://localhost:4321/home`.

There is no lint/typecheck script configured; `tsconfig.json` exists for editor IntelliSense over the JS (`allowJs`, `checkJs` not set) rather than a build step.

## Architecture

This is a hand-rolled multi-page site (no framework, no bundler-driven SPA) with two ways to serve it: a local-only Node/Bun HTTP server for development, and a static Netlify deploy (see "Netlify" below). Locally, two request-handling layers matter:

- **`server.js`** — just binds `http.createServer` to `127.0.0.1:4321` and delegates to `handleRequest`. Deliberately local-only (see the file's own comment) — not a public-facing config.
- **`src/server/router.js`** — the actual routing table (`handleRequest` → `route`). It's structured as a chain of checks, roughly in this order: hardcoded redirects (`REDIRECTS`) → JSON APIs (`/api/appstore-apps`, `/api/notfound-score`, `/api/maze-score`, `/apps.json`) → `favicon.ico` → whitelisted static directories (`STATIC_DIRS`: `/css/`, `/js/`, `/assets/`) → exact page routes (`PAGES`: `/home`, `/style-guide`, `/privacy`, `/terms`) → custom multi-file app sites (any first path segment that is a folder under `web/` with its own `index.html`) → generic app template (`web/app.html`) for any single-segment slug present in `data/apps.json` → `404.html`. When adding a new route, decide which bucket it belongs to rather than adding ad hoc logic — the ordering is meaningful (e.g. `STATIC_DIRS` opt-in is what stops arbitrary folders under `web/` from being exposed).
- **`src/server/static.js`** — low-level file serving: MIME types, cache-control (`no-cache` for HTML/JSON, 5s for everything else), and `serveWithin`, which resolves a path against a base directory and rejects anything that escapes it (path traversal guard) — used both for the whitelisted static dirs and for custom app-site folders.
- **`src/server/appstore.js`** — fetches the developer's real App Store apps live from Apple's iTunes lookup API (`APPLE_DEVELOPER_ID`), cached in-memory for 10 minutes, with a stale-cache fallback on fetch failure. `CUSTOM_APP_PAGES` (keyed by App Store track id) is what makes a published app's card link to its own local page under `web/<slug>/` instead of out to Apple.
- **`src/server/dev-apps.js`** — reads `data/apps.json` fresh on every call (cheap, small file) to back "in development" app pages; `hasDevApp(slug)` gates the generic `web/app.html` template route.
- **`src/server/notfound-scores.js`** — persists the 404 page's whack-a-broken-link minigame high score in a `bun:sqlite` DB at `SCORES_DIR/notfound-scores.db` (normally `data/`). It's a single shared best score, not per-visitor, by design.
- **`src/server/maze-scores.js`** — same idea for the home page maze minigame: a shared leaderboard of winning runs (time, then moves) in `SCORES_DIR/maze-scores.db`.

Client side (`web/`) is static HTML/CSS/vanilla JS, no build step for most of it — `web/index.html` is the landing page pulling both the live App Store feed (`web/js/apps-feed.js`) and `data/apps.json` into shared card components (`web/js/app-card.js`). The one exception is `src/client/floating-icons.js`, which is bundled via `bun build --minify` into the gitignored `web/js/floating-icons.bundle.js` (see `bun run build`) instead of being loaded straight from source or a CDN.

Design tokens and the Liquid Glass visual language (translucent blurred cards, hairline borders, `--glass-*` custom properties) live in `web/css/tokens.css`; see `/style-guide` (`web/style-guide.html`) for a live reference. CSS load order matters: `tokens.css` → `base.css` → `layout.css` → `components.css` → (page-specific, e.g. `intro.css`).

Some apps (`web/nine-tiles-puzzle/`, `web/drinko/`, `web/iterly/`, `web/itswritten/`) are full custom multi-file landing pages with their own CSS/JS/assets, served verbatim by the router's custom-app-site branch — they don't go through `app.html` or the shared `web/css`/`web/js`.

`svelte` and `bun-plugin-svelte` are in `package.json` but unused — leftovers from an abandoned Svelte migration whose plan and prototype worktree have been deleted. Whether to drop them is an open item in `TODO.md`.

Adding a new in-development app page or a custom app landing page doesn't require touching `server.js`/`router.js` — see `README.md` for the exact steps (`data/apps.json` entry, or a new folder under `web/`).

## Netlify

`server.js` doesn't run on Netlify; `netlify.toml` recreates the router for a static deploy of `web/`:

- **Build** (`bun run build && bun src/build/netlify.js`) — bundles floating-icons, then `src/build/netlify.js` copies `data/apps.json` to `web/apps.json` and writes `web/_redirects` with one `app.html` rewrite per in-development slug (mirroring `hasDevApp`). Both outputs are gitignored. Unknown paths get `web/404.html` from Netlify itself.
- **Fixed routes** (`/` → `/home`, `/app-store`, `/home`, `/style-guide`, `/privacy`, `/terms`, `/favicon.ico`) are `[[redirects]]` in `netlify.toml`.
- **`/api/appstore-apps`** is the Netlify Function `netlify/functions/appstore-apps.mjs`, reusing `src/server/appstore.js`.
- **Not deployed:** `/api/notfound-score` and `/api/maze-score` (they need local `bun:sqlite` files). The games catch the failed request and play on without saving scores.
- Everything under `web/` is published — the `STATIC_DIRS` opt-in only protects the local server.

When adding or changing a route in `router.js`, make the matching change in `netlify.toml` or `src/build/netlify.js`, or it will work locally and be missing on Netlify.
