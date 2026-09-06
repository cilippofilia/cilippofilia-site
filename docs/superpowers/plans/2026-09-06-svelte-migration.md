# Svelte migration + Bun compile pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite cilippofilia.dev's pages from hand-rolled HTML + vanilla-JS DOM manipulation into Svelte 5 components, served through `Bun.serve()` with HTML imports and `bun-plugin-svelte`, replacing the current hand-rolled `node:http` static server.

**Architecture:** Each page becomes a small `.html` entry (head meta/links + one `<script type="module">` that mounts a root Svelte component) plus a `.svelte` root component under `web/components/pages/`, composed from shared components under `web/components/`. `server.js` becomes a `Bun.serve()` app whose routes are these HTML imports plus a handful of small static/API routes carried over from today's server. Global CSS stays exactly as it is today, linked by absolute path from each page's `<head>`.

**Tech Stack:** Bun 1.3.14, Svelte 5.57.0, `bun-plugin-svelte` 0.0.6, `animejs` 4.5.0. Plain JavaScript throughout (no TypeScript in `.svelte` files — see Global Constraints).

**Spec:** [docs/superpowers/specs/2026-09-06-svelte-migration-design.md](../specs/2026-09-06-svelte-migration-design.md)

## Global Constraints

- Bun 1.3.14, `svelte@5.57.0`, `bun-plugin-svelte@0.0.6`, `animejs@4.5.0` — exact versions already installed via `bun add`; don't upgrade mid-migration.
- No visual or behavioral redesign. This is a like-for-like port — markup, classes, and behavior must match the current site exactly except where a step explicitly says otherwise (there are exactly two such exceptions, called out in their tasks: `animejs` v3→v4 API, and dropping the generic "any folder under `public/` with its own `index.html`" routing mechanism in favor of explicit routes since there's only one such folder).
- `.svelte` files use plain JavaScript `<script>` blocks, not `<script lang="ts">`. `bun-plugin-svelte` 0.0.6 documents TypeScript-specific features (enums, namespaces) as unsupported, and the rest of this codebase (`server.js`, `src/server/*.js`) is plain JS with no TS anywhere despite `tsconfig.json` existing — introducing TS only inside `.svelte` files would be an inconsistent, unnecessary scope add.
- Assets and global CSS are served as literal static files at the same absolute paths they use today (`/assets/...`, `/css/...`, `/nine-tiles-puzzle/assets/...`, `/nine-tiles-puzzle/style.css`) via small wildcard routes in `server.js` — not re-imported as bundled ES modules. This mirrors the current server's `STATIC_DIRS` mechanism (just adapted to `Bun.serve()`/Fetch `Response`) and avoids relying on unconfirmed parts of Bun's HTML-asset-bundling pipeline (e.g. whether `<link rel="icon">` gets the same hash-and-copy treatment as `<link rel="stylesheet">`).
- Svelte 5 runes (`$state`, `$props`, `$effect`) for anything genuinely reactive; plain `onMount`-driven imperative DOM code (imported from `"svelte"`) for logic that's already imperative today (the intro-flip animation, the countdown timer) — rewriting that logic to be "more Svelte-idiomatic" is out of scope and risks introducing behavioral regressions in code whose correctness depends on exact timing/measurement order.
- Every `.svelte` file has one clear responsibility; shared chrome (header+footer) is composed via Svelte 5's `children` snippet prop, not copy-pasted per page.

---

## File Structure

```
bunfig.toml                              # new — registers bun-plugin-svelte for Bun.serve()
server.js                                # rewritten — Bun.serve() app (built up incrementally, task by task)
src/server/appstore.js                   # unchanged
src/server/static.js                     # rewritten — Fetch-API-based static helpers (Task 1)
data/apps.json                           # unchanged

web/
  css/                                   # unchanged global stylesheets
  assets/                                # unchanged site assets (+ favicon.svg restored, Task 1)
  nine-tiles-puzzle/
    assets/                              # unchanged puzzle-specific assets
    style.css                            # unchanged

  lib/
    app-card.js                          # pure helpers: splitName, isImageIcon, badgeClass (Task 2)
    app-card.test.js
    countdown.js                         # pure helper: countdownParts (Task 10)
    countdown.test.js

  components/
    SiteChrome.svelte                    # main-site header+footer wrapper (Task 4)
    AppCard.svelte                       # one app card (Task 3)
    AppsFeed.svelte                      # App Store feed + grids (Task 5)
    FloatingIcons.svelte                 # idle-drift floating icons (Task 6)
    ProfileCard.svelte                   # sidebar profile card (Task 7)
    IntroFlip.svelte                     # scroll-linked intro animation (Task 8)
    Countdown.svelte                     # release countdown display (Task 10)
    PuzzleChrome.svelte                  # puzzle-site nav+footer wrapper (Task 11)
    pages/
      StyleGuide.svelte                  # Task 1
      Home.svelte                        # Task 9
      AppTemplate.svelte                 # Task 10
      NineTilesPuzzle.svelte             # Task 11
      PrivacyPolicy.svelte               # Task 12

  pages/
    style-guide.html / style-guide.js    # Task 1
    home.html / home.js                  # Task 9
    app.html / app.js                    # Task 10
    nine-tiles-puzzle.html / .js         # Task 11
    nine-tiles-privacy.html / .js        # Task 12
```

Removed at the end (Task 13): `public/` (already staged for deletion — this plan finishes that), `web/index.html`, `web/app.html`, `web/style-guide.html`, `web/js/*.js`, `web/nine-tiles-puzzle/index.html`, `web/nine-tiles-puzzle/app.js`, `web/nine-tiles-puzzle/privacy-policy.html` — all superseded by the files above.

---

### Task 1: Pipeline bootstrap — bunfig.toml, Bun.serve() skeleton, and the style guide page

Proves the whole pipeline (bun-plugin-svelte + Bun.serve HTML imports) works end-to-end on the simplest page before porting anything with real behavior. The style guide page has no shared components and no JS at all today — just markup and an inline `<style>` block — so it's the lowest-risk first port.

**Files:**
- Create: `bunfig.toml`
- Create: `web/components/pages/StyleGuide.svelte`
- Create: `web/pages/style-guide.html`
- Create: `web/pages/style-guide.js`
- Rewrite: `src/server/static.js`
- Rewrite: `server.js`
- Modify: `web/assets/favicon.svg` (restore — currently missing from `web/`, see step 1)

**Interfaces:**
- Produces: `WEB_DIR` (absolute path to `web/`), `serveWithin(baseDir, pathname)` (async, returns a `Response`) — both exported from `src/server/static.js`, used by every later task's static routes.

- [ ] **Step 1: Restore the missing favicon**

`web/` was copied from `public/` before `public/favicon.svg` was moved to the top level (out of `public/assets/`). `web/assets/favicon.svg` doesn't exist, but `public/favicon.svg` does — and both `index.html` and `style-guide.html` link `/assets/favicon.svg`. Restore it so the port has something to serve:

```bash
cp public/favicon.svg web/assets/favicon.svg
```

- [ ] **Step 2: Write `bunfig.toml`**

```toml
[serve.static]
plugins = ["bun-plugin-svelte"]
```

- [ ] **Step 3: Write `src/server/static.js`**

```js
// Fetch-API static file helpers for Bun.serve(). Paths resolve from this
// file's own location, not process.cwd(), so `bun server.js` behaves the
// same whichever directory it is started from.

import { join, resolve, sep } from "node:path";

export const ROOT = resolve(import.meta.dir, "..", "..");
export const WEB_DIR = join(ROOT, "web");
export const DATA_DIR = join(ROOT, "data");

// Serve `relativePath` from inside `baseDir`, refusing anything that escapes
// it. Resolving first and then checking where the result landed is what
// actually contains a traversal attempt — stripping "../" from the URL only
// catches the obvious shapes.
export async function serveWithin(baseDir, relativePath) {
  const filePath = resolve(baseDir, "." + relativePath);
  if (filePath !== baseDir && !filePath.startsWith(baseDir + sep)) {
    return new Response("Forbidden", { status: 403 });
  }
  const file = Bun.file(filePath);
  if (!(await file.exists())) return new Response("404 Not Found", { status: 404 });
  return new Response(file);
}
```

- [ ] **Step 4: Write `web/components/pages/StyleGuide.svelte`**

Move `web/style-guide.html`'s entire `<body>` content (the `<nav class="sg-nav">` through `<footer class="sg-footer">`) into this component's template verbatim — no behavior in this page, so it's a pure markup move. (Full body content: see `web/style-guide.html` lines 267–435 — copy it exactly into the `<script>`-less template of this `.svelte` file.)

- [ ] **Step 5: Write `web/pages/style-guide.html`**

Move `web/style-guide.html`'s entire `<head>` content (meta tags, icon links, and the inline `<style>` block, lines 3–263) into this file's `<head>` unchanged. Replace the `<body>` with a mount point:

```html
<!doctype html>
<html lang="en">
<head>
  <!-- ...exact same <head> content as web/style-guide.html, unchanged... -->
</head>
<body>
  <script type="module" src="./style-guide.js"></script>
</body>
</html>
```

- [ ] **Step 6: Write `web/pages/style-guide.js`**

```js
import { mount } from "svelte";
import StyleGuide from "../components/pages/StyleGuide.svelte";

mount(StyleGuide, { target: document.body });
```

- [ ] **Step 7: Write `server.js`**

```js
// cilippofilia.dev — local-only Bun.serve() app.
//
// - Binds to 127.0.0.1 only — nothing outside this machine can reach it.
// - Pages are Bun HTML imports: Bun bundles their <script>/<link> tags,
//   including the Svelte components those scripts mount, via
//   bun-plugin-svelte (registered in bunfig.toml).
//
// Run with: bun --hot server.js
// Then open: http://localhost:4321/style-guide

import styleGuide from "./web/pages/style-guide.html";
import { WEB_DIR, serveWithin } from "./src/server/static.js";

const PORT = process.env.PORT ? Number(process.env.PORT) : 4321;
const HOST = "127.0.0.1"; // local only, on purpose

const server = Bun.serve({
  hostname: HOST,
  port: PORT,
  development: true,
  routes: {
    "/style-guide": styleGuide,
    "/assets/*": (req) => serveWithin(WEB_DIR, new URL(req.url).pathname),
    "/css/*": (req) => serveWithin(WEB_DIR, new URL(req.url).pathname),
    "/favicon.ico": () => serveWithin(WEB_DIR, "/assets/favicon.svg"),
  },
  fetch() {
    return new Response("404 Not Found", { status: 404 });
  },
});

console.log(`cilippofilia.dev running locally at http://${HOST}:${PORT}/style-guide`);
console.log("(bound to 127.0.0.1 — not reachable from any other device)");
```

- [ ] **Step 8: Verify manually**

Run: `bun --hot server.js`
Open `http://127.0.0.1:4321/style-guide` in a browser. Expected: page renders identically to today's `http://localhost:4321/style-guide` (same colors, type specimens, swatches, card examples) with no console errors, and the tab shows the favicon.

- [ ] **Step 9: Commit**

```bash
git add bunfig.toml server.js src/server/static.js web/assets/favicon.svg \
  web/components/pages/StyleGuide.svelte web/pages/style-guide.html web/pages/style-guide.js
git commit -m "Bootstrap Bun+Svelte pipeline and port the style guide page"
```

---

### Task 2: Extract app-card pure helpers with unit tests

**Files:**
- Create: `web/lib/app-card.js`
- Test: `web/lib/app-card.test.js`

**Interfaces:**
- Produces: `splitName(name) -> {title, subtitle}`, `isImageIcon(icon) -> boolean`, `badgeClass(status) -> "dev" | "concept" | "example"` — consumed by `AppCard.svelte` (Task 3), `AppsFeed.svelte` (Task 5), and `AppTemplate.svelte` (Task 10).

- [ ] **Step 1: Write the failing tests**

```js
// web/lib/app-card.test.js
import { test, expect } from "bun:test";
import { splitName, isImageIcon, badgeClass } from "./app-card.js";

test("splitName splits on the first colon", () => {
  expect(splitName("Drinko: Cocktail Recipes")).toEqual({ title: "Drinko", subtitle: "Cocktail Recipes" });
});

test("splitName with no colon has no subtitle", () => {
  expect(splitName("relay")).toEqual({ title: "relay", subtitle: "" });
});

test("splitName with no name returns empty strings", () => {
  expect(splitName(undefined)).toEqual({ title: "", subtitle: "" });
});

test("isImageIcon is true for absolute and http(s) paths", () => {
  expect(isImageIcon("/assets/app-icons/thumb/relay-icon.png")).toBe(true);
  expect(isImageIcon("https://example.com/icon.png")).toBe(true);
});

test("isImageIcon is false for emoji or missing icons", () => {
  expect(isImageIcon("🚦")).toBe(false);
  expect(isImageIcon(undefined)).toBe(false);
});

test("badgeClass maps free-text status to a badge style", () => {
  expect(badgeClass("In development")).toBe("dev");
  expect(badgeClass("Concept")).toBe("concept");
  expect(badgeClass("Live")).toBe("example");
  expect(badgeClass(undefined)).toBe("example");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test web/lib/app-card.test.js`
Expected: FAIL — `./app-card.js` does not exist yet.

- [ ] **Step 3: Write `web/lib/app-card.js`**

Ported unchanged from `web/js/app-card.js`'s exported functions (`splitName`, `isImageIcon`, `badgeClass` — logic identical, only the rendering half of that file, `appCard()`, is dropped since `AppCard.svelte` replaces it):

```js
// "Drinko: Cocktail Recipes" -> title "Drinko", subtitle "Cocktail Recipes".
export function splitName(name) {
  const idx = (name || "").indexOf(":");
  if (idx === -1) return { title: name || "", subtitle: "" };
  return { title: name.slice(0, idx).trim(), subtitle: name.slice(idx + 1).trim() };
}

// Icons are either an emoji or a path to a real app icon.
export function isImageIcon(icon) {
  return typeof icon === "string" && /^(\/|https?:)/.test(icon);
}

// Badge colour for an in-development app's free-text status. Anything
// unrecognized falls back to a neutral badge rather than going unstyled.
export function badgeClass(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("dev")) return "dev";
  if (s.includes("concept")) return "concept";
  return "example";
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test web/lib/app-card.test.js`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add web/lib/app-card.js web/lib/app-card.test.js
git commit -m "Extract app-card pure helpers with unit tests"
```

---

### Task 3: AppCard.svelte

**Files:**
- Create: `web/components/AppCard.svelte`

**Interfaces:**
- Consumes: `splitName`, `isImageIcon` from `web/lib/app-card.js` (Task 2).
- Produces: `<AppCard href external icon name badge badgeStyle tagline />` — consumed by `AppsFeed.svelte` (Task 5).

- [ ] **Step 1: Write `web/components/AppCard.svelte`**

Ported from `web/js/app-card.js`'s `appCard()` template-string function, as real markup:

```svelte
<script>
  import { splitName, isImageIcon } from "../lib/app-card.js";

  let { href, external = false, icon, name, badge, badgeStyle, tagline } = $props();

  let parts = $derived(splitName(name));
</script>

<a class="card" {href} target={external ? "_blank" : undefined} rel={external ? "noopener" : undefined}>
  <div class="card-head">
    {#if isImageIcon(icon)}
      <img class="icon-img" src={icon} alt="" width="48" height="48" />
    {:else}
      <span class="icon">{icon || "📱"}</span>
    {/if}
    <div class="card-title">
      <h3>{parts.title}</h3>
      {#if parts.subtitle}
        <p class="card-subtitle">{parts.subtitle}</p>
      {/if}
    </div>
  </div>
  <span class="badge {badgeStyle}">{badge}</span>
  <p>{tagline || ""}</p>
</a>
```

- [ ] **Step 2: Commit**

No standalone test — this component is exercised through `AppsFeed.svelte`'s manual verification in Task 5, and through the App Store cards on the home page in Task 9.

```bash
git add web/components/AppCard.svelte
git commit -m "Add AppCard.svelte component"
```

---

### Task 4: SiteChrome.svelte

Ports `web/js/nav.js`'s header/footer injection into declarative markup. Composes around its content via Svelte 5's `children` snippet, matching the original's "prepend header, append footer" behavior without copy-pasting chrome markup into every page that uses it.

**Files:**
- Create: `web/components/SiteChrome.svelte`

**Interfaces:**
- Produces: `<SiteChrome>...</SiteChrome>` — wraps page content with the shared header+footer; consumed by `Home.svelte` (Task 9) and `AppTemplate.svelte` (Task 10).

- [ ] **Step 1: Write `web/components/SiteChrome.svelte`**

```svelte
<script>
  import { onMount } from "svelte";

  let { children } = $props();

  let path = $state("/home");

  onMount(() => {
    path = window.location.pathname.replace(/\/+$/, "") || "/home";
  });

  // "App Store" points at the app cards further down the home page. When we
  // are already on /home the browser would only jump, so scroll there
  // smoothly instead; from any other page the plain /home#apps href does the
  // navigating and the browser lands on the anchor by itself.
  function onAppsClick(e) {
    const target = document.getElementById("apps");
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", "/home#apps");
  }
</script>

<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/home">cilippofilia<span class="dim">.dev</span></a>
    <div class="nav-group">
      <nav class="site-nav">
        <a href="/home" class:active={path === "/home"}>Home</a>
        <a href="/home#apps" onclick={onAppsClick}>App Store</a>
      </nav>
    </div>
  </div>
</header>

{@render children?.()}

<footer class="site-footer">
  <div class="wrap">cilippofilia.dev — local only, running on your machine.</div>
</footer>
```

- [ ] **Step 2: Commit**

Verified manually together with `Home.svelte` in Task 9 (first page that composes it).

```bash
git add web/components/SiteChrome.svelte
git commit -m "Add SiteChrome.svelte component"
```

---

### Task 5: AppsFeed.svelte

Ports `web/js/apps-feed.js`'s two-feed fetch/render logic (published apps from `/api/appstore-apps`, in-development apps from `/apps.json`) into a Svelte component using `AppCard`.

**Files:**
- Create: `web/components/AppsFeed.svelte`

**Interfaces:**
- Consumes: `badgeClass` from `web/lib/app-card.js` (Task 2), `AppCard.svelte` (Task 3).
- Produces: `<AppsFeed />` — consumed by `Home.svelte` (Task 9).

- [ ] **Step 1: Write `web/components/AppsFeed.svelte`**

```svelte
<script>
  import { onMount } from "svelte";
  import AppCard from "./AppCard.svelte";
  import { badgeClass } from "../lib/app-card.js";

  // While only relay is ready to show publicly, filter the rest of
  // apps.json out here rather than deleting their entries.
  const DEV_SLUGS_TO_SHOW = ["the-relay"];

  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  let publishedApps = $state([]);
  let devApps = $state([]);
  let feedLoaded = $state(false);

  // Whichever app is still a preorder gets the featured strip to itself, so
  // the grid below skips it. Computed from Apple's own release date, never
  // hardcoded.
  let upcoming = $derived(publishedApps.find((a) => a.releaseDate && new Date(a.releaseDate) > new Date()));
  let liveApps = $derived(publishedApps.filter((a) => a !== upcoming));

  onMount(() => {
    fetch("/api/appstore-apps")
      .then((r) => r.json())
      .then((apps) => {
        feedLoaded = apps.length > 0;
        publishedApps = apps;
      })
      .catch(() => {});

    fetch("/apps.json")
      .then((r) => r.json())
      .then((apps) => {
        devApps = apps.filter((app) => DEV_SLUGS_TO_SHOW.includes(app.slug));
      })
      .catch(() => {});
  });
</script>

<!-- Heads the whole App Store block — the featured preorder strip and the
     published grid under it. Hidden until the feed comes back, for the same
     reason those two are: a heading over nothing is worse than no heading. -->
<h2 class="apps-heading" hidden={!feedLoaded}>What's on the App Store</h2>

{#if upcoming}
  <div class="featured">
    {#if upcoming.icon}
      <img class="featured-icon" src={upcoming.icon} alt="" width="64" height="64" />
    {/if}
    <div class="featured-body">
      <span class="featured-eyebrow">Preorder</span>
      <h3>{upcoming.name}</h3>
      <p>{upcoming.tagline || ""} Releases {fmtDate(upcoming.releaseDate)}.</p>
    </div>
    <a class="button secondary" href={upcoming.localUrl || upcoming.url}>Preorder ›</a>
  </div>
{/if}

{#if liveApps.length}
  <section>
    <div class="grid">
      {#each liveApps as app (app.id)}
        <AppCard
          href={app.localUrl || app.url}
          external={!app.localUrl}
          icon={app.icon}
          name={app.name}
          badge="Live"
          badgeStyle="live"
          tagline={app.tagline || app.genre}
        />
      {/each}
    </div>
  </section>
{/if}

{#if devApps.length}
  <section>
    <div class="grid">
      {#each devApps as app (app.slug)}
        <AppCard
          href={`/${app.slug}`}
          icon={app.icon}
          name={app.name}
          badge={app.status || ""}
          badgeStyle={badgeClass(app.status)}
          tagline={app.tagline}
        />
      {/each}
    </div>
  </section>
{/if}
```

Note: the original wrapped `#published-grid`/`#dev-grid` in `#published-section`/`#dev-section` elements purely to toggle `hidden` on the section; here the `{#if liveApps.length}`/`{#if devApps.length}` blocks achieve the same "don't render an empty section" behavior directly, so those wrapper ids are dropped as dead weight — nothing else on the page targets them.

- [ ] **Step 2: Commit**

Verified manually together with `Home.svelte` in Task 9 (needs the live `/api/appstore-apps` and `/apps.json` routes, which don't exist until then).

```bash
git add web/components/AppsFeed.svelte
git commit -m "Add AppsFeed.svelte component"
```

---

### Task 6: FloatingIcons.svelte

Ports `web/js/floating-icons.js`, switching from the `anime.js` v3 CDN global to the `animejs` v4 npm import (per spec — the one intentional API-shape change in this migration; the *effect* is identical wandering-icon animation, unchanged parameters).

**Files:**
- Create: `web/components/FloatingIcons.svelte`

**Interfaces:**
- Produces: `<FloatingIcons />` — consumed by `Home.svelte` (Task 9).

- [ ] **Step 1: Write `web/components/FloatingIcons.svelte`**

```svelte
<script>
  import { onMount } from "svelte";
  import { animate, utils } from "animejs";

  const icons = [
    { class: "fi-1", src: "/assets/app-icons/thumb/9tiles-icon.png", title: "9 Tiles Puzzle", size: 96 },
    { class: "fi-2", src: "/assets/app-icons/thumb/drinko-icon.png", title: "Drinko", size: 76 },
    { class: "fi-3", src: "/assets/app-icons/thumb/iterly-icon.png", title: "Iterly", size: 88 },
    { class: "fi-4", src: "/assets/app-icons/thumb/itsWritten-icon.png", title: "itsWritten", size: 80 },
    { class: "fi-5", src: "/assets/app-icons/thumb/relay-icon.png", title: "relay", size: 92 },
  ];

  // Continuous idle drift for the floating app icons, via animejs. Each icon
  // wanders to a fresh random point (with a small rotation) every time it
  // finishes a leg, so it keeps roaming around the hero background rather
  // than oscillating between two spots.
  onMount(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    // How far an icon may wander from its resting point. Scaled to the
    // window so the drift stays a gentle nudge on a phone instead of
    // carrying an icon off the edge of a 390px screen.
    const amp = Math.max(16, Math.min(52, Math.round(window.innerWidth * 0.05)));

    document.querySelectorAll(".floating-icon").forEach((el, i) => {
      const wander = () => {
        animate(el, {
          translateX: () => utils.random(-amp, amp),
          translateY: () => utils.random(-Math.round(amp * 0.85), Math.round(amp * 0.85)),
          rotate: () => utils.random(-14, 14),
          duration: () => utils.random(7000, 12000),
          ease: "inOutSine",
          onComplete: wander,
        });
      };
      setTimeout(wander, i * 300);
    });
  });
</script>

<div class="floating-icons" aria-hidden="true">
  {#each icons as icon (icon.class)}
    <img
      class="floating-icon {icon.class}"
      src={icon.src}
      alt=""
      title={icon.title}
      width={icon.size}
      height={icon.size}
    />
  {/each}
</div>
```

- [ ] **Step 2: Verify manually**

This can be checked in isolation once `Home.svelte` exists (Task 9): the five app icons should drift continuously and randomly, never snapping or freezing. Note here as a reminder for that task's verification step.

- [ ] **Step 3: Commit**

```bash
git add web/components/FloatingIcons.svelte
git commit -m "Add FloatingIcons.svelte component (animejs v4)"
```

---

### Task 7: ProfileCard.svelte

**Files:**
- Create: `web/components/ProfileCard.svelte`

**Interfaces:**
- Produces: `<ProfileCard />` — consumed by `Home.svelte` (Task 9) and read/cloned by `IntroFlip.svelte` (Task 8) via `document.querySelector(".profile-card")`.

- [ ] **Step 1: Write `web/components/ProfileCard.svelte`**

Moved verbatim from `web/index.html` lines 57–77 (the `<aside class="profile-card">` block):

```svelte
<aside class="profile-card">
  <img class="profile-photo" src="/assets/profile.jpg" alt="Filippo Cilia" width="116" height="116" />
  <h3 class="profile-name">Filippo Cilia</h3>
  <p class="profile-role">Software Engineer, iOS</p>
  <p class="profile-location">Manchester, UK</p>
  <p class="profile-bio">Freelance iOS engineer. I build native Apple apps I'd actually want to use myself.</p>
  <div class="profile-social">
    <a href="https://github.com/cilippofilia" target="_blank" rel="noopener" aria-label="GitHub">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
    </a>
    <a href="https://www.linkedin.com/in/filippocarlocilia" target="_blank" rel="noopener" aria-label="LinkedIn">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
    </a>
    <a href="https://twitter.com/fcilia_dev" target="_blank" rel="noopener" aria-label="X">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
    </a>
    <a href="https://instagram.com/cilippofilia" target="_blank" rel="noopener" aria-label="Instagram">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
    </a>
  </div>
</aside>
```

- [ ] **Step 2: Commit**

```bash
git add web/components/ProfileCard.svelte
git commit -m "Add ProfileCard.svelte component"
```

---

### Task 8: IntroFlip.svelte

Ports the scroll-linked intro animation from `web/js/intro-flip.js` — pure `requestAnimationFrame`/`getBoundingClientRect` code, no `anime.js` involved. The measurement/update logic is porous to timing changes, so it's moved into `onMount` essentially verbatim rather than rewritten to be "more Svelte-idiomatic".

**Files:**
- Create: `web/components/IntroFlip.svelte`

**Interfaces:**
- Produces: `<IntroFlip />` — consumed by `Home.svelte` (Task 9). Reads `.profile-card`/`.profile-photo` (from `ProfileCard.svelte`, Task 7), `header.site-header` (from `SiteChrome.svelte`, Task 4), and `.floating-icons` (from `FloatingIcons.svelte`, Task 6) live via `document.querySelector` at mount time — same cross-component wiring style as the original (all these elements exist in the DOM by the time this component's `onMount` fires, since Svelte's `mount()` builds the whole tree synchronously before any `onMount` runs).

- [ ] **Step 1: Write `web/components/IntroFlip.svelte`**

Markup moved from `web/index.html` lines 28–53 (the `<section class="intro">` block); script ported unchanged from `web/js/intro-flip.js`, wrapped in `onMount`:

```svelte
<script>
  import { onMount } from "svelte";

  // The intro's scroll-linked animation: the flip card, and the profile
  // card it assembles into.
  //
  // Scroll-linked, three-phase "shared element" transition:
  //  1. the big intro cutout turns a half-circle about its vertical axis.
  //     Backface culling means it vanishes entirely as it passes edge-on at
  //     90deg, and what comes round the other side is the same crop with
  //     its background intact, cropped to a circle — which then shrinks
  //     into the small avatar as the turn finishes.
  //  2. a cloned profile-card (parked at that same avatar spot) fades in
  //     its background/border/shadow plus the name, role, bio and social
  //     row underneath the settled avatar — built in place, nothing
  //     travels yet.
  //  3. the fully-built clone flies over to the real sidebar slot, tilting
  //     slightly away and lifting toward the viewer on the way across, then
  //     settling flat before it lands exactly on the real .profile-card,
  //     which then swaps in.
  //
  // Phases 1-2 happen while #intro-pin is pinned on screen via CSS
  // `position: sticky` (see .intro.pin-active in intro.css) — the page
  // doesn't visually scroll until the card has finished forming, so it
  // can't scroll out of view mid-build. All positions are read live via
  // getBoundingClientRect() every frame with no scrollY math: while
  // pinned, the wrap's viewport rect simply doesn't change, so nothing
  // needs correcting for scroll; once the pin releases for phase 3, both
  // the parked reference point and the real card move up in lockstep with
  // scroll, so the interpolation still lands exactly on the real card at
  // p3 = 1 by construction.
  onMount(() => {
    const flip = document.getElementById("hero-flip");
    const flipInner = document.getElementById("hero-flip-inner");
    const flyerBlur = document.getElementById("hero-flyer-blur");
    const ghost = document.getElementById("intro-photo-ghost");
    const intro = document.getElementById("intro");
    const introPin = document.getElementById("intro-pin");
    const header = document.querySelector("header.site-header");
    const realCard = document.querySelector(".profile-card");
    const realPhoto = document.querySelector(".profile-photo");
    const floatingIcons = document.querySelector(".floating-icons");
    if (!flip || !flipInner || !ghost || !intro || !introPin || !realCard || !realPhoto) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      flip.remove();
      if (flyerBlur) flyerBlur.remove();
      return;
    }

    intro.classList.add("pin-active");
    introPin.style.top = (header ? header.offsetHeight : 0) + "px";
    flip.classList.add("is-fixed");
    if (floatingIcons) floatingIcons.style.position = "fixed";

    const flyingCard = realCard.cloneNode(true);
    flyingCard.classList.add("flying-card");
    flyingCard.setAttribute("aria-hidden", "true");
    flyingCard.querySelectorAll("a").forEach((a) => (a.tabIndex = -1));
    const chrome = document.createElement("div");
    chrome.className = "fc-chrome";
    flyingCard.insertBefore(chrome, flyingCard.firstChild);
    document.body.appendChild(flyingCard);
    const flyingPhoto = flyingCard.querySelector(".profile-photo");
    const flyingRest = Array.from(flyingCard.children).filter(
      (el) => el !== chrome && el !== flyingPhoto
    );

    let phase3Dist = 450;
    let pinStart = 0;
    let pinBuffer = 1;
    let flyerBaseW = 1;
    let flyerBaseH = 1;
    let ticking = false;
    let flipIdle = null;

    function setFlipIdle(idle) {
      if (idle === flipIdle) return;
      flipIdle = idle;
      flip.style.willChange = idle ? "auto" : "transform, opacity";
      flipInner.style.willChange = idle ? "auto" : "transform";
    }

    function measure() {
      const introRect = intro.getBoundingClientRect();
      const headerHeight = header ? header.offsetHeight : 0;
      pinStart = introRect.top + window.scrollY - headerHeight;
      pinBuffer = Math.max(intro.offsetHeight - introPin.offsetHeight, 1);
      introPin.style.top = headerHeight + "px";
      flyingCard.style.width = realCard.getBoundingClientRect().width + "px";
      phase3Dist = Math.min(450, window.innerHeight * 0.6);
      const ghostRect = ghost.getBoundingClientRect();
      flyerBaseW = Math.max(ghostRect.width, 1);
      flyerBaseH = Math.max(ghostRect.height, 1);
      flip.style.width = flyerBaseW + "px";
      flip.style.height = flyerBaseH + "px";
      update();
    }

    function lerp(a, b, p) {
      return a + (b - a) * p;
    }

    function smoothstep(p) {
      return p * p * (3 - 2 * p);
    }

    function easeOutQuad(p) {
      return 1 - (1 - p) * (1 - p);
    }

    function clamp01(v) {
      return Math.min(1, Math.max(0, v));
    }

    function phaseProgress(raw, start, end) {
      return smoothstep(clamp01((raw - start) / (end - start)));
    }

    function update() {
      ticking = false;
      const scrollY = window.scrollY;
      const raw12 = clamp01((scrollY - pinStart) / pinBuffer);
      const raw3 = clamp01((scrollY - (pinStart + pinBuffer)) / phase3Dist);

      const pFlip = easeOutQuad(clamp01(raw12 / 0.5));
      const pShrink = phaseProgress(raw12, 0.15, 0.6);
      const p2 = phaseProgress(raw12, 0.5, 1);
      const pHand = phaseProgress(raw12, 0.6, 0.7);
      const fadeStart = 0.9;
      const p3 = smoothstep(clamp01(raw3 / fadeStart));

      if (floatingIcons) {
        floatingIcons.style.top = -(pinStart + Math.max(0, scrollY - (pinStart + pinBuffer))) + "px";
      }

      const wrapRect = ghost.getBoundingClientRect();
      const realCardRect = realCard.getBoundingClientRect();
      const realPhotoRect = realPhoto.getBoundingClientRect();

      const photoW = realPhoto.offsetWidth;
      const photoH = realPhoto.offsetHeight;
      const wrapCenterX = wrapRect.left + wrapRect.width / 2;
      const wrapCenterY = wrapRect.top + wrapRect.height / 2;
      const parkPhoto = {
        top: wrapCenterY - photoH / 2,
        left: wrapCenterX - photoW / 2,
        width: photoW,
        height: photoH,
      };

      const photoOffsetX = realPhotoRect.left - realCardRect.left;
      const photoOffsetY = realPhotoRect.top - realCardRect.top;
      const parkCard = { top: parkPhoto.top - photoOffsetY, left: parkPhoto.left - photoOffsetX };

      const top = lerp(wrapRect.top, parkPhoto.top, pShrink);
      const left = lerp(wrapRect.left, parkPhoto.left, pShrink);
      const scale = lerp(1, parkPhoto.width / flyerBaseW, pShrink);
      flip.style.transform = `translate(${left}px, ${top}px) scale(${scale})`;
      flip.style.opacity = String(1 - pHand);
      flipInner.style.transform = `rotateY(${pFlip * 180}deg)`;
      setFlipIdle(pHand >= 1);
      if (flyerBlur) flyerBlur.style.opacity = String(1 - phaseProgress(raw12, 0, 0.12));

      const cardTop = lerp(parkCard.top, realCardRect.top, p3);
      const cardLeft = lerp(parkCard.left, realCardRect.left, p3);
      const bump = Math.pow(Math.sin(Math.PI * clamp01(raw3 / 0.8)), 2);
      const tilt = -9 * bump;
      const lift = 1 + 0.03 * bump;
      flyingCard.style.transform =
        `translate(${cardLeft}px, ${cardTop}px) perspective(900px) ` +
        `rotateY(${tilt}deg) scale(${lift})`;

      if (flyingPhoto) flyingPhoto.style.opacity = String(pHand);
      chrome.style.opacity = String(p2);
      flyingRest.forEach((el) => {
        el.style.opacity = String(p2);
      });

      const fade = clamp01((raw3 - fadeStart) / (1 - fadeStart));
      flyingCard.style.opacity = String(1 - fade);
      realCard.style.visibility = fade > 0 ? "visible" : "hidden";
      realCard.style.opacity = String(fade);
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    realCard.style.opacity = "0";
    realCard.style.visibility = "hidden";
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("load", measure);
    window.addEventListener("scroll", onScroll, { passive: true });
    const timeoutId = setTimeout(measure, 300);

    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("load", measure);
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timeoutId);
    };
  });
</script>

<section class="intro" id="intro" style="margin-top:0">
  <div class="intro-pin" id="intro-pin">
    <div class="intro-grid">
      <div class="intro-photo-wrap">
        <div class="intro-photo-ghost" id="intro-photo-ghost" aria-hidden="true"></div>
        <div id="hero-flyer-blur" class="hero-flyer-blur" aria-hidden="true"></div>
        <!-- The intro's flip card. Both faces are the same 1102x1103
             crop at the same box size, so the head lands in exactly the
             same place on either side of the turn: the front is the
             background-removed cutout, the back the full photo masked
             to a circle. At 90deg both faces are edge-on and nothing is
             drawn, which is where the swap happens. -->
        <div id="hero-flip" class="hero-flip" aria-hidden="true">
          <div class="hero-flip-inner" id="hero-flip-inner">
            <img id="hero-flyer" class="hero-flyer hero-flip-face" src="/assets/profile-clear.png" alt="" />
            <img id="hero-flyer-back" class="hero-flyer-back hero-flip-face" src="/assets/profile.jpg" alt="" />
          </div>
        </div>
      </div>
      <div class="intro-copy">
        <h1 class="intro-heading">Hello, World! <span class="wave" aria-hidden="true">👋</span></h1>
        <p class="intro-sub">Lorem, ipsum dolor sit amet consectetur adipisicing elit. Ab recusandae inventore minima optio expedita odit suscipit laborum itaque eum tempore voluptates aspernatur, molestias, deserunt, perferendis vitae facilis sequi sit eos?.</p>
      </div>
    </div>
  </div>
</section>
```

Note: this component adds a cleanup function returning from `onMount` (removing the `resize`/`load`/`scroll` listeners and pending timeout on unmount) — the original vanilla script never cleaned up since the whole page was thrown away on navigation anyway, but Svelte components can in principle be unmounted, so this is a small correctness addition consistent with how Svelte expects `onMount` to be used, not a behavior change for this single-page-per-load site.

- [ ] **Step 2: Commit**

Verified manually together with `Home.svelte` in Task 9 — this animation only makes sense composed with `ProfileCard`, `SiteChrome`, and `FloatingIcons` on the same page.

```bash
git add web/components/IntroFlip.svelte
git commit -m "Add IntroFlip.svelte component"
```

---

### Task 9: Home.svelte — compose the home page and wire its route

**Files:**
- Create: `web/components/pages/Home.svelte`
- Create: `web/pages/home.html`
- Create: `web/pages/home.js`
- Modify: `server.js`

**Interfaces:**
- Consumes: `SiteChrome` (Task 4), `FloatingIcons` (Task 6), `IntroFlip` (Task 8), `ProfileCard` (Task 7), `AppsFeed` (Task 5).

- [ ] **Step 1: Write `web/components/pages/Home.svelte`**

Composes the shared components in the same order as `web/index.html`'s body:

```svelte
<script>
  import SiteChrome from "../SiteChrome.svelte";
  import FloatingIcons from "../FloatingIcons.svelte";
  import IntroFlip from "../IntroFlip.svelte";
  import ProfileCard from "../ProfileCard.svelte";
  import AppsFeed from "../AppsFeed.svelte";
</script>

<FloatingIcons />
<SiteChrome>
  <main>
    <div class="wrap">
      <IntroFlip />

      <section class="hero">
        <div class="hero-grid">
          <ProfileCard />
          <div>
            <h1>SwiftUI apps built with user experience in mind.</h1>
            <p class="lede">
              A hub for everything that makes it out of my brain — all build for the Apple Ecosystem and primarliy with SwiftUI.
            </p>
          </div>
        </div>
      </section>

      <!-- Scroll target for the header's "App Store" link — sits just above
           the first app content on the page. -->
      <div id="apps" aria-hidden="true"></div>

      <AppsFeed />
    </div>
  </main>
</SiteChrome>
```

- [ ] **Step 2: Write `web/pages/home.html`**

`<head>` moved unchanged from `web/index.html` lines 1–17 (all the `<link>`/`<meta>` tags — the `anime.min.js` CDN `<script>` is dropped, since `FloatingIcons.svelte` now imports `animejs` directly):

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>cilippofilia.dev</title>
  <link rel="stylesheet" href="/css/tokens.css" />
  <link rel="stylesheet" href="/css/base.css" />
  <link rel="stylesheet" href="/css/layout.css" />
  <link rel="stylesheet" href="/css/components.css" />
  <link rel="stylesheet" href="/css/intro.css" />
  <meta name="description" content="Filippo Cilia's hub for small, native SwiftUI apps — iOS, iPadOS, macOS, and watchOS." />
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />
  <meta name="theme-color" content="#000000" />
</head>
<body>
  <script type="module" src="./home.js"></script>
</body>
</html>
```

- [ ] **Step 3: Write `web/pages/home.js`**

```js
import { mount } from "svelte";
import Home from "../components/pages/Home.svelte";

mount(Home, { target: document.body });
```

- [ ] **Step 4: Modify `server.js`**

Add the home route, the redirects, the App Store API route, and the `/apps.json` data route:

```js
import styleGuide from "./web/pages/style-guide.html";
import home from "./web/pages/home.html";
import { WEB_DIR, DATA_DIR, serveWithin } from "./src/server/static.js";
import { getPublishedApps } from "./src/server/appstore.js";

// ...

routes: {
  "/": () => Response.redirect("/home", 302),
  "/home": home,
  "/style-guide": styleGuide,
  "/api/appstore-apps": async () => Response.json(await getPublishedApps()),
  "/apps.json": () => serveWithin(DATA_DIR, "/apps.json"),
  "/assets/*": (req) => serveWithin(WEB_DIR, new URL(req.url).pathname),
  "/css/*": (req) => serveWithin(WEB_DIR, new URL(req.url).pathname),
  "/favicon.ico": () => serveWithin(WEB_DIR, "/assets/favicon.svg"),
},
```

(`serveWithin(DATA_DIR, "/apps.json")` works because `DATA_DIR` is `data/` and the file is `data/apps.json` — same traversal-safe helper as the asset routes, just rooted at `data/` instead of `web/`.)

- [ ] **Step 5: Verify manually**

Run: `bun --hot server.js`
Open `http://127.0.0.1:4321/home`. Expected, matching today's site exactly:
- The five floating app icons drift continuously in the background.
- Scrolling plays the intro flip-card animation (cutout turns, shrinks, becomes the avatar, the assembled card flies to the sidebar).
- The profile card and bio render correctly once the animation lands.
- Below the fold, "What's on the App Store" appears once the feeds load, with a featured preorder strip (9 Tiles Puzzle) and a live apps grid.
- Clicking "App Store" in the header smoothly scrolls to the apps section; clicking it from `/style-guide` navigates to `/home#apps` and lands there.
- `http://127.0.0.1:4321/` redirects to `/home`.

- [ ] **Step 6: Commit**

```bash
git add web/components/pages/Home.svelte web/pages/home.html web/pages/home.js server.js
git commit -m "Compose and route the home page"
```

---

### Task 10: AppTemplate.svelte — generic per-app page

**Files:**
- Create: `web/components/pages/AppTemplate.svelte`
- Create: `web/pages/app.html`
- Create: `web/pages/app.js`
- Modify: `server.js`

**Interfaces:**
- Consumes: `SiteChrome` (Task 4), `isImageIcon`, `badgeClass` from `web/lib/app-card.js` (Task 2).

- [ ] **Step 1: Write `web/components/pages/AppTemplate.svelte`**

Ported from `web/app.html`'s inline `<script>` — same slug-from-URL, fetch-`/apps.json`, render-or-404 behavior, as Svelte markup instead of built-up `innerHTML` strings:

```svelte
<script>
  import { onMount } from "svelte";
  import SiteChrome from "../SiteChrome.svelte";
  import { isImageIcon, badgeClass } from "../../lib/app-card.js";

  let app = $state(null);
  let notFound = $state(false);
  let loadFailed = $state(false);
  let slug = $state("");

  onMount(() => {
    slug = window.location.pathname.replace(/^\/+|\/+$/g, "");

    fetch("/apps.json")
      .then((r) => r.json())
      .then((apps) => {
        const found = apps.find((a) => a.slug === slug);
        if (!found) {
          notFound = true;
          document.title = "Not found — cilippofilia.dev";
          return;
        }
        app = found;
        document.title = `${found.name} — cilippofilia.dev`;
      })
      .catch(() => {
        loadFailed = true;
      });
  });
</script>

<SiteChrome>
  <main>
    <div class="wrap" id="content">
      {#if loadFailed}
        <p class="empty-state">Couldn't load apps.json.</p>
      {:else if notFound}
        <section class="hero" style="margin-top:0">
          <h1>Nothing here yet</h1>
          <p class="lede">There's no app at <code>/{slug}</code>. Add an entry with this
          slug to <code>data/apps.json</code> to give it a page.</p>
          <a class="button secondary" href="/home#apps">← Back to App Store</a>
        </section>
      {:else if app}
        <section class="hero app-detail" style="margin-top:0">
          <div class="app-detail-head">
            {#if isImageIcon(app.icon)}
              <img class="icon-lg icon-img" src={app.icon} alt="" width="88" height="88" />
            {:else}
              <span class="icon-lg">{app.icon || "📱"}</span>
            {/if}
            <div class="app-detail-meta">
              <span class="badge {badgeClass(app.status)}">{app.status || ""}</span>
              <h1>{app.name}</h1>
              <p class="lede">{app.tagline || ""}</p>
            </div>
          </div>
          <div class="app-detail-body">
            <p style="margin:0; color:var(--text); max-width:60ch; font-size:1.05rem; line-height:1.6">{app.description || ""}</p>
            <div class="app-detail-side">
              <div>
                <h4>Platforms</h4>
                <div class="platforms">
                  {#each app.platforms || [] as platform}
                    <span class="chip">{platform}</span>
                  {/each}
                </div>
              </div>
              <div>
                {#if app.appStoreUrl}
                  <a class="button" href={app.appStoreUrl}>View on the App Store</a>
                {:else}
                  <button type="button" class="button secondary" disabled>Not yet published</button>
                {/if}
              </div>
              <div>
                <a class="button secondary" href="/home#apps">← Back to App Store</a>
              </div>
            </div>
          </div>
        </section>
      {:else}
        <p class="empty-state">Loading…</p>
      {/if}
    </div>
  </main>
</SiteChrome>
```

Note: `badgeClass` here reuses the *in-development* badge classes (`dev`/`concept`/`example`) exactly as `web/app.html`'s inline script did (that script literally duplicated `badgeClass`'s logic inline) — using the shared helper instead of a second copy is a small, safe dedup, not a behavior change.

- [ ] **Step 2: Write `web/pages/app.html`**

Head moved unchanged from `web/app.html` lines 1–16:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>cilippofilia.dev</title>
  <link rel="stylesheet" href="/css/tokens.css" />
  <link rel="stylesheet" href="/css/base.css" />
  <link rel="stylesheet" href="/css/layout.css" />
  <link rel="stylesheet" href="/css/components.css" />
  <meta name="description" content="An app in development from Filippo Cilia's SwiftUI app portfolio." />
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />
  <meta name="theme-color" content="#000000" />
</head>
<body>
  <script type="module" src="./app.js"></script>
</body>
</html>
```

- [ ] **Step 3: Write `web/pages/app.js`**

```js
import { mount } from "svelte";
import AppTemplate from "../components/pages/AppTemplate.svelte";

mount(AppTemplate, { target: document.body });
```

- [ ] **Step 4: Modify `server.js`**

Add the dynamic slug route. This is a deliberate simplification versus today's server: the old `server.js` had a generic "any folder under `public/` with its own `index.html` is a custom multi-file site" mechanism, used by exactly one folder (`nine-tiles-puzzle`). Since that folder is getting its own explicit routes (Tasks 11–12), the generic mechanism is dropped — `/:slug` now falls straight through to the app template:

```js
import appTemplate from "./web/pages/app.html";

// ...

routes: {
  // ...existing routes from Task 9...
  "/:slug": appTemplate,
},
```

- [ ] **Step 5: Verify manually**

Run: `bun --hot server.js`
Open `http://127.0.0.1:4321/the-relay`. Expected: renders relay's detail page (icon, "In development" badge, description, platform chips, disabled "Not yet published" button, back link) exactly as today.
Open `http://127.0.0.1:4321/nonexistent-app`. Expected: "Nothing here yet" message with the correct slug echoed back.

- [ ] **Step 6: Commit**

```bash
git add web/components/pages/AppTemplate.svelte web/pages/app.html web/pages/app.js server.js
git commit -m "Compose and route the generic app template page"
```

---

### Task 11: Countdown.svelte with a unit-tested time-formatting helper

Ports the countdown-timer half of `web/nine-tiles-puzzle/app.js` (the intersection-observer "reveal sections" half is page-specific and is ported directly into `NineTilesPuzzle.svelte` in Task 12, since nothing else reuses it).

**Files:**
- Create: `web/lib/countdown.js`
- Test: `web/lib/countdown.test.js`
- Create: `web/components/Countdown.svelte`

**Interfaces:**
- Produces: `countdownParts(diffMs) -> {days, hours, minutes, seconds}` (each a zero-padded 2-digit string) from `web/lib/countdown.js`; `<Countdown releaseDate="2026-09-28T00:00:00" />` from `Countdown.svelte` — consumed by `NineTilesPuzzle.svelte` (Task 12).

- [ ] **Step 1: Write the failing tests**

```js
// web/lib/countdown.test.js
import { test, expect } from "bun:test";
import { countdownParts } from "./countdown.js";

test("countdownParts splits a diff into zero-padded days/hours/minutes/seconds", () => {
  const oneDayOneHourOneMinuteOneSecond = ((24 + 1) * 3600 + 60 + 1) * 1000;
  expect(countdownParts(oneDayOneHourOneMinuteOneSecond)).toEqual({
    days: "01",
    hours: "01",
    minutes: "01",
    seconds: "01",
  });
});

test("countdownParts pads single digits and handles zero", () => {
  expect(countdownParts(0)).toEqual({ days: "00", hours: "00", minutes: "00", seconds: "00" });
});

test("countdownParts handles more than 99 days without truncating", () => {
  const hundredDays = 100 * 86400 * 1000;
  expect(countdownParts(hundredDays).days).toBe("100");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test web/lib/countdown.test.js`
Expected: FAIL — `./countdown.js` does not exist yet.

- [ ] **Step 3: Write `web/lib/countdown.js`**

Extracted from `web/nine-tiles-puzzle/app.js`'s `tick()`/`pad()` logic:

```js
const pad = (n) => String(n).padStart(2, "0");

// Splits a millisecond countdown into zero-padded day/hour/minute/second
// strings. Days aren't clamped to two digits — a padStart floor of 2 still
// prints "100" for a hundred-day countdown rather than truncating it.
export function countdownParts(diffMs) {
  const totalSeconds = Math.floor(diffMs / 1000);
  return {
    days: pad(Math.floor(totalSeconds / 86400)),
    hours: pad(Math.floor((totalSeconds % 86400) / 3600)),
    minutes: pad(Math.floor((totalSeconds % 3600) / 60)),
    seconds: pad(totalSeconds % 60),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test web/lib/countdown.test.js`
Expected: PASS, 3 tests.

- [ ] **Step 5: Write `web/components/Countdown.svelte`**

The original's per-digit `.tick` CSS animation (restarted by removing/re-adding the class, `void digit.offsetWidth` forcing reflow) is preserved via a keyed `{#key}` block per digit, which is Svelte's idiomatic way to force an element to be destroyed and recreated (restarting a CSS animation) when its value changes — same visual effect as the original's manual class toggling.

```svelte
<script>
  import { countdownParts } from "../lib/countdown.js";

  let { releaseDate } = $props();

  const releaseMs = new Date(releaseDate).getTime();

  let parts = $state(countdownParts(Math.max(0, releaseMs - Date.now())));
  let live = $state(releaseMs - Date.now() <= 0);

  $effect(() => {
    if (live) return;
    const timer = setInterval(() => {
      const diff = releaseMs - Date.now();
      if (diff <= 0) {
        live = true;
        clearInterval(timer);
        return;
      }
      parts = countdownParts(diff);
    }, 1000);
    return () => clearInterval(timer);
  });
</script>

{#if !live}
  <div class="countdown" aria-label="Time until release">
    {#each [["Days", parts.days], ["Hours", parts.hours], ["Min", parts.minutes], ["Sec", parts.seconds]] as [label, value] (label)}
      <div class="countdown-unit">
        <span class="countdown-value">
          {#each value.split("") as char, i (i)}
            {#key char}
              <span class="digit tick">{char}</span>
            {/key}
          {/each}
        </span>
        <span class="countdown-label">{label}</span>
      </div>
    {/each}
  </div>
  <div class="badge-row" id="badge-pre">
    <a class="btn primary" href="https://apps.apple.com/app/id6776386637">Pre-order on the App Store</a>
    <a class="btn secondary" href="https://testflight.apple.com/join/7FvEWNPR">Test the Beta*</a>
  </div>
  <p class="beta-note">* Joining the beta and flagging anything wrong with the app will give you access to the whole game for free, forever.</p>
{:else}
  <p class="release-live">🎉 Available now!</p>
  <div class="badge-row">
    <a class="btn primary" href="https://apps.apple.com/app/id6776386637">Download on the App Store</a>
  </div>
{/if}
```

- [ ] **Step 6: Commit**

```bash
git add web/lib/countdown.js web/lib/countdown.test.js web/components/Countdown.svelte
git commit -m "Add Countdown.svelte with unit-tested time-formatting helper"
```

---

### Task 12: PuzzleChrome.svelte + NineTilesPuzzle.svelte + its route

**Files:**
- Create: `web/components/PuzzleChrome.svelte`
- Create: `web/components/pages/NineTilesPuzzle.svelte`
- Create: `web/pages/nine-tiles-puzzle.html`
- Create: `web/pages/nine-tiles-puzzle.js`
- Modify: `server.js`

**Interfaces:**
- Produces: `<PuzzleChrome>...</PuzzleChrome>` — consumed here and by `PrivacyPolicy.svelte` (Task 13).
- Consumes: `Countdown` (Task 11).

- [ ] **Step 1: Write `web/components/PuzzleChrome.svelte`**

The nav+footer markup duplicated identically across `web/nine-tiles-puzzle/index.html` and `privacy-policy.html`, deduped into one shared component (same "compose via `children`" pattern as `SiteChrome.svelte`):

```svelte
<script>
  let { children } = $props();
</script>

<nav class="site">
  <div class="wrap">
    <img src="/nine-tiles-puzzle/assets/icon.png" alt="" />
    <span>9 Tiles Puzzle</span>
  </div>
</nav>

{@render children?.()}

<footer class="site">
  <div class="wrap">
    <div class="links">
      <a href="/nine-tiles-puzzle">Home</a>
      <a href="https://github.com/cilippofilia/NineTilesPuzzle">GitHub</a>
      <a href="mailto:cilia.filippo@icloud.com">Contact</a>
    </div>
    <div>© 2026 Filippo Cilia</div>
  </div>
</footer>
```

Note: the footer's first link is `index.html`/`Home` on the landing page and `index.html`/`Home` on the privacy page too (both files' footers point at `index.html`) — but the landing page's own nav has no such "Home" link (it links nowhere, it just shows the title). Preserving exact behavior: this shared footer's "Home" link becomes `/nine-tiles-puzzle` (in the new routing there's no more `index.html` — the page **is** `/nine-tiles-puzzle`).

- [ ] **Step 2: Write `web/components/pages/NineTilesPuzzle.svelte`**

Markup moved from `web/nine-tiles-puzzle/index.html`, script logic (the `IntersectionObserver` section reveal) ported from `web/nine-tiles-puzzle/app.js` lines 1–20 (the countdown timer itself now lives in `Countdown.svelte`):

```svelte
<script>
  import { onMount } from "svelte";
  import PuzzleChrome from "../PuzzleChrome.svelte";
  import Countdown from "../Countdown.svelte";

  onMount(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sections = document.querySelectorAll("main section");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      sections.forEach((el) => el.classList.add("in-view"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 }
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  });

  const pieces = [
    { width: 120, height: 120, top: "8%", left: "6%", rotate: "-18deg", opacity: 0.05, duration: "19s", delay: "-2s" },
    { width: 90, height: 90, top: "18%", left: "82%", rotate: "32deg", opacity: 0.07, duration: "15s", delay: "-6s" },
    { width: 150, height: 150, top: "38%", left: "-4%", rotate: "12deg", opacity: 0.045, duration: "22s", delay: "-10s", alt: true },
    { width: 70, height: 70, top: "52%", left: "70%", rotate: "-40deg", opacity: 0.08, duration: "13s", delay: "-1s", alt: true },
    { width: 110, height: 110, top: "70%", left: "14%", rotate: "22deg", opacity: 0.05, duration: "18s", delay: "-8s", alt: true },
    { width: 100, height: 100, top: "85%", left: "88%", rotate: "-8deg", opacity: 0.06, duration: "20s", delay: "-4s", alt: true },
    { width: 60, height: 60, top: "4%", left: "45%", rotate: "55deg", opacity: 0.06, duration: "14s", delay: "-9s" },
  ];

  function pieceStyle(p) {
    return `width:${p.width}px; height:${p.height}px; top:${p.top}; left:${p.left}; --piece-rotate:${p.rotate}; --piece-opacity:${p.opacity}; --piece-duration:${p.duration}; --piece-delay:${p.delay};${p.alt ? " --piece-mask:var(--piece-svg-alt);" : ""}`;
  }
</script>

<div class="aurora" aria-hidden="true">
  {#each pieces as p, i (i)}
    <div class="piece" style={pieceStyle(p)}></div>
  {/each}
</div>

<PuzzleChrome>
  <div class="wrap">
    <header class="hero">
      <div class="icon-orb">
        <img src="/nine-tiles-puzzle/assets/icon.png" alt="9 Tiles Puzzle app icon" />
      </div>
      <h1 class="title">9 Tiles Puzzle</h1>
      <p class="tagline">Slice any photo into a grid, scramble it, and race to put it back together — seven ways to play.</p>
      <Countdown releaseDate="2026-09-28T00:00:00" />
    </header>

    <main>
      <section>
        <span class="eyebrow">Game Modes</span>
        <h2>Seven ways to play</h2>
        <ul class="features">
          <li><span class="glyph">🧩</span><strong>Slide</strong><span class="desc">Classic sliding movement — placed tiles can still be nudged later.</span></li>
          <li><span class="glyph">🔀</span><strong>Swap</strong><span class="desc">Swap any two tiles; correct ones lock in place for good.</span></li>
          <li><span class="glyph">⏱️</span><strong>Time Trial</strong><span class="desc">Race the clock, with a Gauntlet Ladder climb of ten stages.</span></li>
          <li><span class="glyph">🎯</span><strong>Limited Moves</strong><span class="desc">Solve within a move budget set by the grid size.</span></li>
          <li><span class="glyph">🍃</span><strong>Zen</strong><span class="desc">Untimed, no streaks to break.</span></li>
          <li><span class="glyph">🌫️</span><strong>Haze</strong><span class="desc">Tiles hide behind drifting fog — shake to peek.</span></li>
          <li><span class="glyph">🌀</span><strong>Chaos</strong><span class="desc">The source image may be recolored, mirrored, or flipped.</span></li>
        </ul>
      </section>

      <section>
        <span class="eyebrow">And more</span>
        <h2>More to explore</h2>
        <ul class="features">
          <li><span class="glyph">📅</span><strong>Daily Challenge</strong><span class="desc">One seeded puzzle a day, with a calendar to track and replay your streak.</span></li>
          <li><span class="glyph">📸</span><strong>Five image sources</strong><span class="desc">Random photos, your own library, Quick Snap with the camera, and more.</span></li>
          <li><span class="glyph">🏆</span><strong>Stats &amp; Achievements</strong><span class="desc">Personal bests, 39 unlockable achievements, and a Wall of Fame.</span></li>
          <li><span class="glyph">📱</span><strong>Widgets &amp; Live Activity</strong><span class="desc">Track a puzzle in progress right from the Lock Screen and home screen.</span></li>
        </ul>
      </section>
    </main>
  </div>
</PuzzleChrome>
```

Note: `Countdown.svelte` (Task 11) already renders its own pre/post-release badge rows and beta note, so those are dropped from here (they moved into the component) — this is the same content, just relocated with the timer it belongs to rather than duplicated in the parent.

- [ ] **Step 3: Write `web/pages/nine-tiles-puzzle.html`**

Head moved unchanged from `web/nine-tiles-puzzle/index.html` lines 1–11, paths updated to match the new explicit `/nine-tiles-puzzle/assets/...` static route (Task 4 below):

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>9 Tiles Puzzle</title>
  <meta name="description" content="A sliding-image puzzle for iOS. Fetch a photo, slice it into a grid, scramble the pieces, and put it back together across seven distinct game modes.">
  <link rel="icon" href="/nine-tiles-puzzle/assets/favicon.png">
  <link rel="apple-touch-icon" href="/nine-tiles-puzzle/assets/apple-touch-icon.png">
  <link rel="stylesheet" href="/nine-tiles-puzzle/style.css">
</head>
<body>
  <script type="module" src="./nine-tiles-puzzle.js"></script>
</body>
</html>
```

- [ ] **Step 4: Write `web/pages/nine-tiles-puzzle.js`**

```js
import { mount } from "svelte";
import NineTilesPuzzle from "../components/pages/NineTilesPuzzle.svelte";

mount(NineTilesPuzzle, { target: document.body });
```

- [ ] **Step 5: Modify `server.js`**

Add the puzzle's page route and its static-asset fallback (mirrors the same `serveWithin` pattern as `/assets/*`/`/css/*`, just rooted one level deeper):

```js
import nineTilesPuzzle from "./web/pages/nine-tiles-puzzle.html";

// ...

routes: {
  // ...existing routes...
  "/nine-tiles-puzzle": nineTilesPuzzle,
  "/nine-tiles-puzzle/*": (req) => serveWithin(WEB_DIR, new URL(req.url).pathname),
},
```

(Bun matches the exact `/nine-tiles-puzzle` route before falling back to the `/nine-tiles-puzzle/*` wildcard, so the page itself isn't shadowed by its own asset fallback.)

- [ ] **Step 6: Verify manually**

Run: `bun --hot server.js`
Open `http://127.0.0.1:4321/nine-tiles-puzzle`. Expected, matching today's page exactly:
- Aurora background pieces render with the same positions/rotations/opacities.
- The countdown ticks down live toward 28 Sept 2026, with each digit's tick animation firing on change.
- Feature lists and icon/app-store links render correctly; the icon (`/nine-tiles-puzzle/assets/icon.png`) and favicon load.
- Scrolling reveals each `<section>` via the fade/slide-in `in-view` class.

- [ ] **Step 7: Commit**

```bash
git add web/components/PuzzleChrome.svelte web/components/pages/NineTilesPuzzle.svelte \
  web/pages/nine-tiles-puzzle.html web/pages/nine-tiles-puzzle.js server.js
git commit -m "Compose and route the 9 Tiles Puzzle landing page"
```

---

### Task 13: PrivacyPolicy.svelte + its route

**Files:**
- Create: `web/components/pages/PrivacyPolicy.svelte`
- Create: `web/pages/nine-tiles-privacy.html`
- Create: `web/pages/nine-tiles-privacy.js`
- Modify: `server.js`

**Interfaces:**
- Consumes: `PuzzleChrome` (Task 12).

- [ ] **Step 1: Write `web/components/pages/PrivacyPolicy.svelte`**

Markup moved verbatim from `web/nine-tiles-puzzle/privacy-policy.html` lines 13–95 (the aurora div and the `.wrap.legal` content — no script in the original at all):

```svelte
<script>
  import PuzzleChrome from "../PuzzleChrome.svelte";

  const pieces = [
    { width: 110, height: 110, top: "6%", left: "8%", rotate: "-16deg", opacity: 0.05, duration: "19s", delay: "-2s" },
    { width: 80, height: 80, top: "22%", left: "84%", rotate: "30deg", opacity: 0.06, duration: "16s", delay: "-6s", alt: true },
    { width: 130, height: 130, top: "60%", left: "-4%", rotate: "14deg", opacity: 0.045, duration: "21s", delay: "-9s", alt: true },
    { width: 70, height: 70, top: "80%", left: "78%", rotate: "-36deg", opacity: 0.06, duration: "14s", delay: "-3s" },
  ];

  function pieceStyle(p) {
    return `width:${p.width}px; height:${p.height}px; top:${p.top}; left:${p.left}; --piece-rotate:${p.rotate}; --piece-opacity:${p.opacity}; --piece-duration:${p.duration}; --piece-delay:${p.delay};${p.alt ? " --piece-mask:var(--piece-svg-alt);" : ""}`;
  }
</script>

<div class="aurora" aria-hidden="true">
  {#each pieces as p, i (i)}
    <div class="piece" style={pieceStyle(p)}></div>
  {/each}
</div>

<PuzzleChrome>
  <div class="wrap legal">
    <a class="back-link" href="/nine-tiles-puzzle">← Back home</a>

    <h1>Privacy Policy</h1>
    <p class="updated">Last updated: July 19, 2026</p>

    <p>9 Tiles Puzzle ("the app") is developed by Filippo Cilia. This page explains what
    happens to your data when you use the app. The short version: there is no account,
    no analytics, no advertising, and no server operated by us — the app works entirely
    on your device.</p>

    <h2>Data we collect</h2>
    <p>We do not collect, transmit, or have access to any personal data. The app contains
    no analytics, advertising, or tracking software of any kind. All game progress —
    stats, streaks, achievements, Wall of Fame records, and settings — is stored locally
    on your device (and shared with the app's own widgets via an iOS App Group), and is
    never sent to us or to any third party.</p>

    <h2>Photos</h2>
    <p>If you choose a photo from your library as a puzzle source, that photo is read and
    sliced entirely on your device to build the puzzle grid. It is never uploaded anywhere.</p>

    <h2>Camera</h2>
    <p>The optional "Quick Snap" mode uses your camera to capture a photo that is
    immediately turned into a puzzle. The captured image is used in memory to build that
    one puzzle and is not uploaded or shared.</p>

    <h2>Internet-sourced photos</h2>
    <p>If you choose a random internet photo as a puzzle source (including the Daily
    Challenge), the app fetches an image from the third-party service
    <a href="https://picsum.photos">picsum.photos</a>. As with any network request, that
    service receives your device's IP address as part of standard internet
    communication; the app itself does not send it any additional personal information.
    See <a href="https://picsum.photos/">picsum.photos</a> for their own practices.</p>

    <h2>Notifications</h2>
    <p>The optional daily reminder is a local notification scheduled entirely on your
    device using iOS's notification system. No push server or third party is involved,
    and no data leaves your device.</p>

    <h2>Game Center</h2>
    <p>If you have Game Center enabled on your device, the app can use it for optional
    features like achievements. Game Center is operated by Apple and governed by
    <a href="https://www.apple.com/legal/privacy/">Apple's own Privacy Policy</a>; we do
    not receive your Game Center data.</p>

    <h2>Challenge Friends (nearby multiplayer)</h2>
    <p>The optional Challenge Friends feature connects directly to another nearby device
    over local Wi-Fi/Bluetooth to play together. This connection is peer-to-peer — no
    game data passes through any server we operate.</p>

    <h2>Purchases</h2>
    <p>In-app purchases and subscriptions are processed entirely by Apple through
    StoreKit. We never see or store your payment details; Apple's
    <a href="https://www.apple.com/legal/privacy/">Privacy Policy</a> governs that
    transaction.</p>

    <h2>Children's privacy</h2>
    <p>The app does not knowingly collect any personal data from anyone, including
    children, because it does not collect personal data at all.</p>

    <h2>Changes to this policy</h2>
    <p>If this policy changes, the update will be posted on this page with a revised
    "Last updated" date.</p>

    <h2>Contact</h2>
    <p>Questions about this policy can be sent to
    <a href="mailto:cilia.filippo@icloud.com">cilia.filippo@icloud.com</a>.</p>
  </div>
</PuzzleChrome>
```

Note: `PuzzleChrome`'s footer "Home" link (`/nine-tiles-puzzle`) replaces the original privacy page footer's second `index.html` link — both pointed at the same landing page, just via the old relative path.

- [ ] **Step 2: Write `web/pages/nine-tiles-privacy.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Privacy Policy — 9 Tiles Puzzle</title>
  <meta name="description" content="Privacy Policy for the 9 Tiles Puzzle iOS app.">
  <link rel="icon" href="/nine-tiles-puzzle/assets/favicon.png">
  <link rel="apple-touch-icon" href="/nine-tiles-puzzle/assets/apple-touch-icon.png">
  <link rel="stylesheet" href="/nine-tiles-puzzle/style.css">
</head>
<body>
  <script type="module" src="./nine-tiles-privacy.js"></script>
</body>
</html>
```

- [ ] **Step 3: Write `web/pages/nine-tiles-privacy.js`**

```js
import { mount } from "svelte";
import PrivacyPolicy from "../components/pages/PrivacyPolicy.svelte";

mount(PrivacyPolicy, { target: document.body });
```

- [ ] **Step 4: Modify `server.js`**

```js
import nineTilesPrivacy from "./web/pages/nine-tiles-privacy.html";

// ...

routes: {
  // ...existing routes...
  "/nine-tiles-puzzle/privacy-policy": nineTilesPrivacy,
},
```

(This exact route is matched before the `/nine-tiles-puzzle/*` wildcard added in Task 12, same priority rule as `/nine-tiles-puzzle` itself.)

- [ ] **Step 5: Verify manually**

Run: `bun --hot server.js`
Open `http://127.0.0.1:4321/nine-tiles-puzzle/privacy-policy`. Expected: identical content and aurora background to today's page; "← Back home" and the footer's "Home" link both go to `/nine-tiles-puzzle`.

- [ ] **Step 6: Commit**

```bash
git add web/components/pages/PrivacyPolicy.svelte web/pages/nine-tiles-privacy.html \
  web/pages/nine-tiles-privacy.js server.js
git commit -m "Compose and route the puzzle's privacy policy page"
```

---

### Task 14: Finish the redirects, clean up superseded files, update scripts

**Files:**
- Modify: `server.js`
- Modify: `package.json`
- Delete: `public/` (already staged as deleted — this task's commit finishes that removal)
- Delete: `web/index.html`, `web/app.html`, `web/style-guide.html`, `web/js/*.js`, `web/nine-tiles-puzzle/index.html`, `web/nine-tiles-puzzle/app.js`, `web/nine-tiles-puzzle/privacy-policy.html`

- [ ] **Step 1: Add the remaining redirect to `server.js`**

The `/app-store` → `/home#apps` redirect from the old server was never carried over — add it:

```js
routes: {
  // ...existing routes...
  "/app-store": () => Response.redirect("/home#apps", 301),
},
```

- [ ] **Step 2: Delete superseded source files**

```bash
git rm web/index.html web/app.html web/style-guide.html
git rm web/js/nav.js web/js/apps-feed.js web/js/app-card.js web/js/floating-icons.js web/js/intro-flip.js
git rm web/nine-tiles-puzzle/index.html web/nine-tiles-puzzle/app.js web/nine-tiles-puzzle/privacy-policy.html
```

- [ ] **Step 3: Confirm `public/`'s staged deletion is still intact**

This plan's commits never touched `public/`; its removal was already staged before this migration started. Confirm nothing has changed there:

Run: `git status --short public/`
Expected: every line still starts with ` D` (staged deletion, unmodified working tree) — same as before this plan began. If so, nothing further to do; the final commit in this task will include finishing that removal alongside the new `web/` cleanup.

- [ ] **Step 4: Add `dev`/`build`/`start` scripts to `package.json`**

```json
{
  "name": "cilippofilia-site",
  "private": true,
  "scripts": {
    "dev": "bun --hot server.js",
    "build": "bun build --target=bun --production --outdir=dist ./server.js",
    "start": "bun dist/server.js"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "prettier": "^3.9.6"
  },
  "peerDependencies": {
    "typescript": "^5"
  },
  "dependencies": {
    "animejs": "^4.5.0",
    "bun-plugin-svelte": "^0.0.6",
    "svelte": "^5.57.0"
  }
}
```

- [ ] **Step 5: Verify the production build**

Run: `bun run build`
Expected: builds without error into `dist/`.

Run: `bun run start`
Expected: server starts; spot-check `http://127.0.0.1:4321/home`, `/style-guide`, `/the-relay`, `/nine-tiles-puzzle`, and `/nine-tiles-puzzle/privacy-policy` all render correctly in production mode (minified, no HMR, same content as dev).

- [ ] **Step 6: Full regression pass**

Run: `bun run dev`, then check every route once more end to end: `/`, `/home`, `/style-guide`, `/the-relay`, `/nonexistent-slug`, `/nine-tiles-puzzle`, `/nine-tiles-puzzle/privacy-policy`, `/app-store`, `/apps.json`, `/api/appstore-apps`, `/favicon.ico`. Also run the full unit test suite:

Run: `bun test`
Expected: all `web/lib/*.test.js` tests pass (10 total: 7 from `app-card.test.js`, 3 from `countdown.test.js`).

- [ ] **Step 7: Commit**

```bash
git add server.js package.json
git commit -m "Finish redirects, add dev/build/start scripts, remove superseded files"
```
