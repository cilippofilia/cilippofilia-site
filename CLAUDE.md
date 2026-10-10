# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Canary rule:** Start each reply to the user with the word "Billy", once per response, not per sentence or line. It does not apply to code, commit messages, or files you write. If you notice you've stopped doing this, the conversation context has degraded.

This is a SvelteKit site (Svelte 5, adapter-netlify, prerendered) run with Bun, not an Xcode project. The Swift/SwiftUI rules in the global `~/.claude/CLAUDE.md` don't apply here.

## Rules

Detailed conventions live in `.claude/rules/`. Follow them; they win over anything more general in this file.

- [`general.md`](.claude/rules/general.md): always loaded. Scope, copy style, git, iCloud conflict copies, and the two things kept in sync with Netlify by hand.
- [`server.md`](.claude/rules/server.md): hooks, `+server.js` endpoints, `src/lib/server/`, `netlify.toml`, `vite.config.js`, `data/`. Covers the Node-vs-Bun split, `bun:sqlite` loading, the CSP setup, redirects and persisted state.
- [`client-js.md`](.claude/rules/client-js.md): components and browser JS under `src/lib/` and `src/routes/`. Covers runes, prerender-safe components, the `init…(root, { signal })` pattern, actions, reduced motion and failing quietly.
- [`css.md`](.claude/rules/css.md): `src/lib/styles/` and component styles. Covers tokens, Liquid Glass (never stacked, with fallbacks), global page CSS, the error page's `?url` stylesheets, and dark only.
- [`pages.md`](.claude/rules/pages.md): routes and `src/app.html`. Covers `<Seo>`, one `<h1>`, sitemap lists, landing page and privacy URL rules, and accessibility.
- [`testing.md`](.claude/rules/testing.md): `*.test.js` and test setup. Covers `bun:test`, colocated tests, endpoint and hook tests, the build-output test, and score DB isolation.

Rules with `paths:` frontmatter load only when you work on matching files. When you learn a new convention, add it to the matching rule file, not here.

## Bun

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.
- Vite is run under Bun (`bunx --bun vite …`), which is what lets the score endpoints use `bun:sqlite` in dev.

## APIs

- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- Prefer `Bun.file` over `node:fs` in new standalone scripts. Code under `src/` uses `node:fs`/`node:path`, because the build and the Netlify Function run it on Node.
- Exception: `src/lib/server/appstore.js` also runs on Node inside the Netlify Function, so it gets no Bun-only APIs. `bun:sqlite` is only loaded through `src/lib/server/score-stores.js`.

## Commands

- `bun run dev` — `vite dev` under Bun on `http://localhost:4321` (bound to `127.0.0.1`), with hot reload. Open `http://localhost:4321/home`.
- `bun run build` — `vite build`: prerenders every page into `build/` and writes the Netlify Function into `.netlify/`
- `bun run preview` — serve the last build locally (prerendered pages only get their security headers on Netlify)
- `bun run start` — build, then preview
- `bun test` — run all tests (uses `bun:test`, colocated as `*.test.js`). Includes `src/build-output.test.js`, which runs a full build, so expect a couple of seconds.
- `bun test src/lib/apps/feed.test.js` — run a single test file
- `bun run format` / `bun run format:check` — Prettier with `prettier-plugin-svelte` (`.prettierrc`: 120 columns, es5 trailing commas). Most older files aren't formatted yet, so formatting the whole repo is a separate, deliberate change; don't let it ride along in an unrelated diff
- Tests write their score databases to `data/.test/` instead of the real `data/*.db`: `bun test` auto-loads `.env.test`, which sets `SCORES_DIR_OVERRIDE` (read by `src/lib/server/paths.js` as `SCORES_DIR`), and the `bunfig.toml` preload `src/test-setup.js` wipes that folder at the start of each run. For manual dev checks that post scores, run `SCORES_DIR_OVERRIDE=data/.test bun run dev`.

There is no lint/typecheck script configured; `tsconfig.json` (extending `$app/tsconfig`) exists for editor IntelliSense over the JS.

## Architecture

A SvelteKit app with every page prerendered to static HTML, plus a few on-demand endpoints. SvelteKit 3 keeps its config in `vite.config.js` (adapter, `csp`); there is no `svelte.config.js`. Shared code is imported as `#lib/...` (a `package.json` subpath import for `src/lib/`; `$lib` no longer exists).

- **`src/app.html`** — the document shell. `<body data-sveltekit-reload>` makes every link a full page load, like the old multi-page site, so each page's global CSS and window listeners start fresh.
- **Routes (`src/routes/`)** — two layout groups:
  - `(site)/` — `home`, `games` (the maze, Skate Run and the 404 game), `privacy`, `terms`, `style-guide`, and `[slug]` (one prerendered page per valid `data/apps.json` entry). Its `+layout.svelte` imports the global CSS (`tokens` → `base` → `layout` → `components`) and renders `Header`/`Footer`.
  - `(landing)/` — `drinko`, `iterly`, `itswritten`, `nine-tiles-puzzle`, each with a `privacy-policy/` page. These import only `landing.css` and their own `src/lib/styles/apps/<app>.css`. Privacy pages have `csr = false` and prerender to `<app>/privacy-policy.html`; `src/hooks.js` `reroute` maps that `.html` URL onto the route in dev.
  - `+error.svelte` — the 404 page with the whack-a-broken-link game. It loads on every page as SvelteKit's fallback, so it links its stylesheets via `?url` imports rather than importing CSS.
  - `api/appstore-apps`, `api/maze-score`, `api/notfound-score`, `api/runner-score` — `+server.js` endpoints with `prerender = false`, delegating to `src/lib/server/`.
  - `sitemap.xml/+server.js` — prerendered from `src/lib/site-pages.js`.
- **`src/hooks.server.js`** — dev redirects (`/` → `/home`, `/app-store` → `/home#apps`), `/favicon.ico`, a cross-origin write guard on `/api/*`, and the security headers (`src/lib/server/security-headers.js`).
- **`src/lib/server/`** — `appstore.js` fetches the developer's App Store apps live from Apple's iTunes lookup API (`APPLE_DEVELOPER_ID`), cached 10 minutes with a stale-cache fallback; `CUSTOM_APP_PAGES` makes a published app's card link to its landing page. `maze-scores.js` / `notfound-scores.js` / `runner-scores.js` are the `bun:sqlite` stores under `SCORES_DIR`; `score-stores.js` loads them only on Bun; `score-api.js` holds the endpoint logic.
- **`src/lib/apps/`** — data helpers: `dev-apps.js` (the `apps.json` import, slug validation, `DEV_SLUGS_TO_SHOW`), `feed.js` (the home page's App Store block), `app-status.js`, `names.js`, `meta.js`, `landing-apps.js`.
- **`src/lib/components/`** — `Seo`, `Header`, `Footer`, `PullToRefresh` (the site's own touch pull-to-refresh; Safari's native one is switched off on site pages because its overscroll broke the intro's fixed hero image), `FloatingIcons` (animejs drift), `AppsSection`/`AppCard`/`FeaturedStrip`, `AppDetail`, `MazeSection`, `RunnerSection`, `NotFoundGame`, `LandingCountdown`, `JourneySection` (the home page's "How I got here" map, date pills and stop cards).
- **`src/lib/journey/`** — the journey section: `journey.js` shapes `data/journey.json` into map markers and date pills (tested), `europe-map.js` is the pixel Europe as plain data, `journey-map.js` is the canvas map as `initJourneyMap(root, { signal, … })`, and `carousel-loop.js` is the looping carousel's arithmetic behind `src/lib/actions/carousel.js`.
- **`src/lib/games/`, `src/lib/intro/`** — the maze, maze explainer, skate runner, 404 game and intro flip are imperative modules exposed as `init…(root, { signal })`, called from `onMount` on static markup; their pure logic (`maze-wilson.js`, `maze-move.js`, `runner-logic.js`, `notfound-game-logic.js`) is tested separately. The runner's pixel sprites are hand-editable strings in `runner-sprites.js`.
- **CSP** — `csp` in `vite.config.js` (hash mode, `script-src` only) puts a `<meta>` CSP with the bootstrap script's hash on every prerendered page; the header CSP allows `'self' 'unsafe-inline'` scripts and the browser enforces both, so only that hashed script runs.

Design tokens and the Liquid Glass visual language (translucent blurred cards, hairline borders, `--glass-*` custom properties) live in `src/lib/styles/tokens.css`; see `/style-guide` for a live reference.

Adding an in-development app page is just a `data/apps.json` entry. Adding a landing page is a new `(landing)/<app>/` folder plus its slug in `LANDING_APPS` and `src/hooks.js`; see `README.md`.

## Netlify

`netlify.toml` runs `bun run build` and publishes `build/`. adapter-netlify puts the prerendered pages and `static/` there, and everything not prerendered (`/api/*`, and unknown paths, which render the 404 page with status 404) into one Netlify Function.

- `[[redirects]]` in `netlify.toml` repeat `REDIRECTS` from `src/hooks.server.js`, plus the `/favicon.ico` rewrite. Prerendered pages never reach the hook, so a redirect only in the hook works locally and not in production.
- `[[headers]]` repeat `SECURITY_HEADERS`; `src/build-output.test.js` fails if they drift.
- `/api/maze-score`, `/api/notfound-score` and `/api/runner-score` answer 503 on Netlify (no Bun, so no SQLite). The games catch it and play on without saving scores.
