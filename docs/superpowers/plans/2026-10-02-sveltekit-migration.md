# SvelteKit Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite cilippofilia.dev as a SvelteKit app, deployed with adapter-netlify. Every current URL, page, game and visual detail stays the same.

**Architecture:**
- **Pages:** prerendered from `src/routes/`, in two layout groups. `(site)` is the main site. `(landing)` is the four app landing pages.
- **Endpoints:** `/api/appstore-apps` runs as a Netlify Function. The score endpoints are Bun-only and return 503 elsewhere.
- **Imperative modules** (intro flip, maze, maze explainer, 404 game) keep their internals. They're exposed as `init…(root, { signal })` functions that components call from `onMount`.
- **Build order:** the old site under `web/` keeps working until the cutover task, so both can run side by side for visual comparison.

**Tech Stack:** Bun, SvelteKit 2 + Svelte 5 (runes), Vite (run with `bunx --bun`), `@sveltejs/adapter-netlify`, `bun:test`, `bun:sqlite`, animejs, Prettier + `prettier-plugin-svelte`.

**Spec:** `docs/superpowers/specs/2026-10-02-sveltekit-migration-design.md`. Read it before starting; every task implicitly includes it.

## Global Constraints

- **Like-for-like port.** No redesign, no copy edits, no new pages. Markup is copied from `web/` verbatim, apart from the transformations each task lists.
- **Dependencies.** Only `svelte`, `@sveltejs/kit`, `vite`, `@sveltejs/vite-plugin-svelte`, `@sveltejs/adapter-netlify` and `prettier-plugin-svelte` get added (as devDependencies, the SvelteKit convention). `animejs` stays the one runtime dependency. Anything else: ask first.
- **Runtime split:**
  - `src/lib/server/appstore.js`, and anything the Netlify function imports, must run on Node: no Bun-only APIs.
  - `bun:sqlite` is only ever loaded through a non-literal dynamic `import()` on Bun.
- **`$lib` in tested files.** Any `.js` file a `bun test` imports must use relative imports, never `$lib/…` or `$app/…`, because `bun test` doesn't resolve SvelteKit aliases. `.svelte` files and `+page.js`/`+layout.js` may use `$lib`.
- **Copy rules.** Page titles use `·`, never em dashes. British English, en-GB dates. The public contact address is `cilia.filippo.dev@gmail.com`; the iCloud address never goes in anything published.
- **Dark only.** Tokens first. Glass never stacks. Every animation gets a `prefers-reduced-motion` override.
- **Comments.** They explain *why*, in full sentences, matching the existing house style. Keep the existing comments when moving code.
- **Commits.** Subjects are imperative, sentence case, no prefix, no trailing period. Every commit message ends with:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
- **Formatting.** Format new and moved files with Prettier (`bunx prettier --write <files>`). Never format the whole repo.
- **Before each commit:** run `bun test`, and expect all pass.
- **Dev server:** binds `127.0.0.1:4321`. The old server can run alongside with `PORT=4322 bun server.js` until Task 13 deletes it.

## Review Focus

1. **Score API on Netlify:** a request there gets a `503` JSON body, not a 404 page. Both games must treat any non-OK response as "no scores" and play on. Pinned by the 503 tests in Task 3, plus the `r.ok` guards added in Tasks 7 and 9.
2. **Oversized or malformed score POSTs** (body over 1024 bytes, invalid JSON, missing fields) record nothing and still return the current best or leaderboard with status 200. Pinned in Task 3.
3. **Cross-origin writes:** a `POST` to `/api/*` with a foreign, `null` or unparseable `Origin` gets 403. A same-origin `POST`, or one with no `Origin` (curl), passes. Pinned in Task 4.
4. **Slug collisions:** an `apps.json` slug that collides with a landing app, a reserved path, or fails the slug pattern never gets a dev page. Unknown slugs 404. Pinned in Task 2 (dev-apps tests) and Task 12 (build test).
5. **Apple feed down on a cold start:** `/api/appstore-apps` returns `[]` with `Cache-Control: no-store`, and the home page hides the App Store heading rather than showing an empty block. Pinned in Task 3 (appstore tests) and Task 7 (`buildAppsBlock` returns nothing to show).

---

## File map

| New file | Responsibility |
|---|---|
| `svelte.config.js` | adapter-netlify, `kit.csp` (hash mode, `script-src` only) |
| `vite.config.js` | sveltekit plugin, dev server `127.0.0.1:4321` |
| `src/app.html` | document shell: `lang="en"`, charset, viewport, theme-color, `data-sveltekit-reload` |
| `src/hooks.js` | `reroute`: `/<app>/privacy-policy.html` → `/<app>/privacy-policy` |
| `src/hooks.server.js` | dev redirects, `/favicon.ico`, cross-origin write guard, security headers |
| `src/lib/server/paths.js` | `ROOT`, `SCORES_DIR`, `ensureScoresDir()` |
| `src/lib/server/security-headers.js` | the one header list (header CSP has `script-src 'self' 'unsafe-inline'`) |
| `src/lib/server/appstore.js` | iTunes lookup with cache + stale fallback, injectable fetch |
| `src/lib/server/maze-scores.js`, `notfound-scores.js` | SQLite stores (ESM ports) |
| `src/lib/server/score-stores.js` | `loadScoreStore(name)`: store module on Bun, `null` elsewhere |
| `src/lib/server/score-api.js` | request handling for both score endpoints |
| `src/lib/apps/names.js` | `splitName`, `isImageIcon` |
| `src/lib/apps/app-status.js` | moved unchanged |
| `src/lib/apps/dev-apps.js` | `apps.json` import, slug validation, `DEV_SLUGS_TO_SHOW` |
| `src/lib/apps/feed.js` | home page App Store block shaping |
| `src/lib/apps/meta.js` | `SITE_ORIGIN`, `appPageMeta` |
| `src/lib/apps/landing-apps.js` | `LANDING_APPS` list |
| `src/lib/site-pages.js` | `sitemapPaths()` |
| `src/lib/games/*.js` | maze-wilson, maze-move, notfound-game-logic (moved), maze-game, maze-explainer, notfound-game (init ports) |
| `src/lib/intro/intro-flip.js` | init port |
| `src/lib/actions/reveal.js`, `landing-reveal.js` | Svelte actions |
| `src/lib/styles/*.css` | copied CSS (global) |
| `src/lib/components/*.svelte` | Seo, Header, Footer, FloatingIcons, AppCard, FeaturedStrip, AppsSection, AppDetail, MazeSection, NotFoundGame, LandingCountdown |
| `src/routes/**` | per the spec's route tree |
| `src/build-output.test.js` | builds once and checks the prerendered output |

---

### Task 1: Scaffold SvelteKit and check the three risky assumptions

This task installs the toolchain and answers three questions before any porting starts:
- Does Vite under Bun load `bun:sqlite` in dev?
- Does the build keep `bun:sqlite` out of the server bundle?
- Where does the prerendered output land, including a `trailingSlash = 'never'` page reached through `reroute`?

**Files:**
- Modify: `package.json`, `.gitignore`, `.prettierrc`, `tsconfig.json`
- Create: `svelte.config.js`, `vite.config.js`, `src/app.html`, `src/hooks.js`, `src/routes/+layout.js`, `src/routes/+layout.svelte`, `src/routes/(site)/home/+page.svelte` (placeholder)
- Temporary (deleted in this task): `src/routes/spike-sqlite/+server.js`, `src/routes/(landing)/drinko/privacy-policy/+page.svelte` (placeholder)

- [ ] **Step 1: Install dependencies**

```bash
bun add -d @sveltejs/kit svelte vite @sveltejs/vite-plugin-svelte @sveltejs/adapter-netlify prettier-plugin-svelte
```

Expected: `package.json` gains the six devDependencies, and `bun.lock` updates.

- [ ] **Step 2: Write `svelte.config.js`**

```js
import adapter from "@sveltejs/adapter-netlify";

// Only script-src goes in kit.csp. With style-src here too, SvelteKit would
// add hashes to it, which switches off 'unsafe-inline' and breaks every
// style="..." attribute the pages carry. The rest of the policy is sent as
// a header (src/lib/server/security-headers.js and netlify.toml); the
// browser enforces both, so the header's 'unsafe-inline' for scripts is
// narrowed by this meta policy to SvelteKit's one hashed bootstrap script.
/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
    csp: {
      mode: "hash",
      directives: { "script-src": ["self"] },
    },
  },
};

export default config;
```

- [ ] **Step 3: Write `vite.config.js`**

```js
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

// Bound to 127.0.0.1 like the old server.js: this is a local dev server,
// not something to expose on the network.
export default defineConfig({
  plugins: [sveltekit()],
  server: { host: "127.0.0.1", port: 4321, strictPort: true },
  preview: { host: "127.0.0.1", port: 4321, strictPort: true },
});
```

- [ ] **Step 4: Write `src/app.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    %sveltekit.head%
  </head>
  <!-- data-sveltekit-reload: every link is a full page load, as on the old
       multi-page site. Each page's global stylesheet, :root theme tokens and
       window listeners then start clean instead of carrying over. -->
  <body data-sveltekit-reload>
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

- [ ] **Step 5: Write the root layout and the reroute hook**

`src/routes/+layout.js`:

```js
// Every page is prerendered to static HTML; only the API routes opt out.
export const prerender = true;
export const trailingSlash = "never";
```

`src/routes/+layout.svelte`:

```svelte
<script>
  let { children } = $props();
</script>

{@render children()}
```

`src/hooks.js`:

```js
// App Store listings link to each landing page's privacy policy at its old
// .html URL. The page itself lives at /<app>/privacy-policy (prerendered to
// <app>/privacy-policy.html on Netlify); this maps the .html path onto it
// so the same URL also resolves under vite dev.
const PRIVACY_HTML = /^\/(drinko|iterly|itswritten|nine-tiles-puzzle)\/privacy-policy\.html$/;

/** @type {import('@sveltejs/kit').Reroute} */
export function reroute({ url }) {
  const match = url.pathname.match(PRIVACY_HTML);
  if (match) return `/${match[1]}/privacy-policy`;
}
```

- [ ] **Step 6: Add the placeholder and spike routes**

`src/routes/(site)/home/+page.svelte`:

```svelte
<h1>Placeholder</h1>
<a href="/drinko/privacy-policy.html">privacy</a>
```

`src/routes/(landing)/drinko/privacy-policy/+page.js`:

```js
export const csr = false;
```

`src/routes/(landing)/drinko/privacy-policy/+page.svelte`:

```svelte
<h1>Privacy placeholder</h1>
```

`src/routes/spike-sqlite/+server.js`:

```js
export const prerender = false;

export async function GET() {
  if (typeof Bun === "undefined") return new Response("not bun", { status: 503 });
  const BUN_SQLITE = "bun:sqlite";
  const { Database } = await import(/* @vite-ignore */ BUN_SQLITE);
  const db = new Database(":memory:");
  return new Response(String(db.query("SELECT 1 + 1 AS n").get().n));
}
```

- [ ] **Step 7: Update `package.json` scripts, `.gitignore`, `.prettierrc` and `tsconfig.json`**

Leave the old `start` script pointing at `bun server.js` until Task 13, and rename the old `build` script:

```json
"scripts": {
  "dev": "bunx --bun vite dev",
  "build": "bunx --bun vite build",
  "preview": "bunx --bun vite preview",
  "legacy:build": "bun build src/client/floating-icons.js --outfile web/js/floating-icons.bundle.js --minify --target browser",
  "legacy:start": "bun run legacy:build && PORT=4322 bun server.js",
  "test": "bun test",
  "format": "prettier --write .",
  "format:check": "prettier --check ."
}
```

`.gitignore`: append

```
# SvelteKit / adapter-netlify output
.svelte-kit/
build/
.netlify/
```

`.prettierrc`:

```json
{
  "printWidth": 120,
  "trailingComma": "es5",
  "plugins": ["prettier-plugin-svelte"],
  "overrides": [{ "files": "*.svelte", "options": { "parser": "svelte" } }]
}
```

`tsconfig.json`: replace the whole file with

```json
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "allowJs": true,
    "checkJs": false,
    "moduleResolution": "bundler",
    "types": ["bun"],
    "skipLibCheck": true,
    "strict": true
  }
}
```

- [ ] **Step 8: Check dev-time `bun:sqlite`**

1. Run `bun run dev` in the background.
2. Run `curl -s http://localhost:4321/spike-sqlite`.
   - Expected output: `2`.
   - If it errors resolving `bun:sqlite`: add `ssr: { external: ["bun:sqlite"] }` to `vite.config.js`, restart, and retry. Record which of these worked in the commit message.
3. Run `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:4321/drinko/privacy-policy.html`.
   - Expected: `200`.
4. Stop the dev server.

- [ ] **Step 9: Check the build output**

1. Run `bun run build`.
   - Expected: it succeeds.
2. Run `ls build build/drinko 2>/dev/null; find build -name '*.html' | sort; grep -rl 'bun:sqlite' .netlify build 2>/dev/null`. Record:
   - (a) the directory holding prerendered HTML. Expected: `build`. Task 12's `PUBLISH_DIR` and Task 13's `netlify.toml` `publish` use this value.
   - (b) the privacy page's file. Expected: `build/drinko/privacy-policy.html`. If it is `build/drinko/privacy-policy/index.html` instead, record that and use the fallback in Task 10, Step 6.
   - (c) the `grep` output. It may list the server chunk containing the `import(BUN_SQLITE)` string. That's fine, since it's never executed on Node. It must not show a static `import … from "bun:sqlite"`.
3. Run `grep -o '<meta http-equiv="content-security-policy"[^>]*>' build/home.html`.
   - Expected: a meta tag whose `script-src` has `'self'` plus a `'sha256-…'` hash, and no `'unsafe-inline'`.

- [ ] **Step 10: Delete the spike route, keep the placeholders, run tests, commit**

```bash
rm -r src/routes/spike-sqlite
bun test
git add -A
git commit -m "Scaffold SvelteKit with adapter-netlify alongside the current site

<record the Step 8/9 findings here: dev sqlite approach, publish dir, privacy file path>

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Expected: the existing tests all pass, because nothing old was touched.

---

### Task 2: Move the pure logic into `src/lib` and split the app data helpers out

**Files:**
- Copy (old copies stay until Task 13):
  - `web/js/maze-wilson.js` (+ test) → `src/lib/games/`
  - `web/js/maze-move.js` (+ test) → `src/lib/games/`
  - `web/js/notfound-game-logic.js` (+ test) → `src/lib/games/`
  - `web/js/app-status.js` (+ test) → `src/lib/apps/`
- Create: `src/lib/apps/names.js`, `names.test.js`, `meta.js`, `meta.test.js`, `dev-apps.js`, `dev-apps.test.js`, `landing-apps.js`, `feed.js`, `feed.test.js`

**Interfaces produced:**
- `names.js`: `splitName(name) → { title, subtitle }`, `isImageIcon(icon) → boolean`
- `meta.js`: `SITE_ORIGIN`, `appPageMeta(app) → { title, description, url, image }`
- `landing-apps.js`: `LANDING_APPS: string[]`
- `dev-apps.js`: `SLUG_PATTERN`, `RESERVED_SLUGS`, `DEV_SLUGS_TO_SHOW`, `validDevApps(list?) → app[]`, `findDevApp(slug, list?) → app | undefined`, `publicDevApps(list?) → app[]`
- `feed.js`: `findUpcoming(published, now?)`, `publishedCard(app)`, `devCard(app)`, `buildAppsBlock(published, devApps, now?) → { upcoming, cards }`, `formatReleaseDate(iso) → string`

- [ ] **Step 1: Copy the logic modules and their tests**

```bash
mkdir -p src/lib/games src/lib/apps
cp web/js/maze-wilson.js web/js/maze-wilson.test.js web/js/maze-move.js web/js/maze-move.test.js \
   web/js/notfound-game-logic.js web/js/notfound-game-logic.test.js src/lib/games/
cp web/js/app-status.js web/js/app-status.test.js src/lib/apps/
bun test src/lib
```

Expected: PASS. They're self-contained modules with relative imports.

- [ ] **Step 2: Write the failing tests for `names.js` and `meta.js`**

`src/lib/apps/names.test.js`:

```js
import { test, expect } from "bun:test";
import { splitName, isImageIcon } from "./names.js";

test("splitName separates a title from its subtitle", () => {
  expect(splitName("Drinko: Cocktail Recipes")).toEqual({ title: "Drinko", subtitle: "Cocktail Recipes" });
  expect(splitName("relay")).toEqual({ title: "relay", subtitle: "" });
  expect(splitName(undefined)).toEqual({ title: "", subtitle: "" });
});

test("isImageIcon tells a path or URL from an emoji", () => {
  expect(isImageIcon("/assets/x.png")).toBe(true);
  expect(isImageIcon("https://is1-ssl.mzstatic.com/x.png")).toBe(true);
  expect(isImageIcon("🍸")).toBe(false);
  expect(isImageIcon(undefined)).toBe(false);
});
```

`src/lib/apps/meta.test.js`: copy the two `appPageMeta` tests and the `relay` fixture from `web/js/app-detail.test.js` verbatim, importing from `./meta.js`:

```js
import { test, expect } from "bun:test";
import { appPageMeta } from "./meta.js";

const relay = {
  slug: "the-relay",
  name: "relay",
  tagline: "An analog signal-sorting mystery.",
  description: "A decommissioned coastal relay station.",
  platforms: ["iPhone", "iPad", "Mac"],
  status: "In development",
  icon: "/assets/app-icons/thumb/relay-icon.png",
  appStoreUrl: "",
};

test("appPageMeta gives each app its own title, description, canonical and image", () => {
  expect(appPageMeta(relay)).toEqual({
    title: "relay · cilippofilia.dev",
    description: "An analog signal-sorting mystery.",
    url: "https://cilippofilia.dev/the-relay",
    image: "https://cilippofilia.dev/assets/app-icons/thumb/relay-icon.png",
  });
});

test("appPageMeta falls back to the site image for an emoji icon", () => {
  expect(appPageMeta({ ...relay, icon: "✨" }).image).toBe("https://cilippofilia.dev/assets/profile.jpg");
});
```

Run `bun test src/lib/apps`. Expected: FAIL, module not found.

- [ ] **Step 3: Implement `names.js` and `meta.js`**

`src/lib/apps/names.js`:

```js
// Name and icon helpers shared by every app card and detail page. The
// published apps (from Apple) and the unreleased ones (from data/apps.json)
// carry different fields, but both have a "Title: Subtitle" name and an
// icon that is either an emoji or a path to a real app icon.

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
```

`src/lib/apps/meta.js`:

```js
import { isImageIcon } from "./names.js";

// The production origin, for absolute canonical and og:image URLs.
export const SITE_ORIGIN = "https://cilippofilia.dev";

// Per-app page metadata: what a dev app page's <title>, description,
// canonical and Open Graph tags say. Prerendered, so crawlers see it too.
export function appPageMeta(app) {
  const url = `${SITE_ORIGIN}/${app.slug}`;
  const image = isImageIcon(app.icon) ? new URL(app.icon, SITE_ORIGIN).href : `${SITE_ORIGIN}/assets/profile.jpg`;
  return { title: `${app.name} · cilippofilia.dev`, description: app.tagline, url, image };
}
```

Run `bun test src/lib/apps`. Expected: PASS.

- [ ] **Step 4: Write the failing tests for `dev-apps.js`**

`src/lib/apps/dev-apps.test.js`:

```js
import { test, expect } from "bun:test";
import { validDevApps, findDevApp, publicDevApps } from "./dev-apps.js";

const app = (slug) => ({ slug, name: slug, status: "In development" });

test("validDevApps keeps well-formed slugs only", () => {
  const list = [app("the-relay"), app("bad slug"), app("../etc"), { name: "no slug" }, null, app("ok-2")];
  expect(validDevApps(list).map((a) => a.slug)).toEqual(["the-relay", "ok-2"]);
});

test("validDevApps drops slugs that a fixed route or landing page already owns", () => {
  const list = ["home", "privacy", "terms", "style-guide", "app-store", "api", "assets", "drinko", "nine-tiles-puzzle"]
    .map(app)
    .concat(app("fresh"));
  expect(validDevApps(list).map((a) => a.slug)).toEqual(["fresh"]);
});

test("validDevApps treats a non-array as empty", () => {
  expect(validDevApps({ slug: "x" })).toEqual([]);
});

test("findDevApp finds by exact slug among valid apps only", () => {
  const list = [app("the-relay"), app("drinko")];
  expect(findDevApp("the-relay", list).slug).toBe("the-relay");
  expect(findDevApp("drinko", list)).toBeUndefined();
  expect(findDevApp("THE-RELAY", list)).toBeUndefined();
});

test("publicDevApps is the shown subset, in apps.json order", () => {
  expect(publicDevApps([app("hidden"), app("the-relay")]).map((a) => a.slug)).toEqual(["the-relay"]);
});

test("the real data/apps.json parses and has the relay page", () => {
  expect(findDevApp("the-relay")).toBeDefined();
});
```

Run it. Expected: FAIL, module not found.

- [ ] **Step 5: Implement `landing-apps.js` and `dev-apps.js`**

`src/lib/apps/landing-apps.js`:

```js
// The custom landing pages under src/routes/(landing)/. Each one owns its
// slug, so an apps.json entry with the same slug never gets a dev page.
export const LANDING_APPS = ["drinko", "iterly", "itswritten", "nine-tiles-puzzle"];
```

`src/lib/apps/dev-apps.js`:

```js
// The in-development apps from data/apps.json, imported at build time.
// Every valid entry is prerendered to its own /<slug> page; the home page
// grid shows only DEV_SLUGS_TO_SHOW.

import apps from "../../../data/apps.json";
import { LANDING_APPS } from "./landing-apps.js";

export const SLUG_PATTERN = /^[a-zA-Z0-9-]+$/;

// First path segments a fixed route already owns.
export const RESERVED_SLUGS = new Set([
  "home",
  "style-guide",
  "privacy",
  "terms",
  "app-store",
  "api",
  "assets",
  ...LANDING_APPS,
]);

// While only relay is ready to show publicly, filter the rest of
// apps.json out here rather than deleting their entries.
export const DEV_SLUGS_TO_SHOW = ["the-relay"];

export function validDevApps(list = apps) {
  if (!Array.isArray(list)) return [];
  return list.filter(
    (app) => app && typeof app.slug === "string" && SLUG_PATTERN.test(app.slug) && !RESERVED_SLUGS.has(app.slug)
  );
}

export function findDevApp(slug, list = apps) {
  return validDevApps(list).find((app) => app.slug === slug);
}

export function publicDevApps(list = apps) {
  return validDevApps(list).filter((app) => DEV_SLUGS_TO_SHOW.includes(app.slug));
}
```

Run `bun test src/lib/apps`. Expected: PASS.

- [ ] **Step 6: Write the failing tests for `feed.js`**

`src/lib/apps/feed.test.js`:

```js
import { test, expect } from "bun:test";
import { buildAppsBlock, findUpcoming, formatReleaseDate, publishedCard, devCard } from "./feed.js";

const now = new Date("2026-10-02T12:00:00Z");
const live = { id: 1, name: "Drinko: Cocktail Recipes", tagline: "Cocktails.", icon: "/d.png", url: "https://apps.apple.com/d", genre: "Food", releaseDate: "2023-01-01T00:00:00Z", localUrl: "/drinko" };
const preorder = { ...live, id: 2, name: "9 Tiles Puzzle", releaseDate: "2026-12-01T00:00:00Z", localUrl: "/nine-tiles-puzzle" };
const relay = { slug: "the-relay", name: "relay", status: "In development", tagline: "Mystery.", icon: "/r.png", appStoreUrl: "" };

test("findUpcoming picks the app whose release date is still ahead", () => {
  expect(findUpcoming([live, preorder], now)).toBe(preorder);
  expect(findUpcoming([live], now)).toBeUndefined();
});

test("publishedCard and devCard normalise both feeds to card props", () => {
  expect(publishedCard(live)).toEqual({ status: "Live", websiteUrl: "/drinko", appStoreUrl: "https://apps.apple.com/d", icon: "/d.png", name: "Drinko: Cocktail Recipes", badge: "Live", badgeStyle: "live", tagline: "Cocktails." });
  expect(publishedCard({ ...live, tagline: "" }).tagline).toBe("Food");
  expect(devCard(relay)).toEqual({ status: "In development", websiteUrl: "/the-relay", appStoreUrl: "", icon: "/r.png", name: "relay", badge: "In development", badgeStyle: "dev", tagline: "Mystery." });
});

test("buildAppsBlock pulls the preorder out of the grid and sorts the rest by status", () => {
  const { upcoming, cards } = buildAppsBlock([live, preorder], [relay], now);
  expect(upcoming).toBe(preorder);
  expect(cards.map((c) => c.name)).toEqual(["Drinko: Cocktail Recipes", "relay"]);
});

test("buildAppsBlock with both feeds empty has nothing to show", () => {
  expect(buildAppsBlock([], [], now)).toEqual({ upcoming: undefined, cards: [] });
});

test("buildAppsBlock tolerates non-array feeds", () => {
  expect(buildAppsBlock(null, undefined, now)).toEqual({ upcoming: undefined, cards: [] });
});

test("formatReleaseDate is en-GB", () => {
  expect(formatReleaseDate("2026-09-28T00:00:00Z")).toBe("28 Sept 2026");
});
```

The `"Sept"` spelling is what ICU's en-GB short month gives on current Bun. If the runner prints `"28 Sep 2026"`, change the expectation to match that runtime's output; the old code used the same `toLocaleDateString` call.

Run it. Expected: FAIL, module not found.

- [ ] **Step 7: Implement `feed.js`**

`src/lib/apps/feed.js`:

```js
// Shapes the home page's App Store block from its two feeds: the published
// apps live from Apple (/api/appstore-apps) and the unreleased ones from
// data/apps.json. Both feed one continuous grid ordered by status (see
// app-status.js); the soonest unreleased Apple app is pulled out as the
// featured preorder strip instead.

import { badgeClass, sortByStatus } from "./app-status.js";

export const formatReleaseDate = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

// Whichever app is still a preorder gets the featured strip to itself.
// Computed from Apple's own release date, never hardcoded.
export function findUpcoming(publishedApps, now = new Date()) {
  return publishedApps.find((a) => a.releaseDate && new Date(a.releaseDate) > now);
}

export function publishedCard(app) {
  return {
    status: "Live",
    websiteUrl: app.localUrl,
    appStoreUrl: app.url,
    icon: app.icon,
    name: app.name,
    badge: "Live",
    badgeStyle: "live",
    tagline: app.tagline || app.genre,
  };
}

export function devCard(app) {
  return {
    status: app.status,
    websiteUrl: `/${app.slug}`,
    appStoreUrl: app.appStoreUrl,
    icon: app.icon,
    name: app.name,
    badge: app.status || "",
    badgeStyle: badgeClass(app.status),
    tagline: app.tagline,
  };
}

export function buildAppsBlock(publishedApps, devApps, now = new Date()) {
  const published = Array.isArray(publishedApps) ? publishedApps : [];
  const dev = Array.isArray(devApps) ? devApps : [];
  const upcoming = findUpcoming(published, now);
  const cards = sortByStatus([...published.filter((a) => a !== upcoming).map(publishedCard), ...dev.map(devCard)]);
  return { upcoming, cards };
}
```

Run `bun test src/lib`. Expected: PASS.

- [ ] **Step 8: Format and commit**

```bash
bunx prettier --write src/lib/apps src/lib/games
bun test
git add src/lib
git commit -m "Move the game and app logic into src/lib with the app data helpers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Server modules: paths, security headers, App Store, score stores and score API

**Files:**
- Create: `src/lib/server/paths.js`, `security-headers.js`, `appstore.js`, `appstore.test.js`, `maze-scores.js`, `maze-scores.test.js`, `notfound-scores.js`, `notfound-scores.test.js`, `score-stores.js`, `score-api.js`, `score-api.test.js`

**Interfaces produced:**
- `paths.js`: `ROOT`, `SCORES_DIR`, `ensureScoresDir() → string`
- `security-headers.js`: `SECURITY_HEADERS: Record<string,string>`
- `appstore.js`: `toApp(result)`, `createAppStore({ fetchImpl, now }) → { getPublishedApps }`, `getPublishedApps()`, `appstoreCacheControl(apps) → string`
- `maze-scores.js`: `getTop(limit=5)`, `submitEntry(timeMs, moves, limit=5)`
- `notfound-scores.js`: `getBest()`, `submitScore(score)`
- `score-stores.js`: `loadScoreStore("maze" | "notfound") → Promise<module | null>`
- `score-api.js`: `MAX_BODY_BYTES`, `mazeScore(request, store) → Promise<Response>`, `notfoundScore(request, store) → Promise<Response>`

- [ ] **Step 1: Write `paths.js` and `security-headers.js`**

`src/lib/server/paths.js`:

```js
// Where server-side state lives. Resolved from process.cwd(), which is the
// repo root under vite, bun test and Netlify's build: __dirname stops
// pointing into src/ once Vite has bundled the server code.

import fs from "node:fs";
import path from "node:path";

export const ROOT = process.cwd();

// Where the score databases live. bun test's auto-loaded .env.test points
// this at data/.test so test runs never write into the score files a
// running dev server reads.
export const SCORES_DIR = process.env.SCORES_DIR_OVERRIDE
  ? path.resolve(ROOT, process.env.SCORES_DIR_OVERRIDE)
  : path.join(ROOT, "data");

// Called by the score stores, not at import, so merely importing this on a
// read-only filesystem (a Netlify Function) never tries to create a folder.
export function ensureScoresDir() {
  fs.mkdirSync(SCORES_DIR, { recursive: true });
  return SCORES_DIR;
}
```

`src/lib/server/security-headers.js`: copy the `SECURITY_HEADERS` object and its comment from `src/server/static.js:47-79` verbatim, as `export const SECURITY_HEADERS = { … }`, with exactly these changes:
- The CSP array's `"script-src 'self'"` becomes `"script-src 'self' 'unsafe-inline'"`.
- The comment's script bullet is replaced with:

```js
// - Scripts: this header allows 'self' and inline, and SvelteKit's
//   <meta http-equiv="Content-Security-Policy"> (kit.csp in
//   svelte.config.js) narrows that to 'self' plus the hash of its one
//   bootstrap script. Browsers enforce both policies, so no other inline
//   script, on…= attribute or javascript: URL can run. The header can't
//   carry the hashes itself because they differ per page.
```

- The first comment line becomes `// Sent on every response (hooks.server.js) and kept identical to the [[headers]] block in netlify.toml; src/build-output.test.js fails if the two drift apart.`

- [ ] **Step 2: Write the failing App Store tests**

`src/lib/server/appstore.test.js`:

```js
import { test, expect } from "bun:test";
import { createAppStore, toApp, appstoreCacheControl } from "./appstore.js";

const result = {
  wrapperType: "software",
  trackId: 6449893371,
  trackName: "Drinko: Cocktail Recipes",
  description: "Make cocktails.\nMore text",
  artworkUrl100: "https://is1-ssl.mzstatic.com/x/100x100bb.jpg",
  trackViewUrl: "https://apps.apple.com/app/id6449893371",
  primaryGenreName: "Food & Drink",
  releaseDate: "2023-05-01T00:00:00Z",
};

const ok = (results) => async () => new Response(JSON.stringify({ results }));

test("toApp maps a lookup result and links custom landing pages", () => {
  expect(toApp(result)).toEqual({
    id: 6449893371,
    name: "Drinko: Cocktail Recipes",
    tagline: "Make cocktails.",
    icon: "https://is1-ssl.mzstatic.com/x/512x512bb.jpg",
    url: "https://apps.apple.com/app/id6449893371",
    genre: "Food & Drink",
    releaseDate: "2023-05-01T00:00:00Z",
    localUrl: "/drinko",
  });
  expect(toApp({ ...result, trackId: 1 }).localUrl).toBeNull();
});

test("getPublishedApps keeps software results only", async () => {
  const store = createAppStore({ fetchImpl: ok([{ wrapperType: "artist" }, result]) });
  expect((await store.getPublishedApps()).map((a) => a.id)).toEqual([6449893371]);
});

test("a fresh cache is served without refetching", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls++;
    return new Response(JSON.stringify({ results: [result] }));
  };
  let t = 0;
  const store = createAppStore({ fetchImpl, now: () => t });
  await store.getPublishedApps();
  t = 9 * 60 * 1000;
  await store.getPublishedApps();
  expect(calls).toBe(1);
  t = 11 * 60 * 1000;
  await store.getPublishedApps();
  expect(calls).toBe(2);
});

test("a failed refresh serves the last good result", async () => {
  let fail = false;
  const fetchImpl = async () => {
    if (fail) throw new Error("offline");
    return new Response(JSON.stringify({ results: [result] }));
  };
  let t = 0;
  const store = createAppStore({ fetchImpl, now: () => t });
  await store.getPublishedApps();
  fail = true;
  t = 60 * 60 * 1000;
  expect((await store.getPublishedApps()).length).toBe(1);
});

test("a cold start with Apple unreachable gives an empty list", async () => {
  const store = createAppStore({ fetchImpl: async () => new Response("<html>", { status: 503 }) });
  expect(await store.getPublishedApps()).toEqual([]);
});

test("an empty list is never cached by the CDN", () => {
  expect(appstoreCacheControl([])).toBe("no-store");
  expect(appstoreCacheControl([{}])).toBe("public, max-age=0, s-maxage=600");
});
```

Run `bun test src/lib/server/appstore.test.js`. Expected: FAIL, module not found.

- [ ] **Step 3: Implement `appstore.js`**

`src/lib/server/appstore.js`:

```js
// Live App Store data: everything Filippo Carlo Cilia has actually shipped,
// read straight from Apple rather than kept in a list here, so newly
// published apps appear on the site with no editing.
//
// Runs on Node inside the Netlify Function as well as on Bun locally, so
// no Bun-only APIs here. fetch is injectable so the cache can be tested
// without the network.

// https://apps.apple.com/us/developer/filippo-carlo-cilia/id1690376038
const APPLE_DEVELOPER_ID = "1690376038";
const LOOKUP_URL = `https://itunes.apple.com/lookup?id=${APPLE_DEVELOPER_ID}&entity=software&limit=200`;
const CACHE_MS = 10 * 60 * 1000;
const TIMEOUT_MS = 8000;

// Published apps that also have their own landing page on this site
// instead of just linking straight out to Apple.
const CUSTOM_APP_PAGES = {
  6449893371: "drinko", // Drinko: Cocktail Recipes
  6757445119: "itswritten", // itsWritten: AI Journal
  6760037639: "iterly", // Iterly: Ship Your Apps
  6776386637: "nine-tiles-puzzle", // 9 Tiles Puzzle
};

export function toApp(r) {
  return {
    id: r.trackId,
    name: r.trackName,
    tagline: (r.description || "").split(/\n/)[0].slice(0, 160),
    icon: (r.artworkUrl100 || "").replace("100x100bb", "512x512bb"),
    url: r.trackViewUrl,
    genre: r.primaryGenreName || "",
    releaseDate: r.releaseDate || null,
    localUrl: CUSTOM_APP_PAGES[r.trackId] ? `/${CUSTOM_APP_PAGES[r.trackId]}` : null,
  };
}

export function createAppStore({ fetchImpl = (...args) => fetch(...args), now = Date.now } = {}) {
  let cache = { fetchedAt: 0, apps: [] };

  async function fetchPublishedApps() {
    const res = await fetchImpl(LOOKUP_URL, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`iTunes lookup answered ${res.status}`);
    const parsed = await res.json();
    return (parsed.results || []).filter((r) => r.wrapperType === "software").map(toApp);
  }

  // Cached for a few minutes so a page reload doesn't hit Apple every time.
  // A failed refresh serves the last good result rather than failing the
  // request: being a few minutes stale beats an empty page.
  async function getPublishedApps() {
    const isFresh = now() - cache.fetchedAt < CACHE_MS;
    if (isFresh && cache.apps.length) return cache.apps;
    try {
      const apps = await fetchPublishedApps();
      cache = { fetchedAt: now(), apps };
      return apps;
    } catch (err) {
      console.error("Couldn't refresh App Store apps:", err.message);
      return cache.apps; // possibly empty, on a cold start with no network
    }
  }

  return { getPublishedApps };
}

const defaultStore = createAppStore();
export const getPublishedApps = () => defaultStore.getPublishedApps();

// An empty list means Apple couldn't be reached on a cold start; don't let
// the CDN hold onto that for the full 10 minutes.
export function appstoreCacheControl(apps) {
  return apps.length ? "public, max-age=0, s-maxage=600" : "no-store";
}
```

Run `bun test src/lib/server/appstore.test.js`. Expected: PASS.

- [ ] **Step 4: Port the score stores**

`src/lib/server/maze-scores.js`: copy `src/server/maze-scores.js` with these exact changes:
- Replace the three `require` lines with:

```js
import path from "node:path";
import { ensureScoresDir } from "./paths.js";

// Loaded through a non-literal specifier so neither Vite's SSR build nor
// Netlify's function bundler tries to follow it: this module is only ever
// imported on Bun (see score-stores.js).
const BUN_SQLITE = "bun:sqlite";
const { Database } = await import(/* @vite-ignore */ BUN_SQLITE);
```

- `new Database(path.join(SCORES_DIR, "maze-scores.db"))` becomes `new Database(path.join(ensureScoresDir(), "maze-scores.db"))`.
- `function getTop` and `function submitEntry` become `export function …`, and the `module.exports` line is deleted.

`src/lib/server/notfound-scores.js`: same treatment for `src/server/notfound-scores.js`:
- the same import block
- `ensureScoresDir()` for `notfound-scores.db`
- export `getBest` and `submitScore`, and delete `module.exports`
- Replace the header comment's last three sentences ("the site only runs locally today … not here.") with: `Saved only where the site runs on Bun (locally); on Netlify the score endpoints answer 503 and the game plays on without one.`

`src/lib/server/maze-scores.test.js`: copy `src/server/maze-scores.test.js` verbatim. Its import is already `./maze-scores.js`.

`src/lib/server/notfound-scores.test.js`:

```js
import { test, expect } from "bun:test";
import { getBest, submitScore } from "./notfound-scores.js";

test("submitScore only ever raises the best", () => {
  const start = getBest();
  expect(submitScore(start + 5)).toBe(start + 5);
  expect(submitScore(start + 1)).toBe(start + 5);
  expect(getBest()).toBe(start + 5);
});

test("submitScore ignores junk and floors fractions", () => {
  const start = getBest();
  expect(submitScore(NaN)).toBe(start);
  expect(submitScore(-3)).toBe(start);
  expect(submitScore(start + 2.9)).toBe(start + 2);
});
```

Run `bun test src/lib/server`. Expected: PASS. If `data/.test/` is missing, `ensureScoresDir` creates it.

- [ ] **Step 5: Write the failing score-API tests**

`src/lib/server/score-api.test.js`:

```js
import { test, expect } from "bun:test";
import { mazeScore, notfoundScore, MAX_BODY_BYTES } from "./score-api.js";
import { loadScoreStore } from "./score-stores.js";

const post = (body) => new Request("http://localhost/api/x", { method: "POST", body });
const get = () => new Request("http://localhost/api/x");

function fakeMaze() {
  const calls = [];
  return { calls, getTop: () => [{ timeMs: 1, moves: 1 }], submitEntry: (t, m) => (calls.push([t, m]), [{ timeMs: t, moves: m }]) };
}
function fakeNotfound() {
  const calls = [];
  return { calls, getBest: () => 7, submitScore: (s) => (calls.push(s), 9) };
}

test("GET returns the current leaderboard and best", async () => {
  expect(await (await mazeScore(get(), fakeMaze())).json()).toEqual({ top: [{ timeMs: 1, moves: 1 }] });
  expect(await (await notfoundScore(get(), fakeNotfound())).json()).toEqual({ best: 7 });
});

test("POST submits the parsed fields", async () => {
  const maze = fakeMaze();
  await mazeScore(post(JSON.stringify({ timeMs: 1234.5, moves: 30 })), maze);
  expect(maze.calls).toEqual([[1234.5, 30]]);
  const nf = fakeNotfound();
  const res = await notfoundScore(post(JSON.stringify({ score: 12 })), nf);
  expect(nf.calls).toEqual([12]);
  expect(await res.json()).toEqual({ best: 9 });
});

test("malformed JSON counts as no input but still answers 200", async () => {
  const maze = fakeMaze();
  const res = await mazeScore(post("{not json"), maze);
  expect(res.status).toBe(200);
  expect(maze.calls).toEqual([[0, 0]]);
  const nf = fakeNotfound();
  expect((await notfoundScore(post("nope"), nf)).status).toBe(200);
  expect(nf.calls).toEqual([0]);
});

test("a body over the cap is dropped, not parsed", async () => {
  const nf = fakeNotfound();
  const huge = JSON.stringify({ score: 5, pad: "x".repeat(MAX_BODY_BYTES) });
  await notfoundScore(post(huge), nf);
  expect(nf.calls).toEqual([0]);
});

test("missing fields count as no input", async () => {
  const maze = fakeMaze();
  await mazeScore(post(JSON.stringify({ moves: 3 })), maze);
  expect(maze.calls).toEqual([[0, 3]]);
});

test("with no store (not on Bun) both endpoints answer 503 JSON", async () => {
  for (const handler of [mazeScore, notfoundScore]) {
    const res = await handler(get(), null);
    expect(res.status).toBe(503);
    expect(res.headers.get("content-type")).toContain("application/json");
  }
});

test("loadScoreStore returns the real store modules on Bun", async () => {
  expect(typeof (await loadScoreStore("maze")).getTop).toBe("function");
  expect(typeof (await loadScoreStore("notfound")).getBest).toBe("function");
});
```

Run it. Expected: FAIL, module not found.

- [ ] **Step 6: Implement `score-stores.js` and `score-api.js`**

`src/lib/server/score-stores.js`:

```js
// The score stores need bun:sqlite, which only exists on Bun. On Netlify
// (Node) there is nowhere to keep them, so the endpoints get null and
// answer 503; both games already play on without a saved score.
export async function loadScoreStore(name) {
  if (typeof Bun === "undefined") return null;
  return name === "maze" ? import("./maze-scores.js") : import("./notfound-scores.js");
}
```

`src/lib/server/score-api.js`:

```js
// Request handling for /api/maze-score and /api/notfound-score, kept out of
// the +server.js files so it can be tested with plain Request objects and a
// fake store.

// The score APIs take a few dozen bytes of JSON. Anything past this is not
// a real submission, so it's dropped rather than parsed: the handler then
// sees no input, records nothing, and still returns the real scores.
export const MAX_BODY_BYTES = 1024;

async function readJson(request) {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return {};
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

const unavailable = () => Response.json({ error: "Scores aren't saved on this deployment." }, { status: 503 });

export async function mazeScore(request, store) {
  if (!store) return unavailable();
  if (request.method === "POST") {
    const { timeMs = 0, moves = 0 } = await readJson(request);
    return Response.json({ top: store.submitEntry(timeMs, moves) });
  }
  return Response.json({ top: store.getTop() });
}

export async function notfoundScore(request, store) {
  if (!store) return unavailable();
  if (request.method === "POST") {
    const { score = 0 } = await readJson(request);
    return Response.json({ best: store.submitScore(score) });
  }
  return Response.json({ best: store.getBest() });
}
```

Run `bun test src/lib/server`. Expected: PASS.

- [ ] **Step 7: Format and commit**

```bash
bunx prettier --write src/lib/server
bun test
git add src/lib/server
git commit -m "Port the server modules to ES modules behind testable score and App Store APIs

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Server hook and API routes

**Files:**
- Create: `src/hooks.server.js`, `src/hooks.server.test.js`, `src/routes/api/appstore-apps/+server.js`, `src/routes/api/maze-score/+server.js`, `src/routes/api/notfound-score/+server.js`

**Interfaces:**
- Consumes: `SECURITY_HEADERS`, `getPublishedApps`, `appstoreCacheControl`, `loadScoreStore`, `mazeScore`, `notfoundScore` (Task 3)
- Produces: `handle`, `REDIRECTS`, `isForeignWrite(request, url) → boolean` from `src/hooks.server.js`

- [ ] **Step 1: Write the failing hook tests**

`src/hooks.server.test.js`:

```js
import { test, expect } from "bun:test";
import { handle, isForeignWrite } from "./hooks.server.js";
import { SECURITY_HEADERS } from "./lib/server/security-headers.js";

function event(path, { method = "GET", origin } = {}) {
  const url = new URL(path, "http://localhost:4321");
  const headers = origin === undefined ? {} : { origin };
  return { url, request: new Request(url, { method, headers }) };
}
const resolveOk = async () => new Response("ok", { headers: { "content-type": "text/html" } });

test("/ and /app-store redirect like before", async () => {
  const home = await handle({ event: event("/"), resolve: resolveOk });
  expect(home.status).toBe(302);
  expect(home.headers.get("location")).toBe("/home");
  const store = await handle({ event: event("/app-store"), resolve: resolveOk });
  expect(store.status).toBe(301);
  expect(store.headers.get("location")).toBe("/home#apps");
});

test("/favicon.ico serves the SVG favicon", async () => {
  const res = await handle({ event: event("/favicon.ico"), resolve: resolveOk });
  expect(res.status).toBe(200);
  expect(res.headers.get("content-type")).toBe("image/svg+xml");
  expect(await res.text()).toContain("<svg");
});

test("every response carries the security headers", async () => {
  const res = await handle({ event: event("/home"), resolve: resolveOk });
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    expect(res.headers.get(name)).toContain(value);
  }
});

test("a CSP SvelteKit already set is kept alongside ours", async () => {
  const resolve = async () => new Response("ok", { headers: { "content-security-policy": "script-src 'self' 'sha256-abc'" } });
  const res = await handle({ event: event("/home"), resolve });
  const csp = res.headers.get("content-security-policy");
  expect(csp).toContain("'sha256-abc'");
  expect(csp).toContain("frame-ancestors 'none'");
});

test("isForeignWrite: reads and same-origin or originless writes pass", () => {
  const url = new URL("http://localhost:4321/api/maze-score");
  expect(isForeignWrite(new Request(url, { method: "POST" }), url)).toBe(false);
  expect(isForeignWrite(new Request(url, { method: "POST", headers: { origin: "http://localhost:4321" } }), url)).toBe(false);
  expect(isForeignWrite(new Request(url, { headers: { origin: "https://evil.example" } }), url)).toBe(false);
});

test("isForeignWrite: foreign, null or garbage origins on a write are foreign", () => {
  const url = new URL("http://localhost:4321/api/maze-score");
  for (const origin of ["https://evil.example", "null", "::::", "http://localhost:5173"]) {
    expect(isForeignWrite(new Request(url, { method: "POST", headers: { origin } }), url)).toBe(true);
  }
});

test("a cross-origin POST to the API is refused before it reaches the route", async () => {
  let reached = false;
  const res = await handle({
    event: event("/api/maze-score", { method: "POST", origin: "https://evil.example" }),
    resolve: async () => ((reached = true), new Response("ok")),
  });
  expect(res.status).toBe(403);
  expect(reached).toBe(false);
  expect(res.headers.get("x-frame-options")).toBe("DENY");
});
```

Run `bun test src/hooks.server.test.js`. Expected: FAIL, module not found.

- [ ] **Step 2: Implement `src/hooks.server.js`**

Before writing, copy `web/assets/` to `static/assets/`, so the favicon exists at its new path:

```bash
mkdir -p static && cp -R web/assets static/assets
```

```js
// Runs for every request the SvelteKit server handles: everything under
// vite dev, and on Netlify only the non-prerendered routes (the APIs and
// unknown paths). Prerendered pages on Netlify get their redirects and
// headers from netlify.toml instead; the two lists are kept identical.

import fs from "node:fs/promises";
import path from "node:path";
import { SECURITY_HEADERS } from "./lib/server/security-headers.js";

// Paths that have moved. Kept so old links and bookmarks still land.
// Mirrored by [[redirects]] in netlify.toml.
export const REDIRECTS = {
  "/": ["/home", 302],
  "/app-store": ["/home#apps", 301],
};

// Any page open in the same browser can send this server requests. Refusing
// writes whose Origin is another site's closes cross-site POSTs to the score
// APIs. SvelteKit's own csrf.checkOrigin only covers form content types, not
// JSON. A request with no Origin (curl, same-origin GET) passes.
export function isForeignWrite(request, url) {
  if (request.method === "GET" || request.method === "HEAD") return false;
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin !== url.origin;
  } catch {
    return true;
  }
}

function withSecurityHeaders(response) {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    // A second CSP is appended, not set: SvelteKit puts its own hashed
    // script-src policy on pages it renders on demand, and the browser
    // enforces both, the same as the meta tag on prerendered pages.
    if (name === "Content-Security-Policy") response.headers.append(name, value);
    else response.headers.set(name, value);
  }
  return response;
}

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  const { pathname } = event.url;

  if (REDIRECTS[pathname]) {
    const [location, status] = REDIRECTS[pathname];
    return withSecurityHeaders(new Response(null, { status, headers: { Location: location } }));
  }

  // Netlify answers this from netlify.toml before it reaches the function,
  // so this read only ever runs locally, where static/ is on disk.
  if (pathname === "/favicon.ico") {
    const svg = await fs.readFile(path.join(process.cwd(), "static", "assets", "favicon.svg"));
    return withSecurityHeaders(new Response(svg, { headers: { "Content-Type": "image/svg+xml" } }));
  }

  if (pathname.startsWith("/api/") && isForeignWrite(event.request, event.url)) {
    return withSecurityHeaders(new Response("Forbidden", { status: 403 }));
  }

  return withSecurityHeaders(await resolve(event));
}
```

Run `bun test src/hooks.server.test.js`. Expected: PASS.

- [ ] **Step 3: Write the API routes**

`src/routes/api/appstore-apps/+server.js`:

```js
import { json } from "@sveltejs/kit";
import { getPublishedApps, appstoreCacheControl } from "$lib/server/appstore.js";

// Live from Apple on every request (behind appstore.js's cache), so this
// one runs as a Netlify Function rather than being prerendered.
export const prerender = false;

export async function GET() {
  const apps = await getPublishedApps();
  return json(apps, { headers: { "Cache-Control": appstoreCacheControl(apps) } });
}
```

`src/routes/api/maze-score/+server.js`:

```js
import { loadScoreStore } from "$lib/server/score-stores.js";
import { mazeScore } from "$lib/server/score-api.js";

export const prerender = false;

export async function GET({ request }) {
  return mazeScore(request, await loadScoreStore("maze"));
}

export async function POST({ request }) {
  return mazeScore(request, await loadScoreStore("maze"));
}
```

`src/routes/api/notfound-score/+server.js`: identical, with `notfoundScore` and `"notfound"`.

- [ ] **Step 4: Check against the dev server**

1. Run `bun run dev` in the background.
2. Run each command and check the result:

| Command | Expected |
|---|---|
| `curl -s localhost:4321/api/appstore-apps \| head -c 200` | a JSON array (or `[]` offline) |
| `curl -s localhost:4321/api/notfound-score` | `{"best":0}` or the real best |
| `curl -s -X POST -H 'content-type: application/json' -d '{"timeMs":5000,"moves":40}' localhost:4321/api/maze-score` | `{"top":[…]}` |
| `curl -s -o /dev/null -w '%{http_code}\n' -X POST -H 'origin: https://evil.example' localhost:4321/api/maze-score` | `403` |
| `curl -sI localhost:4321/ \| grep -i location` | `/home` |

3. Stop the server.

- [ ] **Step 5: Format and commit**

```bash
bunx prettier --write src/hooks.server.js src/hooks.server.test.js src/routes/api
bun test
git add src/hooks.server.js src/hooks.server.test.js src/routes/api static
git commit -m "Add the server hook and API routes for App Store and scores

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Site layout, chrome and the reveal action

**Files:**
- Create:
  - `src/lib/styles/` (copies of `web/css/*.css`, except `landing.css`, which Task 10 copies)
  - `src/lib/components/Seo.svelte`, `Header.svelte`, `Footer.svelte`
  - `src/lib/actions/reveal.js`
  - `src/routes/(site)/+layout.svelte`
- Modify: `src/routes/(site)/home/+page.svelte` (still a placeholder, now using `Seo`)

**Interfaces produced:**
- `Seo` props: `{ title: string, description: string, url?: string, image?: string = "https://cilippofilia.dev/assets/profile.jpg", noindex?: boolean = false }`
- `reveal` action: `use:reveal` on any element with class `reveal`

- [ ] **Step 1: Copy the stylesheets**

```bash
mkdir -p src/lib/styles
cp web/css/tokens.css web/css/base.css web/css/layout.css web/css/components.css \
   web/css/intro.css web/css/maze-game.css web/css/notfound-game.css web/css/legal.css web/css/style-guide.css src/lib/styles/
```

These stay global CSS (see the spec's Styles section). Leave their contents unchanged; `intro.css`'s `url("/assets/profile-clear.png")` resolves from `static/`.

- [ ] **Step 2: Write `Seo.svelte`**

```svelte
<script>
  // The head tags every page carries (see .claude/rules/html-pages.md):
  // title, description, canonical and the Open Graph set. Pages without a
  // fixed public URL (the 404) pass no url and get no canonical or og:url.
  let { title, description, url = null, image = "https://cilippofilia.dev/assets/profile.jpg", noindex = false } =
    $props();
</script>

<svelte:head>
  <title>{title}</title>
  {#if noindex}<meta name="robots" content="noindex" />{/if}
  <meta name="description" content={description} />
  {#if url}<link rel="canonical" href={url} />{/if}
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="cilippofilia.dev" />
  {#if url}<meta property="og:url" content={url} />{/if}
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={image} />
</svelte:head>
```

- [ ] **Step 3: Write `Header.svelte` and `Footer.svelte`**

`Header.svelte` ports `web/js/nav.js`'s header, the smooth "App Store" scroll and `initHeaderCondense`:

```svelte
<script>
  import { page } from "$app/state";
  import { replaceState } from "$app/navigation";

  // The shared header. intro-flip.js measures the pin offset against
  // header.site-header, so the class name and markup are load-bearing.
  const path = $derived(page.url.pathname.replace(/\/+$/, "") || "/home");

  let sentinel;
  let condensed = $state(false);

  // Tightens the header's glass once the page has scrolled a little, so it
  // reads as settled chrome rather than sitting exactly as tall as it does
  // over the hero. An IntersectionObserver on a sentinel near the top of the
  // page rather than a scroll listener, so it costs nothing between the two
  // states it actually toggles.
  $effect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([entry]) => (condensed = !entry.isIntersecting));
    io.observe(sentinel);
    return () => io.disconnect();
  });

  // "App Store" points at the app cards further down the home page. On
  // /home the browser would only jump, so scroll there smoothly instead;
  // from any other page the plain /home#apps href does the navigating.
  function scrollToApps(event) {
    const target = document.getElementById("apps");
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    replaceState("/home#apps", {});
  }
</script>

<div
  bind:this={sentinel}
  aria-hidden="true"
  style="position:absolute; top:0; left:0; width:1px; height:56px; pointer-events:none;"
></div>
<header class="site-header" class:is-condensed={condensed}>
  <div class="wrap">
    <a class="brand" href="/home">cilippofilia<span class="dim">.dev</span></a>
    <div class="nav-group">
      <nav class="site-nav">
        <a href="/home" class:active={path === "/home"}>Home</a>
        <a href="/home#apps" onclick={scrollToApps}>App Store</a>
      </nav>
    </div>
  </div>
</header>
```

`Footer.svelte`: the footer markup from `web/js/nav.js:52-62`, verbatim, as the component body:

```svelte
<footer class="site-footer">
  <div class="wrap">
    <span>© 2026 Filippo Cilia · Manchester, UK</span>
    <nav class="site-footer-links" aria-label="Legal">
      <a href="/privacy">Privacy</a>
      <a href="/terms">Terms</a>
      <a href="/terms#contact">Contact</a>
    </nav>
  </div>
</footer>
```

- [ ] **Step 4: Write `src/lib/actions/reveal.js`**

```js
// Scroll-reveal for `.reveal` elements (see components.css): fades each one
// up into place the first time it crosses into the viewport, via
// IntersectionObserver so it costs nothing until it actually fires. Used as
// `use:reveal`, so cards rendered after a fetch are covered the moment they
// mount.

let io = null;

function observer() {
  if (io !== null) return io;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  io =
    !reduceMotion && "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              entry.target.classList.add("in-view");
              io.unobserve(entry.target);
              settle(entry.target);
            }
          },
          { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
        )
      : false;
  return io;
}

// Once an element has arrived, drop `.reveal` so its own transitions apply
// again. `.reveal` replaces the element's transition list with the slow
// entrance one, staggered delay included: left on, an app card took 0.6s
// to lift under the cursor, snapped its border colour, and the sixth card
// waited 0.3s before reacting at all. At rest `.reveal.in-view` and no
// `.reveal` look identical, so removing it is invisible. The timeout covers
// a transitionend that never fires (a tab hidden mid-reveal).
function settle(el) {
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    el.classList.remove("reveal", "in-view");
  };
  el.addEventListener("transitionend", (e) => e.target === el && e.propertyName === "opacity" && finish());
  setTimeout(finish, 1500);
}

export function reveal(node) {
  const io = observer();
  if (io) io.observe(node);
  return {
    destroy() {
      if (io) io.unobserve(node);
    },
  };
}
```

- [ ] **Step 5: Write the `(site)` layout and update the placeholder home**

`src/routes/(site)/+layout.svelte`:

```svelte
<script>
  // Load order matters: tokens → base → layout → components, then each
  // page imports its own stylesheet. Landing pages (the (landing) group)
  // never load these.
  import "$lib/styles/tokens.css";
  import "$lib/styles/base.css";
  import "$lib/styles/layout.css";
  import "$lib/styles/components.css";
  import Header from "$lib/components/Header.svelte";
  import Footer from "$lib/components/Footer.svelte";

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />
</svelte:head>

<Header />
{@render children()}
<Footer />
```

Replace `src/routes/(site)/home/+page.svelte` with a placeholder that uses `Seo`, so the build stays green until Task 7:

```svelte
<script>
  import Seo from "$lib/components/Seo.svelte";
</script>

<Seo title="Placeholder · cilippofilia.dev" description="Placeholder." url="https://cilippofilia.dev/home" />
<main><div class="wrap"><h1>Placeholder</h1></div></main>
```

- [ ] **Step 6: Check visually, then commit**

1. Run `bun run dev`, and open `http://localhost:4321/home`.
   - Expected: the real header and footer, styled. Scrolling condenses the header.
2. Run `bun test && bun run build`. Expected: both succeed.
3. Commit:

```bash
bunx prettier --write src/lib/components src/lib/actions "src/routes/(site)"
git add src/lib/styles src/lib/components src/lib/actions "src/routes/(site)"
git commit -m "Add the site layout with Svelte header, footer, Seo and reveal

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Privacy, terms and style-guide pages

**Files:**
- Create: `src/routes/(site)/privacy/+page.svelte`, `src/routes/(site)/terms/+page.svelte`, `src/routes/(site)/style-guide/+page.svelte`

All three pages follow the same porting recipe:
1. **Script block:** a `<script>` that imports `Seo` and the page stylesheet.
2. **`<Seo …>`:** filled from the old `<head>`. `title` comes from `<title>`, `description` from `meta[name=description]`, `url` from `link[rel=canonical]`. `image` stays at its default unless the old `og:image` differs.
3. **Body:** everything between `<body>` and the `<script src="/js/nav.js">` line, verbatim. That's the `<main>…</main>` block. Header and footer now come from the layout.
4. **Escapes:** any literal `{` or `}` in text becomes `{"{"}` / `{"}"}`. This was checked when the plan was written and none exist today, but re-check with `grep -n '[{}]'` on the new file.

- [ ] **Step 1: Port `/privacy`**

```svelte
<script>
  import "$lib/styles/legal.css";
  import Seo from "$lib/components/Seo.svelte";
</script>

<Seo
  title="Privacy Policy · cilippofilia.dev"
  description="How cilippofilia.dev handles your data: no cookies, no analytics, no tracking."
  url="https://cilippofilia.dev/privacy"
/>

<!-- web/privacy.html lines 25-118 (<main> … </main>), verbatim -->
```

Replace the comment line with the actual lines: `sed -n 25,118p web/privacy.html`. Check the first line is `<main>` and the last is `</main>` before pasting.

- [ ] **Step 2: Port `/terms`**

Same as Step 1, with:
- `title="Terms of Use · cilippofilia.dev"`
- `description="Terms of use for cilippofilia.dev."`
- `url="https://cilippofilia.dev/terms"`
- body from `web/terms.html` lines 25-102 (`sed -n 25,102p`)

- [ ] **Step 3: Port `/style-guide`**

```svelte
<script>
  import "$lib/styles/style-guide.css";
  import Seo from "$lib/components/Seo.svelte";

  // Fills each token label with its current value from tokens.css, so this
  // page can't drift from the real thing.
  let root;
  $effect(() => {
    const rootStyle = getComputedStyle(document.documentElement);
    root.querySelectorAll("[data-token]").forEach((el) => {
      el.textContent = rootStyle.getPropertyValue(el.dataset.token).trim();
    });
  });
</script>

<Seo
  title="Style Guide · cilippofilia.dev"
  description="The design tokens and components behind cilippofilia.dev: colour, Liquid Glass material, spacing, radius, type, buttons and app cards."
  url="https://cilippofilia.dev/style-guide"
/>
```

Then paste `web/style-guide.html` lines 25-328 (`<main>` … `</main>`). Add `bind:this={root}` to the opening `<main>` tag. In the HTML comment near the top, change "by the script at the bottom" to "by this page's script". Check the old head's `og:image` and `canonical`; if either differs from the values above, use the old values.

- [ ] **Step 4: Compare with the old site**

1. Run `bun run legacy:start` (old site on 4322) and `bun run dev` (new site on 4321).
2. Compare `/privacy`, `/terms` and `/style-guide` side by side at 1280px and 390px widths.
   - Expected: identical apart from the header markup source.
   - The style guide's token values must be filled in.
3. Fix any difference before committing.

- [ ] **Step 5: Commit**

```bash
bunx prettier --write "src/routes/(site)/privacy" "src/routes/(site)/terms" "src/routes/(site)/style-guide"
bun test && bun run build
git add "src/routes/(site)"
git commit -m "Port the privacy, terms and style guide pages to Svelte

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Home page: intro, floating icons, apps block, maze

**Files:**
- Create:
  - `src/lib/intro/intro-flip.js`
  - `src/lib/games/maze-game.js`, `maze-explainer.js`
  - `src/lib/components/FloatingIcons.svelte`, `AppCard.svelte`, `FeaturedStrip.svelte`, `AppsSection.svelte`, `MazeSection.svelte`
  - `src/routes/(site)/home/+page.js`
- Modify: `src/routes/(site)/home/+page.svelte` (replace the placeholder)

**Interfaces:**
- Consumes: `buildAppsBlock`, `formatReleaseDate` (Task 2), `splitName`, `isImageIcon` (Task 2), `publicDevApps` (Task 2), `reveal` (Task 5), `Seo` (Task 5)
- Produces:
  - `initIntroFlip({ signal }) → void`
  - `initMazeGame(container, { signal }) → void`
  - `initMazeExplainer(flip, toggle, { signal }) → void`
  - `AppCard` props, the same as `feed.js` card objects: `{ websiteUrl, appStoreUrl, icon, name, badge, badgeStyle, tagline }`
  - `FeaturedStrip` props `{ app }`
  - `AppsSection` props `{ devApps }`

The recipe for porting an imperative module with an `AbortSignal` (used here and in Task 9):
1. Copy the file.
2. Replace the top-level bootstrap (`const container = document.querySelector(…); if (container) initGame(container);`, or the `DOMContentLoaded` wrapper) with an exported function taking the root element(s) and `{ signal }`.
3. Add `{ signal }` as the options argument of **every** `addEventListener` call. Where an options object already exists (`{ passive: true }`, `{ once: true }`), add `signal` into it.
4. In every `requestAnimationFrame`, `setTimeout` or `setInterval` callback that reschedules itself, add `if (signal.aborted) return;` as its first line.
5. Add a `signal.addEventListener("abort", …)` that removes any element the module appended **outside** its root, and cancels its pending frame or timer handles.
6. Change nothing else.

- [ ] **Step 1: Port `intro-flip.js`**

`cp web/js/intro-flip.js src/lib/intro/intro-flip.js`, then:
- Replace line 42, `document.addEventListener("DOMContentLoaded", () => {`, with `export function initIntroFlip({ signal }) {`. Replace the matching final `});` (line 478) with `}`.
- Line 471: `window.addEventListener("resize", () => { … });` becomes `window.addEventListener("resize", () => { … }, { signal });`.
- Line 475: `window.addEventListener("load", measure, { signal });`.
- Line 476: `window.addEventListener("scroll", onScroll, { passive: true, signal });`.
- Line 477: `setTimeout(() => !signal.aborted && measure(), 300);`.
- In `update` (the function `onScroll` schedules), add `if (signal.aborted) return;` as its first line.
- After line 105 (`const flyingPhoto = …`), add:

```js
  // The clone lives on <body> and the sheen inside the flip, both outside
  // anything Svelte renders, so they go when the page's component does.
  signal.addEventListener("abort", () => {
    flyingCard.remove();
    flipSheen.remove();
  });
```

- Grep the file for any remaining `addEventListener(` without `signal`. Expected: none.
- Update the file's header comment: the line saying it runs on `DOMContentLoaded` becomes "Called from the home page's onMount; the signal tears it down."

- [ ] **Step 2: Port `maze-game.js` and `maze-explainer.js`**

`cp web/js/maze-game.js src/lib/games/maze-game.js`, then:
- Delete lines 34-35 (the `container` bootstrap). Change `function initGame(container) {` to `export function initMazeGame(container, { signal }) {`.
- Add `{ signal }` to:
  - `window.addEventListener("keydown", …)` (line 226)
  - both `canvas.addEventListener("touchstart"/"touchend", …)` calls
  - both `.addEventListener("click", startNewRound)` calls
- In `tickTimer`, add `if (signal.aborted) return;` first.
- Add `signal.addEventListener("abort", stopTimer);` just before the keydown listener.
- In `win()`, change `.then((r) => r.json())` to `.then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))`. A 503 on Netlify then falls through to the existing `.catch(() => {})`.
- Find any other `fetch("/api/maze-score")` (initial leaderboard load) and apply the same `r.ok` guard.
- Imports stay `./maze-wilson.js` and `./maze-move.js` (same folder now).

`cp web/js/maze-explainer.js src/lib/games/maze-explainer.js`, then:
- Delete lines 91-92. Change `function initExplainer(flip) {` to `export function initMazeExplainer(flip, toggle, { signal }) {`, and delete line 95 (`const toggle = document.querySelector(".maze-explain-toggle");`), since the toggle is passed in.
- Add `{ signal }` to the six `addEventListener` calls (prev, next, restart, toggle, close, and any others found by grep).
- In `animateRepeat`'s `frame`, add `if (signal.aborted) return;` first.

- [ ] **Step 3: Write `FloatingIcons.svelte`**

Port `src/client/floating-icons.js`, with the markup from `web/index.html:26-32`:

```svelte
<script>
  import { onMount } from "svelte";

  // Continuous idle drift for the floating app icons behind the hero. Each
  // icon wanders to a fresh random point (with a small rotation) every time
  // it finishes a leg, so it keeps roaming rather than oscillating between
  // two spots.
  let root;

  onMount(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let stopped = false;
    const animations = [];
    const timers = [];

    // animejs is imported here, not at the top, so it only loads in the
    // browser and only when motion is allowed.
    import("animejs").then(({ animate, utils }) => {
      if (stopped) return;
      // How far an icon may wander from its resting point. Scaled to the
      // window so the drift stays a gentle nudge on a phone instead of
      // carrying an icon off the edge of a 390px screen.
      const amp = Math.max(16, Math.min(52, Math.round(window.innerWidth * 0.05)));
      const ampY = Math.round(amp * 0.85);

      root.querySelectorAll(".floating-icon").forEach((el, i) => {
        const wander = () => {
          if (stopped) return;
          animations.push(
            animate(el, {
              translateX: utils.random(-amp, amp),
              translateY: utils.random(-ampY, ampY),
              rotate: utils.random(-14, 14),
              duration: utils.random(7000, 12000),
              ease: "inOutSine",
              onComplete: wander,
            })
          );
        };
        timers.push(setTimeout(wander, i * 300));
      });
    });

    return () => {
      stopped = true;
      timers.forEach(clearTimeout);
      animations.forEach((a) => a.pause());
    };
  });
</script>

<div class="floating-icons" aria-hidden="true" bind:this={root}>
  <!-- web/index.html lines 27-31, the five <img class="floating-icon …"> tags, verbatim -->
</div>
```

Replace the comment line with `sed -n 27,31p web/index.html`.

- [ ] **Step 4: Write `AppCard.svelte`, `FeaturedStrip.svelte` and `AppsSection.svelte`**

`AppCard.svelte`: port the `appCard` template from `web/js/app-card.js`. Svelte escapes every interpolation, which replaces `escapeHtml`:

```svelte
<script>
  import { reveal } from "$lib/actions/reveal.js";
  import { splitName, isImageIcon } from "$lib/apps/names.js";

  // Every card carries the same two actions. "Website" is the app's own
  // landing page on this site and "App Store" is Apple's listing; an app
  // that isn't published yet keeps the App Store button but disabled, so the
  // row reads the same across the grid. The card itself is not a link
  // (links can't nest inside links), so the buttons are the only way off it.
  let { websiteUrl, appStoreUrl, icon, name, badge, badgeStyle, tagline } = $props();
  let { title, subtitle } = $derived(splitName(name));
</script>

<article class="card reveal" use:reveal>
  <div class="card-head">
    {#if isImageIcon(icon)}
      <img class="icon-img" src={icon} alt="" width="48" height="48" />
    {:else}
      <span class="icon">{icon || "📱"}</span>
    {/if}
    <div class="card-title">
      <h3>{title}</h3>
      {#if subtitle}<p class="card-subtitle">{subtitle}</p>{/if}
    </div>
  </div>
  <span class="badge {badgeStyle}">{badge}</span>
  <p>{tagline}</p>
  <div class="card-actions">
    {#if websiteUrl}<a class="button secondary" href={websiteUrl}>Website</a>{/if}
    {#if appStoreUrl}
      <a class="button" href={appStoreUrl} target="_blank" rel="noopener">App Store</a>
    {:else}
      <button type="button" class="button" disabled>App Store</button>
    {/if}
  </div>
</article>
```

`FeaturedStrip.svelte`:

```svelte
<script>
  import { reveal } from "$lib/actions/reveal.js";
  import { formatReleaseDate } from "$lib/apps/feed.js";

  let { app } = $props();
</script>

<div class="featured reveal" id="featured-strip" use:reveal>
  {#if app.icon}<img class="featured-icon" src={app.icon} alt="" width="64" height="64" />{/if}
  <div class="featured-body">
    <span class="featured-eyebrow">Preorder</span>
    <h3>{app.name}</h3>
    <p>{app.tagline} Releases {formatReleaseDate(app.releaseDate)}.</p>
  </div>
  <a class="button secondary" href={app.localUrl || app.url}>Preorder <span class="chevron">›</span></a>
</div>
```

`AppsSection.svelte`:

```svelte
<script>
  import { onMount } from "svelte";
  import { buildAppsBlock } from "$lib/apps/feed.js";
  import AppCard from "./AppCard.svelte";
  import FeaturedStrip from "./FeaturedStrip.svelte";

  // The home page's App Store block. The unreleased apps arrive with the
  // prerendered page (data/apps.json at build time); the published ones are
  // fetched live from Apple after load. Nothing renders until that fetch
  // settles: a heading over nothing is worse than no heading, and a failed
  // fetch just contributes no cards rather than showing an error.
  let { devApps } = $props();
  let block = $state(null);

  onMount(() => {
    fetch("/api/appstore-apps")
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then((published) => (block = buildAppsBlock(published, devApps)));
  });
</script>

<!-- Scroll target for the header's "App Store" link, just above the first
     app content on the page. -->
<div id="apps" aria-hidden="true"></div>

{#if block && (block.upcoming || block.cards.length)}
  <h2 class="apps-heading" id="apps-heading">What's on the App Store</h2>
  {#if block.upcoming}<FeaturedStrip app={block.upcoming} />{/if}
  {#if block.cards.length}
    <section id="apps-section">
      <div class="grid" id="apps-grid">
        {#each block.cards as card (card.name)}
          <AppCard {...card} />
        {/each}
      </div>
    </section>
  {/if}
{/if}
```

- [ ] **Step 5: Write `MazeSection.svelte`**

```svelte
<script>
  import { onMount } from "svelte";
  import { reveal } from "$lib/actions/reveal.js";
  import { initMazeGame } from "$lib/games/maze-game.js";
  import { initMazeExplainer } from "$lib/games/maze-explainer.js";

  // Static markup the two game modules drive directly: no reactive bindings
  // in here, so Svelte never touches the nodes they mutate.
  let game;
  let flip;
  let toggle;

  onMount(() => {
    const controller = new AbortController();
    initMazeGame(game, { signal: controller.signal });
    initMazeExplainer(flip, toggle, { signal: controller.signal });
    return () => controller.abort();
  });
</script>

<!-- web/index.html lines 110-157, verbatim, with exactly these changes:
     <section class="maze-section reveal">  → add  use:reveal
     <button type="button" class="maze-explain-toggle">  → add  bind:this={toggle}
     <div class="maze-flip">  → add  bind:this={flip}
     <div class="maze-game">  → add  bind:this={game} -->
```

Replace the comment with `sed -n 110,157p web/index.html` and make exactly the four attribute additions it lists.

- [ ] **Step 6: Write the home page**

`src/routes/(site)/home/+page.js`:

```js
import { publicDevApps } from "$lib/apps/dev-apps.js";

export function load() {
  return { devApps: publicDevApps() };
}
```

`src/routes/(site)/home/+page.svelte`:

```svelte
<script>
  import { onMount } from "svelte";
  import "$lib/styles/intro.css";
  import "$lib/styles/maze-game.css";
  import Seo from "$lib/components/Seo.svelte";
  import FloatingIcons from "$lib/components/FloatingIcons.svelte";
  import AppsSection from "$lib/components/AppsSection.svelte";
  import MazeSection from "$lib/components/MazeSection.svelte";
  import { initIntroFlip } from "$lib/intro/intro-flip.js";

  let { data } = $props();

  // The intro choreography reaches across the whole page (header, profile
  // card, floating icons), so it starts once everything has mounted.
  onMount(() => {
    const controller = new AbortController();
    initIntroFlip({ signal: controller.signal });
    return () => controller.abort();
  });
</script>

<Seo
  title="Filippo Cilia · Apps for iPhone, iPad and Mac"
  description="Filippo Cilia's native Apple apps: Drinko, itsWritten, Iterly, 9 Tiles Puzzle and what's next, all written in Swift and SwiftUI."
  url="https://cilippofilia.dev/home"
/>

<FloatingIcons />
<main>
  <div class="wrap">
    <!-- web/index.html lines 35-92 (the intro <section> and the hero
         <section>), verbatim -->

    <AppsSection devApps={data.devApps} />

    <MazeSection />
  </div>
</main>
```

Replace the comment with `sed -n 35,92p web/index.html`. Lines 93-108 of the old page (apps anchor, heading, featured strip, grid) are replaced by `<AppsSection>`, and lines 110-157 by `<MazeSection>`.

- [ ] **Step 7: Compare with the old site**

1. Run both servers, as in Task 6, Step 4.
2. On `/home` at 1280px and 390px, check:
   - The intro flip choreography runs on scroll, with the card handoff and no doubled card.
   - The floating icons drift.
   - The App Store heading, featured strip (if a preorder exists) and cards render, reveal on scroll, and the buttons link correctly.
   - The header "App Store" link scrolls smoothly.
   - The maze plays (keys, swipe in device mode). A win posts a score and shows the leaderboard.
   - "How was this maze made?" flips to the explainer, and prev/next/restart/close work.
   - With reduced motion emulated in devtools: no drift, and no reveal animation.
3. With the network offline in devtools: the apps block stays hidden, and nothing errors in the console.
4. In the console, check for CSP violations. Expected: none.

- [ ] **Step 8: Commit**

```bash
bunx prettier --write src/lib/intro src/lib/games/maze-game.js src/lib/games/maze-explainer.js src/lib/components "src/routes/(site)/home"
bun test && bun run build
git add src/lib "src/routes/(site)/home"
git commit -m "Port the home page: intro flip, floating icons, App Store block and maze

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: In-development app pages (`/[slug]`)

**Files:**
- Create: `src/lib/components/AppDetail.svelte`, `src/routes/(site)/[slug]/+page.js`, `src/routes/(site)/[slug]/+page.svelte`

**Interfaces:**
- Consumes: `validDevApps`, `findDevApp` (Task 2), `appPageMeta` (Task 2), `badgeClass` (Task 2, `app-status.js`), `isImageIcon`, `Seo`

- [ ] **Step 1: Write the route**

`src/routes/(site)/[slug]/+page.js`:

```js
import { error } from "@sveltejs/kit";
import { findDevApp, validDevApps } from "$lib/apps/dev-apps.js";

// One prerendered page per valid data/apps.json entry. Static routes and the
// landing pages rank above this parameter, and validDevApps already drops
// any slug they own. Anything else 404s.
export function entries() {
  return validDevApps().map((app) => ({ slug: app.slug }));
}

export function load({ params }) {
  const app = findDevApp(params.slug);
  if (!app) error(404, "Not found");
  return { app };
}
```

`src/lib/components/AppDetail.svelte`: port `renderAppDetail` from `web/js/app-detail.js:16-54`:

```svelte
<script>
  import { isImageIcon } from "$lib/apps/names.js";
  import { badgeClass } from "$lib/apps/app-status.js";

  let { app } = $props();
</script>

<section class="hero app-detail" style="margin-top:0">
  <div class="app-detail-head">
    {#if isImageIcon(app.icon)}
      <img class="icon-lg icon-img" src={app.icon} alt="" width="88" height="88" />
    {:else}
      <span class="icon-lg">{app.icon || "📱"}</span>
    {/if}
    <div class="app-detail-meta">
      <span class="badge {badgeClass(app.status)}">{app.status}</span>
      <h1>{app.name}</h1>
      <p class="lede">{app.tagline}</p>
    </div>
  </div>
  <div class="app-detail-body">
    <p class="app-detail-description">{app.description}</p>
    <div class="app-detail-side">
      <div>
        <h4>Platforms</h4>
        <div class="platforms">
          {#each app.platforms || [] as platform}<span class="chip">{platform}</span>{/each}
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
        <a class="back-link" href="/home#apps"><span class="chevron">‹</span> Go back</a>
      </div>
    </div>
  </div>
</section>
```

`src/routes/(site)/[slug]/+page.svelte`:

```svelte
<script>
  import Seo from "$lib/components/Seo.svelte";
  import AppDetail from "$lib/components/AppDetail.svelte";
  import { appPageMeta } from "$lib/apps/meta.js";

  let { data } = $props();
  const meta = $derived(appPageMeta(data.app));
</script>

<Seo title={meta.title} description={meta.description} url={meta.url} image={meta.image} />

<main>
  <div class="wrap" id="content">
    <AppDetail app={data.app} />
  </div>
</main>
```

The skeleton loader and `renderNotFound` from the old template are not ported. The page is prerendered with its content, and unknown slugs 404.

- [ ] **Step 2: Check, then commit**

1. Run `bun run dev`. Then:
   - Open `/the-relay`, and compare it with `localhost:4322/the-relay`.
   - Check that `/nope-not-an-app` returns 404. It renders SvelteKit's default error page until Task 9.
   - Check that `/drinko` doesn't render the dev page (it 404s or redirects until Task 10).
2. Run `bun run build && ls build/the-relay.html`.
3. Commit:

```bash
bunx prettier --write src/lib/components/AppDetail.svelte "src/routes/(site)/[slug]"
bun test
git add src/lib/components/AppDetail.svelte "src/routes/(site)/[slug]"
git commit -m "Prerender a page per in-development app from data/apps.json

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: 404 page with the broken-link game

**Files:**
- Create: `src/lib/games/notfound-game.js`, `src/lib/components/NotFoundGame.svelte`, `src/routes/+error.svelte`

**Interfaces:**
- Produces: `initNotFoundGame(container, { signal }) → void`

- [ ] **Step 1: Port `notfound-game.js`**

`cp web/js/notfound-game.js src/lib/games/notfound-game.js`, then apply the recipe from Task 7:
- Delete lines 17-18. Change `function initGame(container) {` to `export function initNotFoundGame(container, { signal }) {`.
- Add `{ signal }` to the replay `addEventListener` (line 320).
- In `makeChip`, change `{ once: true }` to `{ once: true, signal }`.
- In `scheduleSpawn`, add `if (signal.aborted) return;` first.
- In the expiry `setTimeout` callback (line 144), add `if (signal.aborted) return;` first.
- In the shatter `frame` function, add `if (signal.aborted) return;` first.
- Add `signal.addEventListener("abort", () => clearTimeout(spawnTimer));` after `let spawnTimer = null;`.
- In both `fetch("/api/notfound-score"…)` chains, change `.then((r) => r.json())` to `.then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))`.
- The import of `./notfound-game-logic.js` already resolves (same folder).

- [ ] **Step 2: Write `NotFoundGame.svelte` and the error page**

`NotFoundGame.svelte`:

```svelte
<script>
  import { onMount } from "svelte";
  import { initNotFoundGame } from "$lib/games/notfound-game.js";

  let container;

  onMount(() => {
    const controller = new AbortController();
    initNotFoundGame(container, { signal: controller.signal });
    return () => controller.abort();
  });
</script>

<!-- web/404.html lines 35-47 (<div class="notfound-game"> … </div>),
     verbatim, with bind:this={container} added to the outer div -->
```

Replace the comment with `sed -n 35,47p web/404.html`, adding `bind:this={container}` to the outer `<div class="notfound-game">`.

`src/routes/+error.svelte`. The root error page renders inside only the root layout, so it brings the site chrome itself:

```svelte
<script>
  import "$lib/styles/tokens.css";
  import "$lib/styles/base.css";
  import "$lib/styles/layout.css";
  import "$lib/styles/components.css";
  import "$lib/styles/notfound-game.css";
  import { page } from "$app/state";
  import Seo from "$lib/components/Seo.svelte";
  import Header from "$lib/components/Header.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import NotFoundGame from "$lib/components/NotFoundGame.svelte";
</script>

<svelte:head>
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />
</svelte:head>

<Header />
{#if page.status === 404}
  <Seo
    title="Not found · cilippofilia.dev"
    description="This page doesn't exist on cilippofilia.dev. Whack a few broken links, then head back to Filippo Cilia's apps."
    noindex
  />
  <main>
    <div class="wrap">
      <!-- web/404.html lines 27-33 (the hero <section>), verbatim -->
      <NotFoundGame />
    </div>
  </main>
{:else}
  <Seo title="Something went wrong · cilippofilia.dev" description="Something went wrong on cilippofilia.dev." noindex />
  <main>
    <div class="wrap">
      <section class="hero" style="margin-top:0">
        <h1>Something went wrong.</h1>
        <p class="lede">That one's on me. Try again in a moment.</p>
        <div class="button-row"><a class="button" href="/home">Back home</a></div>
      </section>
    </div>
  </main>
{/if}
<Footer />
```

Replace the hero comment with `sed -n 27,33p web/404.html`.

- [ ] **Step 3: Check, then commit**

1. Run `bun run dev`, and open `/definitely-missing`.
   - Expected: status 404 (check with `curl -s -o /dev/null -w '%{http_code}' localhost:4321/definitely-missing`).
   - The page and game match `localhost:4322/definitely-missing`: the idle chip starts a round, chips expire, the score shows, the result appears, and replay works.
   - A finished round posts the best score.
2. Commit:

```bash
bunx prettier --write src/lib/games/notfound-game.js src/lib/components/NotFoundGame.svelte src/routes/+error.svelte
bun test && bun run build
git add src/lib src/routes/+error.svelte
git commit -m "Port the 404 page and its broken-link game to the SvelteKit error page

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: App landing pages

**Files:**
- Create:
  - `src/lib/styles/landing.css` (copy)
  - `src/lib/styles/apps/{drinko,iterly,itswritten,nine-tiles-puzzle}.css` (copies of each `style.css`)
  - `src/lib/actions/landing-reveal.js`
  - `src/lib/components/LandingCountdown.svelte`
  - `src/routes/(landing)/<app>/+page.js`, `+page.svelte`, `privacy-policy/+page.js`, `privacy-policy/+page.svelte` for each of the four apps
  - `static/<app>/assets/` (copies)
- Delete: the Task 1 placeholders under `src/routes/(landing)/drinko/privacy-policy/` (replaced in this task)

**Interfaces:**
- Produces: `landingReveal` action (on `<main>`), and `LandingCountdown` props `{ release: string }`

The porting recipe for each landing page `web/<app>/index.html` → `src/routes/(landing)/<app>/+page.svelte`:
1. **`<script>`:** import `"$lib/styles/landing.css"`, `"$lib/styles/apps/<app>.css"`, `Seo`, and `landingReveal`.
2. **`<Seo>`:** `title`, `description`, `url` (canonical) and `image` (`og:image`), copied from the old head.
3. **`<svelte:head>`:** the two favicon links from the old head, with `assets/…` made absolute: `/<app>/assets/favicon.png` and `/<app>/assets/apple-touch-icon.png`.
4. **Body:** everything between `<body>` and the first `<script` line, verbatim.
   - Rewrite every `src="assets/…"` to `src="/<app>/assets/…"`.
   - Add `use:landingReveal` to the `<main>` tag.
   - Leave `href="privacy-policy.html"` as it is. It resolves to `/<app>/privacy-policy.html`, which the reroute hook maps.
5. **`+page.js`:** `export const trailingSlash = "always";` so `/drinko` redirects to `/drinko/` as before.

The privacy pages follow the same recipe, with these differences:
- The source is `web/<app>/privacy-policy.html`, with the body up to `</body>`. There's no script.
- No `landingReveal`.
- `+page.js` is `export const csr = false; export const trailingSlash = "never";`.
- `href="./"` links stay as they are. They resolve to `/<app>/`.

- [ ] **Step 1: Copy the styles and assets, and write the reveal action**

```bash
cp web/css/landing.css src/lib/styles/landing.css
mkdir -p src/lib/styles/apps
for app in drinko iterly itswritten nine-tiles-puzzle; do
  cp "web/$app/style.css" "src/lib/styles/apps/$app.css"
  mkdir -p "static/$app" && cp -R "web/$app/assets" "static/$app/assets"
done
rm -r "src/routes/(landing)/drinko/privacy-policy"
```

`src/lib/actions/landing-reveal.js`:

```js
// Shared by the app landing pages: fades each <main> section in as it
// scrolls into view. Used as `use:landingReveal` on <main>.
export function landingReveal(main) {
  const sections = main.querySelectorAll("section");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || !("IntersectionObserver" in window)) {
    sections.forEach((el) => el.classList.add("in-view"));
    return {};
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
  return { destroy: () => observer.disconnect() };
}
```

- [ ] **Step 2: Port drinko, iterly and itswritten**

Apply the recipe to each. For example, `src/routes/(landing)/drinko/+page.svelte` starts:

```svelte
<script>
  import "$lib/styles/landing.css";
  import "$lib/styles/apps/drinko.css";
  import Seo from "$lib/components/Seo.svelte";
  import { landingReveal } from "$lib/actions/landing-reveal.js";
</script>

<Seo
  title="Drinko"
  description="Drinko helps you make better cocktails at home: 100+ classic recipes, bartending lessons, and a cabinet that tracks what you already have. For iPhone, iPad and Mac."
  url="https://cilippofilia.dev/drinko/"
  image="<og:image from web/drinko/index.html>"
/>

<svelte:head>
  <link rel="icon" href="/drinko/assets/favicon.png" />
  <link rel="apple-touch-icon" href="/drinko/assets/apple-touch-icon.png" />
</svelte:head>

<!-- web/drinko/index.html lines 21-89, with the recipe's rewrites -->
```

Replace the comment with `sed -n 21,89p web/drinko/index.html`. For iterly, use lines `21-95`. For itswritten, use lines `21-93`. Fill in `image` from each file's `og:image`.

- [ ] **Step 3: Write `LandingCountdown.svelte` and port nine-tiles-puzzle**

`LandingCountdown.svelte` ports `web/nine-tiles-puzzle/app.js` and renders the countdown block. The release-dependent elements outside it (`#release-live`, `#badge-pre`, `#badge-post`, `#beta-note`) are still toggled by id, exactly as `app.js` did, so the page markup moves over unchanged:

```svelte
<script>
  import { onMount } from "svelte";

  // Countdown to release. Once the date passes, the page swaps its
  // pre-order buttons and beta note for the "available now" state.
  let { release } = $props();
  let countdown;

  onMount(() => {
    const releaseDate = new Date(release).getTime();
    const el = (id) => document.getElementById(id);
    const [daysEl, hoursEl, minutesEl, secondsEl] = ["cd-days", "cd-hours", "cd-minutes", "cd-seconds"].map(el);
    const pad = (n) => String(n).padStart(2, "0");

    const setValue = (target, value) => {
      const digits = target.querySelectorAll(".digit");
      for (let i = 0; i < digits.length; i++) {
        const digit = digits[i];
        const char = value[i];
        if (digit.textContent === char) continue;
        digit.textContent = char;
        digit.classList.remove("tick");
        void digit.offsetWidth; // restart animation
        digit.classList.add("tick");
      }
    };

    // Declared before the first tick: once the release date has passed, that
    // first tick goes straight to goLive(), which clears this interval.
    let timer;

    const goLive = () => {
      countdown.hidden = true;
      el("release-live").hidden = false;
      el("badge-pre").hidden = true;
      el("beta-note").hidden = true;
      el("badge-post").hidden = false;
      clearInterval(timer);
    };

    const tick = () => {
      const diff = releaseDate - Date.now();
      if (diff <= 0) {
        goLive();
        return;
      }
      const totalSeconds = Math.floor(diff / 1000);
      setValue(daysEl, pad(Math.floor(totalSeconds / 86400)));
      setValue(hoursEl, pad(Math.floor((totalSeconds % 86400) / 3600)));
      setValue(minutesEl, pad(Math.floor((totalSeconds % 3600) / 60)));
      setValue(secondsEl, pad(totalSeconds % 60));
    };

    tick();
    if (releaseDate > Date.now()) timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  });
</script>

<!-- web/nine-tiles-puzzle/index.html lines 45-50, verbatim, with
     data-release="…" replaced by nothing (the date is the prop) and
     bind:this={countdown} added to the outer div -->
```

Replace the comment with `sed -n 45,50p web/nine-tiles-puzzle/index.html` and make those two changes.

Port `web/nine-tiles-puzzle/index.html` with the recipe (body lines `21-101`). Replace its lines 45-50 with:

```svelte
<LandingCountdown release="2026-09-28T00:00:00" />
```

Add `import LandingCountdown from "$lib/components/LandingCountdown.svelte";` to the page's `<script>`.

- [ ] **Step 4: Port the four privacy pages**

For each app, write `src/routes/(landing)/<app>/privacy-policy/+page.js`:

```js
// No JS on this page, as before. trailingSlash "never" prerenders it to
// <app>/privacy-policy.html, the URL App Store listings link to.
export const csr = false;
export const trailingSlash = "never";
```

And write `+page.svelte` with the recipe. Body lines:

| App | Lines | Source |
|---|---|---|
| drinko | 21-104 | `web/drinko/privacy-policy.html` |
| iterly | 21-113 | `web/iterly/privacy-policy.html` |
| itswritten | 21-120 | `web/itswritten/privacy-policy.html` |
| nine-tiles-puzzle | 21-114 | `web/nine-tiles-puzzle/privacy-policy.html` |

`url` is the old canonical, for example `https://cilippofilia.dev/drinko/privacy-policy.html`.

- [ ] **Step 5: Check, then commit**

1. Run `bun run dev`. For each app, compare against port 4322:
   - `/<app>`. Expected: redirects to `/<app>/`.
   - `/<app>/`: the page matches, sections fade in, and the "Privacy Policy" link works.
   - `/<app>/privacy-policy.html`. Expected: status 200, and the page matches.
   - On nine-tiles, the countdown ticks (or shows "Available now" after 28 September 2026, which is today's state).
2. Run `bun run build && find build -path '*privacy-policy*'`.
   - Expected: `build/<app>/privacy-policy.html` for all four.

- [ ] **Step 6: Fallback, only if Task 1, Step 9 found `privacy-policy/index.html`**

If the prerendered file is `build/<app>/privacy-policy/index.html`, add a rewrite to `netlify.toml` in Task 13 for each of the four apps:

```toml
[[redirects]]
  from = "/<app>/privacy-policy.html"
  to = "/<app>/privacy-policy/"
  status = 200
```

Also note this in Task 12's expected file list.

- [ ] **Step 7: Commit**

```bash
bunx prettier --write src/lib/actions/landing-reveal.js src/lib/components/LandingCountdown.svelte "src/routes/(landing)"
bun test && bun run build
git add src/lib static "src/routes/(landing)"
git commit -m "Port the four app landing pages and their privacy policies to Svelte routes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Sitemap and robots

**Files:**
- Create: `src/lib/site-pages.js`, `src/lib/site-pages.test.js`, `src/routes/sitemap.xml/+server.js`, `static/robots.txt`

**Interfaces:**
- Produces: `sitemapPaths() → string[]` (absolute URLs)

- [ ] **Step 1: Write the failing test**

`src/lib/site-pages.test.js`:

```js
import { test, expect } from "bun:test";
import { sitemapPaths } from "./site-pages.js";

test("the sitemap lists every public page, matching the old hand-kept file", () => {
  expect(sitemapPaths()).toEqual([
    "https://cilippofilia.dev/home",
    "https://cilippofilia.dev/privacy",
    "https://cilippofilia.dev/terms",
    "https://cilippofilia.dev/drinko/",
    "https://cilippofilia.dev/drinko/privacy-policy.html",
    "https://cilippofilia.dev/iterly/",
    "https://cilippofilia.dev/iterly/privacy-policy.html",
    "https://cilippofilia.dev/itswritten/",
    "https://cilippofilia.dev/itswritten/privacy-policy.html",
    "https://cilippofilia.dev/nine-tiles-puzzle/",
    "https://cilippofilia.dev/nine-tiles-puzzle/privacy-policy.html",
    "https://cilippofilia.dev/the-relay",
  ]);
});
```

Run it. Expected: FAIL, module not found.

- [ ] **Step 2: Implement**

`src/lib/site-pages.js`:

```js
// Every public page at its canonical URL, for sitemap.xml. Built from the
// same lists the routes use, so a new landing page or public dev app can't
// be missed. Left out on purpose: /style-guide (internal reference) and the
// 404 page.

import { SITE_ORIGIN } from "./apps/meta.js";
import { LANDING_APPS } from "./apps/landing-apps.js";
import { publicDevApps } from "./apps/dev-apps.js";

const SITE_PAGES = ["/home", "/privacy", "/terms"];

export function sitemapPaths() {
  return [
    ...SITE_PAGES,
    ...LANDING_APPS.flatMap((app) => [`/${app}/`, `/${app}/privacy-policy.html`]),
    ...publicDevApps().map((app) => `/${app.slug}`),
  ].map((p) => SITE_ORIGIN + p);
}
```

`src/routes/sitemap.xml/+server.js`:

```js
import { sitemapPaths } from "$lib/site-pages.js";

export const prerender = true;

export function GET() {
  const urls = sitemapPaths()
    .map((loc) => `  <url><loc>${loc}</loc></url>`)
    .join("\n");
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
```

`cp web/robots.txt static/robots.txt`.

- [ ] **Step 3: Check, then commit**

1. Run `bun test src/lib/site-pages.test.js`. Expected: PASS.
2. Run `bun run build && cat build/sitemap.xml && cat build/robots.txt`.
3. Commit:

```bash
bunx prettier --write src/lib/site-pages.js src/lib/site-pages.test.js src/routes/sitemap.xml
git add src/lib/site-pages.js src/lib/site-pages.test.js src/routes/sitemap.xml static/robots.txt
git commit -m "Generate the sitemap from the route lists and move robots.txt to static

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Build-output test

**Files:**
- Create: `src/build-output.test.js`

This replaces what `router.test.js` covered for pages: that every page exists, carries its head tags and has no stray scripts, plus the header parity check.

- [ ] **Step 1: Write the test**

`src/build-output.test.js`:

```js
// Builds the site once and checks the prerendered output: every public page
// exists, carries its head tags, runs no script but SvelteKit's hashed
// bootstrap, and netlify.toml sends the same security headers as the dev
// hook. Slow (a full vite build), so it runs once per bun test.

import { test, expect, beforeAll } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { $ } from "bun";
import { SECURITY_HEADERS } from "./lib/server/security-headers.js";
import { sitemapPaths } from "./lib/site-pages.js";
import { validDevApps } from "./lib/apps/dev-apps.js";

// Where adapter-netlify writes prerendered pages (confirmed in Task 1).
const PUBLISH_DIR = path.join(process.cwd(), "build");

beforeAll(async () => {
  await $`bunx --bun vite build`.quiet();
}, 180_000);

const read = (rel) => fs.readFileSync(path.join(PUBLISH_DIR, rel), "utf8");

// Canonical URL → prerendered file.
function fileFor(url) {
  const p = new URL(url).pathname;
  if (p.endsWith("/")) return `${p.slice(1)}index.html`;
  if (p.endsWith(".html")) return p.slice(1);
  return `${p.slice(1)}.html`;
}

const pages = [...sitemapPaths(), "https://cilippofilia.dev/style-guide"];

test("every public page and every dev app is prerendered", () => {
  for (const url of pages) expect(fs.existsSync(path.join(PUBLISH_DIR, fileFor(url)))).toBe(true);
  for (const app of validDevApps()) expect(fs.existsSync(path.join(PUBLISH_DIR, `${app.slug}.html`))).toBe(true);
});

test("each page has one h1, its head tags, and its own canonical", () => {
  for (const url of pages) {
    const html = read(fileFor(url));
    expect(html.match(/<h1[\s>]/g)?.length).toBe(1);
    expect(html).toMatch(/<title>[^<]+<\/title>/);
    expect(html).not.toMatch(/<title>[^<]*—/);
    expect(html).toContain('name="description"');
    expect(html).toContain(`<link rel="canonical" href="${url}"`);
    for (const og of ["og:type", "og:site_name", "og:url", "og:title", "og:description", "og:image"]) {
      expect(html).toContain(`property="${og}"`);
    }
    expect(html).toContain('name="theme-color" content="#000000"');
    expect(html).toContain('rel="icon"');
  }
});

test("every page carries the hash-based CSP meta and no stray inline script", () => {
  for (const url of pages) {
    const html = read(fileFor(url));
    const meta = html.match(/<meta http-equiv="content-security-policy" content="([^"]+)"/i);
    expect(meta).not.toBeNull();
    const scriptSrc = meta[1].split(";").find((d) => d.trim().startsWith("script-src"));
    expect(scriptSrc).toContain("'self'");
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(html).not.toMatch(/\son[a-z]+="/);
    expect(html).not.toContain("javascript:");
  }
});

test("the old privacy policy URLs are files on disk", () => {
  for (const app of ["drinko", "iterly", "itswritten", "nine-tiles-puzzle"]) {
    expect(fs.existsSync(path.join(PUBLISH_DIR, app, "privacy-policy.html"))).toBe(true);
  }
});

test("sitemap.xml and robots.txt are published", () => {
  const sitemap = read("sitemap.xml");
  for (const url of sitemapPaths()) expect(sitemap).toContain(`<loc>${url}</loc>`);
  expect(read("robots.txt")).toContain("Sitemap: https://cilippofilia.dev/sitemap.xml");
});

test("netlify.toml sends exactly the dev hook's security headers", () => {
  const toml = fs.readFileSync(path.join(process.cwd(), "netlify.toml"), "utf8");
  const block = toml.slice(toml.indexOf("[headers.values]"));
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    expect(block).toContain(`${name} = "${value}"`);
  }
});
```

- [ ] **Step 2: Run it**

Run `bun test src/build-output.test.js`.

Expected: every test passes **except** the `netlify.toml` one, which fails on `script-src` until Task 13 updates `netlify.toml`.
- If the CSP meta test fails **only** on the four `csr = false` privacy pages (SvelteKit may skip the meta tag on pages that ship no JS), add `<meta http-equiv="Content-Security-Policy" content="script-src 'none'" />` to each privacy page's `<svelte:head>`, change the test to accept `script-src 'none'` on those four files, and note it in the test's comment. Those pages run no script, so `'none'` is the strictest correct policy.
- If the privacy URL test fails and the Task 1/Task 10 fallback applies, change that test to check `<app>/privacy-policy/index.html` and keep a comment pointing at the `netlify.toml` rewrite.
- Fix anything else that fails before going on.

- [ ] **Step 3: Commit, with the known failure noted**

```bash
bunx prettier --write src/build-output.test.js
git add src/build-output.test.js
git commit -m "Test the prerendered build output for pages, head tags, CSP and headers

The netlify.toml header test fails until the cutover updates script-src.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Cutover: Netlify config, delete the old site, scripts

**Files:**
- Modify: `netlify.toml`, `package.json`, `.gitignore`, `src/test-setup.js` (only if its path logic breaks), `README.md` (commands section only; the full rewrite is Task 14)
- Delete:
  - `server.js`
  - `src/server/` (all of it, including `router.test.js` and `dev-apps.js`)
  - `src/build/` (all of it)
  - `src/client/`
  - `netlify/`
  - `web/`

- [ ] **Step 1: Rewrite `netlify.toml`**

```toml
# Netlify deploy of the SvelteKit site. adapter-netlify writes the
# prerendered pages and static/ to the publish folder, and puts the
# on-demand routes (/api/*, and the 404 page for unknown paths) into a
# Netlify Function.
#
# /api/maze-score and /api/notfound-score answer 503 here: their scores
# live in bun:sqlite files, which only exist where the site runs on Bun.
# Both games treat that as "no saved scores" and play on.

[build]
  command = "bun run build"
  publish = "build"

# Kept identical to REDIRECTS in src/hooks.server.js.
[[redirects]]
  from = "/"
  to = "/home"
  status = 302
  force = true

[[redirects]]
  from = "/app-store"
  to = "/home#apps"
  status = 301
  force = true

[[redirects]]
  from = "/favicon.ico"
  to = "/assets/favicon.svg"
  status = 200

# Security headers for every page and file. Kept identical to
# SECURITY_HEADERS in src/lib/server/security-headers.js (the reasoning for
# each value lives there); src/build-output.test.js fails if they drift.
# script-src allows inline here because every page also carries SvelteKit's
# hash-based CSP meta tag, which narrows it to the one bootstrap script.
# HSTS isn't set here because Netlify already sends it for the custom domain.
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.mzstatic.com; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'"
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
    Cross-Origin-Opener-Policy = "same-origin"
```

- Use the publish dir recorded in Task 1, if it differs from `build`.
- Add the Task 10, Step 6 privacy rewrites only if that fallback applied.
- The `/home`, `/style-guide`, `/privacy` and `/terms` rewrites are gone, because those pages are now files.

- [ ] **Step 2: Delete the old site and update scripts**

```bash
git rm -r server.js src/server src/build src/client netlify web
```

In `package.json`:
- Delete `legacy:build` and `legacy:start`.
- Set `"start": "bun run build && bunx --bun vite preview"`.
- Leave `animejs` in `dependencies`.

In `.gitignore`:
- Delete the `web/js/floating-icons.bundle.js`, `web/apps.json` and `web/_redirects` entries, and their comments.
- Change `# Node (no deps today, …)` to `# Node`.

- [ ] **Step 3: Run the full suite**

Run `bun test`.

Expected: all pass, including `src/build-output.test.js` (the header test now passes). If `src/test-setup.js` fails, it resolves `SCORES_DIR_OVERRIDE` from `import.meta.dir/..`, which is still the repo root. Fix the path only if the run shows it's wrong.

- [ ] **Step 4: Check every route against the dev server and the preview**

Run `bun run dev`, then `bun run start` (build + preview). Against each, run:

```bash
for p in / /home /app-store /style-guide /privacy /terms /favicon.ico /robots.txt /sitemap.xml /the-relay \
         /drinko /drinko/ /drinko/privacy-policy.html /iterly/ /iterly/privacy-policy.html \
         /itswritten/ /itswritten/privacy-policy.html /nine-tiles-puzzle/ /nine-tiles-puzzle/privacy-policy.html \
         /api/appstore-apps /api/maze-score /api/notfound-score /nope; do
  printf '%-45s %s\n' "$p" "$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "http://localhost:4321$p")"
done
```

Expected:

| Path | Status |
|---|---|
| `/` | `302` → `/home` |
| `/app-store` | `301` → `/home#apps` |
| `/drinko` | `308` (or `301`) → `/drinko/` |
| `/nope` | `404` |
| everything else | `200` |

The preview runs the built output through SvelteKit's server, not Netlify, so the netlify.toml redirects are not exercised here; Task 15 covers those.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Switch the site to SvelteKit and remove the hand-rolled server and router

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: Rewrite CLAUDE.md, README and the rules for SvelteKit

**Files:**
- Modify: `CLAUDE.md`, `README.md`, and in `.claude/rules/`: `general.md`, `server.md`, `client-js.md`, `css.md`, `html-pages.md`, `testing.md`

Every statement in the rewritten files must describe code that now exists. Check each path you mention with `ls`.

- [ ] **Step 1: `CLAUDE.md`**
  - Keep the canary rule paragraph exactly as it is.
  - Remove the "SvelteKit migration in progress" paragraph.
  - The first line describes the site: "a SvelteKit site (Svelte 5, adapter-netlify, prerendered) run with Bun". Keep the sentence saying the Swift rules don't apply.
  - Keep the Bun section.
  - Replace the APIs exception paragraph with: "`src/lib/server/appstore.js` also runs on Node inside the Netlify Function, so it gets no Bun-only APIs. `bun:sqlite` is only loaded through `src/lib/server/score-stores.js`."
  - Commands: `dev`, `build`, `start`, `test`, `format`/`format:check`, and the test-database note. Drop every `server.js`, `bun run build`-for-floating-icons and port-flag line that no longer applies.
  - Rewrite the Architecture section from the spec's Architecture, Routing, Data flow and Security sections. Cover:
    - the two layout groups
    - the route tree
    - hooks
    - the score and App Store APIs
    - the `init…(root, { signal })` pattern
    - `data-sveltekit-reload`
    - global page CSS
  - Rewrite the Netlify section: publish dir, function, the only hand-synced items (`REDIRECTS` and `SECURITY_HEADERS`), and the score endpoints answering 503.

- [ ] **Step 2: `.claude/rules/`**

  **`general.md`:**
  - First bullet: "SvelteKit site run with Bun".
  - "No frameworks" becomes: "SvelteKit/Svelte is the only framework. No new dependencies without asking first; `animejs` is the only runtime dependency."
  - Delete the migration exception paragraph.
  - The `Before claiming done` line becomes `run bun test` (the build test covers `bun run build`).
  - The "Keep local and Netlify in sync" section shrinks to `REDIRECTS` ↔ `[[redirects]]` and `SECURITY_HEADERS` ↔ `[[headers]]`.

  **`server.md`:**
  - `paths:` frontmatter becomes `src/hooks*.js`, `src/routes/**/+server.js`, `src/lib/server/**`, `netlify.toml`, `data/`.
  - Content:
    - ESM, relative imports in anything tested
    - endpoints thin, logic in `src/lib/server`
    - Node compatibility for `appstore.js`
    - `score-stores.js` as the only `bun:sqlite` entry
    - security headers in one module
    - the cross-origin guard
    - `SCORES_DIR`

  **`client-js.md`:**
  - `paths:` becomes `src/lib/**/*.js`, `src/lib/**/*.svelte`, `src/routes/**/*.svelte`, excluding `src/lib/server`.
  - Content:
    - Svelte 5 runes
    - pure logic in `.js` with tests
    - imperative modules use the `init…(root, { signal })` pattern, with static markup in the owning component
    - no `{@html}`, since Svelte escaping replaced `escapeHtml`
    - reduced motion
    - failing quietly: a fetch checks `r.ok` and an error falls back silently

  **`css.md`:**
  - `paths:` becomes `src/lib/styles/**`.
  - Keep tokens, Liquid Glass, dark-only and the reduced-motion rules.
  - Load order is now the `(site)` layout's import order.
  - Page stylesheets stay global (and why). Scoped `<style>` is for new single-component rules.
  - Landing pages import only `landing.css` and their `apps/<app>.css`.

  **`html-pages.md`:**
  - Rename it to `pages.md`, and update its link in `CLAUDE.md`.
  - `paths:` becomes `src/routes/**/*.svelte`, `src/app.html`.
  - Content:
    - every page uses `<Seo>`
    - one `<h1>`
    - titles with `·`
    - a new site page is a folder under `(site)/` and is added to `SITE_PAGES` in `src/lib/site-pages.js`
    - a new landing page goes under `(landing)/` and into `LANDING_APPS`
    - privacy URL rules
    - the accessibility list, unchanged

  **`testing.md`:**
  - `bun:test`, colocated.
  - The build-output test, and what it covers.
  - Endpoint logic is tested through `score-api.js`.
  - Hook tests.
  - `SCORES_DIR` isolation, unchanged.
  - No `$lib` imports in tested files.

- [ ] **Step 3: `README.md`**

Rewrite the setup, commands and "adding an app page" sections:
- An in-development app is an `apps.json` entry, prerendered automatically.
- A landing page is a new `(landing)/<app>/` folder, plus `LANDING_APPS`, plus `CUSTOM_APP_PAGES` if it's published.

Keep everything else that's still accurate.

- [ ] **Step 4: Commit**

```bash
bun test
git add CLAUDE.md README.md .claude/rules
git commit -m "Rewrite CLAUDE.md, the README and the rules for the SvelteKit site

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 15: Netlify deploy preview check (with the user)

This needs the user: pushing the branch and opening a PR are outward-facing, so ask before doing either.

- [ ] **Step 1: Ask the user** whether to push `svelte-migration` and open a draft PR, which triggers a Netlify deploy preview.
- [ ] **Step 2: On the preview,** run the Task 13, Step 4 loop against the preview URL instead of `localhost:4321`. Expected statuses:
  - the same as Task 13, apart from these:
  - `/api/maze-score` and `/api/notfound-score`: `503`
  - `/`: `302` from `netlify.toml`
- [ ] **Step 3: In a browser on the preview,** for every page:
  - zero console CSP violations
  - the apps block loads live data
  - both games play to the end without errors, with no scores saved
  - landing pages and privacy pages match production
- [ ] **Step 4: Check the headers.** Run `curl -sI <preview>/home` and confirm it shows all six security headers. Run `curl -s <preview>/home | grep -o '<meta http-equiv="content-security-policy"[^>]*>'` and confirm the meta tag is present.
- [ ] **Step 5: Report to the user** with the results, including anything that differed. Merging is their call.
