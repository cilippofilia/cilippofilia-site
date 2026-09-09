# cilippofilia.dev — site review (2026-09-09)

Reviewed on branch `design-polish` at commit `f7052b0` plus the uncommitted
card-actions work. The site was run locally (`node server.js`, `bun server.js`),
every route was probed with curl, and every file under `web/`, `src/`, `data/`
and the docs folder was read.

This document is the **spec** for
[2026-09-09-site-improvements.md](../plans/2026-09-09-site-improvements.md).
It lists what is wrong or weak, why it matters, and what "fixed" means. The
plan turns each item into tasks.

## What the site is

A local-only (127.0.0.1) portfolio hub for Filippo Cilia's iOS apps:

- `/home` — intro animation, profile card, and two app grids. The "Published"
  grid is fetched live from Apple's iTunes lookup API; "In development" comes
  from `data/apps.json`.
- `/<slug>` — generic template (`web/app.html`) for in-development apps.
- `/drinko/`, `/iterly/`, `/itswritten/`, `/nine-tiles-puzzle/` — four
  standalone marketing pages, each with its own `style.css`, `app.js`,
  `assets/` and `privacy-policy.html`.
- `/style-guide` — a design reference page.
- `server.js` + `src/server/*` — hand-rolled `node:http` router, no deps.

What already works well and must be preserved: the dark Liquid-Glass look,
the scroll-driven intro flip (`web/js/intro-flip.js`), reduced-motion and
reduced-transparency fallbacks, the path-traversal guard in `serveWithin`,
the live App Store feed with stale-cache fallback, and the four `bun test`
tests for `app-card.js`.

## Findings

Severity: **P0** breaks the site, **P1** wrong or misleading today,
**P2** quality/maintainability, **P3** nice to have.

### P0 — A malformed URL kills the server

`server.js:56` calls `decodeURIComponent(url.pathname)` with no try/catch.
`curl http://127.0.0.1:4321/%` throws `URIError: URI malformed` inside the
request handler; Node treats it as an uncaught exception and the **process
exits**. Verified: after that request every following request gets
connection refused. Any handler exception has the same effect because the
callback is `async` and nothing awaits it.

Fixed means: a malformed path returns HTTP 400, any unexpected error returns
500, and the process keeps serving. A test proves it.

### P1 — Unknown slugs return HTTP 200

`/nope`, `/anything-at-all` return `200` with `web/app.html`, which then
renders "Nothing here yet" client-side. Browsers, link checkers and
bookmarks all see a successful page. Fixed means: a slug with no entry in
`data/apps.json` and no custom folder returns a real `404` page.

### P1 — Documentation and comments point at a folder that no longer exists

The public folder was renamed from `public/` to `web/` but the README's
"Project layout", "Run it", and "Custom app pages" sections, plus comments
in `server.js` (lines 4–10, 37, 42, 92), `src/server/appstore.js:12` and
`web/css/intro.css:3` still say `public/`. An orphan `public/favicon.svg`
(byte-identical to `web/assets/favicon.svg`) is left behind and nothing
serves it. The README also describes the site as "light, SF Pro" while
`tokens.css` is dark-only (`color-scheme: dark`), and tells the reader to run
`node server.js` while `CLAUDE.md` says to default to Bun (`bun server.js`
works; verified).

### P1 — `package.json` scripts and dependencies do not match the code

`animejs@4`, `svelte@5` and `bun-plugin-svelte` are listed as dependencies
but nothing on this branch imports them. The home page instead loads
`animejs@3.2.2` from jsdelivr, so on a machine without internet (the whole
point of a local-only site) the floating icons silently do not drift. There
are no `scripts` at all, so `bun run start`, `bun run test`, `bun run format`
do not exist, and `prettier` is a devDependency with no config file.

The Svelte packages belong to the `svelte-migration` branch / worktree, whose
last commit (2026-09-06, "port the style guide page") predates the three
landing pages added on `main`. That branch is now stale. This review does
not decide its fate; see "Decisions for the owner".

### P1 — Unescaped strings are written into `innerHTML`

`web/js/app-card.js` and the inline script in `web/app.html` interpolate
`name`, `tagline`, `description`, `status`, `platforms` and `icon` straight
into template strings. The published values come from Apple's API (a third
party) and the dev values from `apps.json`. A `<` or `"` in an App Store
description breaks the card markup; a crafted description is an XSS vector.
Fixed means: every interpolated value is escaped for text and for attribute
context, with a test.

### P2 — Static responses carry no caching or length headers

`src/server/static.js` sends only `Content-Type`. No `Cache-Control`, no
`Content-Length`, and `HEAD` requests get a full body. Every reload
re-downloads the 564 KB `profile-clear.png` and the five icon thumbnails.

### P2 — 10 MB of unreferenced images in the repo and served tree

`web/assets/app-icons/*.png` (five 1024×1024 files, 9.9 MB total) are not
referenced by any HTML, CSS or JS; only the `thumb/` copies are used. The
four landing pages each serve a 1024×1024 `assets/icon.png` (116–764 KB) to
render at 132 px (264 px at 2×) and 28 px.

### P2 — Duplicated client code

- `web/app.html` re-implements `badgeClass` and `isImageIcon` inline instead
  of importing them from `web/js/app-card.js`, and its rendering has no
  tests because it lives in an inline `<script>`.
- `web/drinko/app.js`, `web/iterly/app.js`, `web/itswritten/app.js` are
  byte-identical (20 lines of IntersectionObserver reveal), and the same 20
  lines open `web/nine-tiles-puzzle/app.js`.
- The four landing `style.css` files are ~480–555 lines each and differ only
  in the `:root` token blocks, the decorative-float class name
  (`.glass` / `.mark` / `.piece` with matching `--glass-*` / `--mark-*` /
  `--piece-*` custom properties), two bloom gradient colours, two button
  shadows, and (for 9 Tiles only) the countdown section. About 1,400 lines
  of the ~2,000 are copies.

### P2 — Page metadata is thin and pages do not link to each other

- `web/index.html` and `web/app.html` both use the title `cilippofilia.dev`.
  App template pages only get a real title after JS runs.
- No page has Open Graph / Twitter card tags or a `<link rel="canonical">`.
- The four landing pages have no link back to the hub; the hub's header nav
  has only "Home" and "App Store".
- Privacy pages link to `index.html` literally, so the address bar shows
  `/drinko/index.html` after "Back home".

### P2 — The style guide describes a different site

`/style-guide` is a self-contained **light** page with its own `--sg-*`
tokens (white background, `#0071e3` blue). The live site is dark with
`--accent: #2997ff` and Liquid-Glass surfaces defined in
`web/css/tokens.css`. The reference and the product have diverged, so the
guide cannot be used to check the product.

### P3 — Small things

- `.worktrees/` is present on disk (gitignored, fine) but the stale
  `svelte-migration` worktree inside it should be pruned or rebased.
- `nav.js`'s copyright year and the four landing footers are hard-coded
  "2026".
- `DEV_SLUGS_TO_SHOW` in `apps-feed.js` filters `apps.json` down to `the-relay`,
  and `apps.json` now contains only `the-relay`. Documented behaviour, so
  left alone.
- 9 Tiles Puzzle's countdown target `2026-09-28` is hard-coded in HTML while
  the App Store feed also knows the release date. Acceptable for a static
  page; noted only.

## Decisions for the owner (not made by the plan)

1. **Svelte migration.** The `svelte-migration` branch is two commits in and
   already behind `main`. Options: rebase it after this plan lands, or delete
   the branch and the `svelte`/`bun-plugin-svelte` dependencies. The plan
   keeps those two packages untouched so either choice remains open, and it
   does adopt the `animejs@4` package that the migration spec also wanted.
2. **Deployment.** Everything binds to 127.0.0.1 by design. If the site is
   ever meant to be public, the cache headers and 404 work in this plan
   carry over; the server would still need TLS, compression and a process
   manager, which are out of scope here.

## Definition of done for the whole plan

- `bun test` passes with server routing tests, escaping tests, and the app
  detail renderer tests added.
- `curl -i http://127.0.0.1:4321/%` returns 400 and the server keeps running.
- `curl -i http://127.0.0.1:4321/no-such-app` returns 404.
- `curl -I http://127.0.0.1:4321/css/base.css` shows `Cache-Control` and
  `Content-Length`.
- No `public/` reference remains: `grep -rn "public/" README.md server.js src web/css` prints nothing.
- `web/index.html` has no `cdn.jsdelivr.net` script; icons still drift.
- `du -sh web/assets/app-icons` is under 700 KB.
- The three identical `app.js` files are gone; every landing page loads
  `/js/reveal.js`.
- Every page has a distinct `<title>`, `og:title`, `og:description`,
  `og:image` and canonical link, and every landing page links to `/home`.
