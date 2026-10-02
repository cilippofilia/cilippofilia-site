---
paths:
  - "server.js"
  - "src/server/**"
  - "src/build/**"
  - "netlify/**"
  - "netlify.toml"
  - "data/**"
---

# Server, build and deploy rules

## Module style

- `server.js`, `src/server/*.js` and `src/build/*.js` are **CommonJS** (`require` / `module.exports`) using
  `node:http`, `fs`, `path`. Keep new server modules the same; don't mix ESM into them.
- `src/server/appstore.js` is also imported by the Netlify Function `netlify/functions/appstore-apps.mjs`, which runs
  on Netlify's Node runtime, **not Bun**. Never use Bun-only APIs (`Bun.file`, `bun:sqlite`, `Bun.$`) in
  `appstore.js` or anything it requires.
- `bun:sqlite` is fine in the score modules, since they are local-only and never deployed.
- Resolve paths from `ROOT` / `PUBLIC_DIR` / `DATA_DIR` in `static.js` (based on `__dirname`), never `process.cwd()`.

## Routing (`src/server/router.js`)

- `route()` is an ordered chain: `REDIRECTS` → JSON APIs → `/apps.json` → favicon → `STATIC_DIRS` → `PAGES` →
  custom app folder → `app.html` template → 404. Put a new route in the right bucket instead of adding ad hoc checks,
  and keep the order meaningful.
- New top-level static folders must be opted in to `STATIC_DIRS`. Never serve arbitrary paths under `web/`.
- Any file served from a user-controlled path goes through `serveWithin()` (path traversal guard). Don't build file
  paths from the URL any other way.
- Use `send()` / `redirect()` / `serveFile()` from `static.js` so `Content-Type`, `Content-Length`,
  `Cache-Control` and HEAD handling stay consistent.
- JSON API handlers: parse the body in `try`/`catch`, treat a malformed body as "no input", and still return the
  current state with 200. Validate numbers (`Number.isFinite`, `Number.isInteger`, `> 0`) before persisting.
- `handleRequest` is the only entry point and must never let an exception escape. Keep the decode and route
  `try` blocks.
- `handleRequest` refuses (403) any request whose `Host` isn't a local hostname, and any non-GET/HEAD whose `Origin`
  is another site. That's what stops other web pages, or DNS rebinding, from writing to the score APIs. Don't remove
  it, and keep `readBody` capped (`MAX_BODY_BYTES`).
- The path is percent-decoded before routing, so the custom-app-folder branch only accepts a first segment matching
  `FOLDER_SEGMENT`. Never derive a directory from a decoded segment without a pattern check like that.

## Security headers

- `SECURITY_HEADERS` in `static.js` (CSP, nosniff, frame denial, ...) goes on every local response, and must equal
  the `[[headers]] for = "/*"` block in `netlify.toml`. A router test compares them, so change both together.
- A new external image, script or API host must be added to the CSP in both places, or the browser will block it.

## Matching Netlify change (required)

When you add, rename or remove a route in `router.js`, also update:

- `netlify.toml` `[[redirects]]` for fixed pages and redirects;
- `RESERVED_SLUGS` in `src/build/netlify.js` for any new reserved first path segment (new page, static dir, API);
- `netlify/functions/` if it's an API that should work in production.

Score APIs (`/api/notfound-score`, `/api/maze-score`) are deliberately local-only. Client code must tolerate them
failing.

## Persisted state

- New persisted state lives under `SCORES_DIR` (from `static.js`), never directly in `DATA_DIR`, so tests write to
  `data/.test/` and not to the real DBs.
- Add any new runtime files to `.gitignore`.

## `data/apps.json`

- Entry shape: `slug`, `name`, `tagline`, `description`, `platforms`, `status`, `icon`, `appStoreUrl`.
- `status` is one of `Beta`, `In development`, `Planning`, `Discovery`.
- Slugs must match `^[a-zA-Z0-9-]+$` and must not collide with reserved paths or a folder under `web/`.
- It's read fresh on every request; don't add caching.
