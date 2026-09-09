# cilippofilia.dev Site Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the server crash and soft-404s, harden the client rendering, drop the CDN dependency, shrink the served assets, deduplicate the landing-page code, and bring the docs, metadata and style guide back in line with the site that actually exists.

**Architecture:** The site stays a plain `node:http` server plus static HTML/CSS/JS under `web/`. The request handler moves out of `server.js` into `src/server/router.js` so it can be tested with `bun test` on an ephemeral port. Client-side rendering gets a tiny `escapeHtml` helper and one testable module per page. The four landing pages share one stylesheet and one reveal script, each keeping only a small theme file. No framework is introduced; the Svelte migration branch is left untouched.

**Tech Stack:** Bun 1.3.14 (test runner, bundler, script runner), Node-compatible CommonJS server (`node:http`, `node:fs`), vanilla ES modules in the browser, `animejs@4.5.0` (already in `package.json`), `prettier@3` (already in `devDependencies`), macOS `sips` for image resizing.

**Spec:** [docs/superpowers/specs/2026-09-09-site-review.md](../specs/2026-09-09-site-review.md)

## Global Constraints

- Work on branch `design-polish` (already checked out). Never commit to `main` directly.
- Run everything with Bun: `bun test`, `bun server.js`, `bun run <script>`, `bunx prettier`. Never `npm`/`npx`.
- Server code stays CommonJS (`require`/`module.exports`) to match `server.js` and `src/server/*`. Browser code under `web/js/` stays ES modules, except `web/js/nav.js` and the new `web/js/reveal.js`, which are classic scripts on purpose (they must run before deferred modules).
- No third-party runtime dependency beyond `animejs`, which is already installed. Do not add packages.
- The server keeps binding to `127.0.0.1` only. Do not change `HOST`.
- No visual redesign. Every task that touches CSS or HTML must leave the page looking the same in the browser except where the task says otherwise.
- Preserve every existing test in `web/js/app-card.test.js`; extend, do not rewrite.
- Every task ends with `bun test` green and a commit. Commit messages: imperative mood, one line, no prefix tags (matches the repo's history, e.g. "Add the Iterly app landing page and privacy policy").
- The site is dark-only (`color-scheme: dark` in `web/css/tokens.css`). Do not introduce a light theme.
- Verification with curl uses port 4321 unless a step says otherwise. Start the server in the background with `PORT=4321 bun server.js &` and stop it with `kill %1` at the end of the step.

---

## File Structure

```
server.js                              # shrinks to: require router, listen (Task 2)
src/server/
  router.js                            # NEW — the routing table + request handler (Task 2)
  router.test.js                       # NEW — routing tests on an ephemeral port (Task 2+)
  dev-apps.js                          # NEW — reads data/apps.json, hasDevApp(slug) (Task 3)
  static.js                            # gains status param, HEAD, Cache-Control, Content-Length (Tasks 3–4)
  appstore.js                          # comment fix only (Task 12)
src/client/
  floating-icons.js                    # NEW — source for the bundled icon drift, imports animejs (Task 7)
web/
  404.html                             # NEW — real not-found page (Task 3)
  index.html                           # CDN tag removed, metadata added (Tasks 7–8)
  app.html                             # inline script replaced by /js/app-page.js (Task 6)
  style-guide.html                     # rebuilt on the real tokens (Task 13)
  js/
    html.js                            # NEW — escapeHtml (Task 5)
    html.test.js                       # NEW (Task 5)
    app-card.js                        # escapes its inputs (Task 5)
    apps-feed.js                       # escapes the featured strip (Task 5)
    app-detail.js                      # NEW — pure renderers for the app template (Task 6)
    app-detail.test.js                 # NEW (Task 6)
    app-page.js                        # NEW — fetch + mount for app.html (Task 6)
    floating-icons.js                  # DELETED, replaced by floating-icons.bundle.js (gitignored) (Task 7)
    reveal.js                          # NEW — shared IntersectionObserver reveal (Task 10)
  css/
    landing.css                        # NEW — shared landing-page stylesheet (Task 11)
  drinko/ iterly/ itswritten/ nine-tiles-puzzle/
    index.html, privacy-policy.html    # metadata, hub link, shared script/css links (Tasks 8, 10, 11)
    theme.css                          # NEW — per-app tokens only (Task 11)
    page.css                           # NEW, iterly + nine-tiles only — page-specific blocks (Task 11)
    style.css                          # DELETED (Task 11)
    app.js                             # DELETED for drinko/iterly/itswritten; countdown-only for nine-tiles (Task 10)
    assets/icon.png                    # downscaled to 320px (Task 9)
  assets/app-icons/*.png               # the five 1024px originals DELETED (Task 9)
public/                                # DELETED (Task 12)
README.md, .gitignore, package.json, .prettierrc   # (Tasks 7, 12)
```

---

### Task 1: Land the in-progress card-actions work

The working tree already holds the "Website / App Store" card buttons and their test. Commit them first so every later task starts from a clean tree.

**Files:**
- Modify (already modified, just commit): `src/server/appstore.js`, `web/css/components.css`, `web/js/app-card.js`, `web/js/apps-feed.js`, `web/app.html` (back-link copy changed to "‹ Go back")
- Add: `web/js/app-card.test.js`

- [x] **Step 1: Confirm the tests pass as they stand**

Run: `bun test`
Expected: `4 pass, 0 fail`

- [x] **Step 2: Confirm the diff is only the card-actions work**

Run: `git status --short && git diff --stat`
Expected: exactly `src/server/appstore.js`, `web/app.html`, `web/css/components.css`, `web/js/app-card.js`, `web/js/apps-feed.js` modified and `web/js/app-card.test.js` untracked. If anything else shows up, stop and report it.

- [x] **Step 3: Commit**

```bash
git add src/server/appstore.js web/app.html web/css/components.css web/js/app-card.js web/js/apps-feed.js web/js/app-card.test.js
git commit -m "Give every app card Website and App Store buttons and link the three shipped apps to their pages"
```

---

### Task 2: Move routing into a testable module and stop malformed URLs from killing the server

**Files:**
- Create: `src/server/router.js`
- Create: `src/server/router.test.js`
- Modify: `server.js` (whole file)

**Interfaces:**
- Produces: `handleRequest(req, res)` — `async`, exported from `src/server/router.js`, usable directly as the argument to `http.createServer`. Never throws; a malformed path answers 400, any other error answers 500.
- Produces: the test helper `request(method, path)` inside `router.test.js` returning `{ status, headers, body }`. Later tasks add tests to this file using it.

- [x] **Step 1: Write the failing test file**

Create `src/server/router.test.js`:

```js
import { test, expect, beforeAll, afterAll } from "bun:test";
import http from "node:http";
import { handleRequest } from "./router.js";

let server;
let port;

beforeAll(async () => {
  server = http.createServer(handleRequest);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  port = server.address().port;
});

afterAll(() => {
  server.close();
});

// Raw node:http so the path goes out exactly as written (fetch would
// re-encode "%") and redirects are not followed.
export function request(method, path) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: "127.0.0.1", port, path, method }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on("error", reject);
    req.end();
  });
}

test("a malformed percent-escape answers 400 and the server keeps serving", async () => {
  const bad = await request("GET", "/%");
  expect(bad.status).toBe(400);

  const next = await request("GET", "/home");
  expect(next.status).toBe(200);
});

test("/ redirects to /home and /app-store to /home#apps", async () => {
  const root = await request("GET", "/");
  expect(root.status).toBe(302);
  expect(root.headers.location).toBe("/home");

  const old = await request("GET", "/app-store");
  expect(old.status).toBe(301);
  expect(old.headers.location).toBe("/home#apps");
});

test("shared static files and custom app folders are served", async () => {
  const css = await request("GET", "/css/base.css");
  expect(css.status).toBe(200);
  expect(css.headers["content-type"]).toBe("text/css; charset=utf-8");

  const bare = await request("GET", "/drinko");
  expect(bare.status).toBe(302);
  expect(bare.headers.location).toBe("/drinko/");

  const page = await request("GET", "/drinko/");
  expect(page.status).toBe(200);
  expect(page.body).toContain("<title>Drinko");
});

test("a path that escapes the public folder is refused", async () => {
  const res = await request("GET", "/css/../server.js");
  expect([403, 404]).toContain(res.status);
  expect(res.body).not.toContain("createServer");
});
```

- [x] **Step 2: Run it to verify it fails**

Run: `bun test src/server/router.test.js`
Expected: FAIL — `Cannot find module './router.js'`

- [x] **Step 3: Create `src/server/router.js`**

Move the whole routing body out of `server.js`. The file becomes:

```js
// The routing table for cilippofilia.dev, and the request handler that
// walks it. Lives apart from server.js so the routes can be exercised by
// bun test on an ephemeral port without touching the real listener.
//
// - /home maps to web/index.html. The old /app-store page is gone — its
//   content now lives in a section of /home, and the path redirects there so
//   existing links still land somewhere sensible.
// - A path like /nine-tiles-puzzle that matches a folder in web/ with its
//   own index.html (a full custom landing page, own CSS/JS/assets) is served
//   straight from that folder.
// - Any other single-segment path falls back to web/app.html, a generic
//   template that looks itself up in data/apps.json by the URL slug.

const fs = require("fs");
const path = require("path");

const { getPublishedApps } = require("./appstore");
const { PUBLIC_DIR, DATA_DIR, send, redirect, serveFile, serveWithin } = require("./static");

// Directories under web/ served verbatim. Anything not listed here is
// routed explicitly below, so a new top-level folder has to be opted in
// rather than being exposed the moment it is created.
const STATIC_DIRS = ["/css/", "/js/", "/assets/"];

// Pages that map straight to a file in web/.
const PAGES = {
  "/home": "index.html",
  "/style-guide": "style-guide.html",
};

// Paths that have moved. Kept so old links and bookmarks still land.
const REDIRECTS = {
  "/": ["/home", 302],
  "/app-store": ["/home#apps", 301],
};

async function route(pathname, req, res) {
  if (REDIRECTS[pathname]) {
    const [location, status] = REDIRECTS[pathname];
    redirect(res, location, status);
    return;
  }

  // Live data: apps actually published on the App Store, fetched from Apple
  // and cached for a few minutes.
  if (pathname === "/api/appstore-apps") {
    const apps = await getPublishedApps();
    send(res, 200, JSON.stringify(apps), "application/json; charset=utf-8");
    return;
  }

  if (pathname === "/apps.json") {
    serveFile(res, path.join(DATA_DIR, "apps.json"));
    return;
  }

  if (pathname === "/favicon.ico") {
    serveFile(res, path.join(PUBLIC_DIR, "assets", "favicon.svg"));
    return;
  }

  if (STATIC_DIRS.some((dir) => pathname.startsWith(dir))) {
    serveWithin(res, PUBLIC_DIR, pathname);
    return;
  }

  if (PAGES[pathname]) {
    serveFile(res, path.join(PUBLIC_DIR, PAGES[pathname]));
    return;
  }

  // A custom multi-file app site: web/<slug>/index.html plus its own
  // CSS/JS/assets, served as-is.
  const firstSlash = pathname.indexOf("/", 1);
  const firstSegment = firstSlash === -1 ? pathname.slice(1) : pathname.slice(1, firstSlash);
  const customDir = firstSegment ? path.join(PUBLIC_DIR, firstSegment) : null;
  const hasCustomPage = customDir && fs.existsSync(path.join(customDir, "index.html"));

  if (hasCustomPage) {
    if (firstSlash === -1) {
      // Bare "/slug" — redirect to "/slug/" so the page's relative links
      // (style.css, assets/icon.png, ...) resolve against the right folder.
      redirect(res, `/${firstSegment}/`);
      return;
    }
    const rest = pathname.slice(firstSlash + 1);
    serveWithin(res, customDir, `/${rest === "" ? "index.html" : rest}`);
    return;
  }

  // Anything else that looks like a single clean slug (e.g. /the-relay)
  // falls back to the generic app template, which resolves itself against
  // data/apps.json in the browser.
  if (/^\/[a-zA-Z0-9-]+$/.test(pathname)) {
    serveFile(res, path.join(PUBLIC_DIR, "app.html"));
    return;
  }

  send(res, 404, "404 Not Found");
}

// The one entry point. A bad percent-escape used to throw out of
// decodeURIComponent and, because nothing awaited the async handler, take
// the whole process down with it — so both the decode and the routing are
// fenced here and answered with a status code instead.
async function handleRequest(req, res) {
  let pathname;
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    pathname = decodeURIComponent(url.pathname);
  } catch {
    send(res, 400, "400 Bad Request");
    return;
  }

  try {
    await route(pathname, req, res);
  } catch (err) {
    console.error(`Error handling ${req.method} ${req.url}:`, err);
    if (!res.headersSent) send(res, 500, "500 Internal Server Error");
    else res.end();
  }
}

module.exports = { handleRequest, STATIC_DIRS, PAGES, REDIRECTS };
```

- [x] **Step 4: Shrink `server.js` to the listener**

Replace the whole of `server.js` with:

```js
// Local-only static server for cilippofilia.dev.
//
// Binds to 127.0.0.1 only — nothing outside this machine can reach it.
// The routing table lives in src/server/router.js; the file-reading and App
// Store plumbing in the rest of src/server/. This file only listens.
//
// Run with: bun server.js
// Then open: http://localhost:4321/home

const http = require("http");
const { handleRequest } = require("./src/server/router");

const PORT = process.env.PORT ? Number(process.env.PORT) : 4321;
const HOST = "127.0.0.1"; // local only, on purpose

http.createServer(handleRequest).listen(PORT, HOST, () => {
  console.log(`cilippofilia.dev running locally at http://${HOST}:${PORT}/home`);
  console.log("(bound to 127.0.0.1 — not reachable from any other device)");
});
```

- [x] **Step 5: Run the tests to verify they pass**

Run: `bun test`
Expected: `8 pass, 0 fail` (4 existing + 4 new)

- [x] **Step 6: Verify against the real server**

```bash
PORT=4321 bun server.js &
sleep 1
curl -s -o /dev/null -w "%{http_code}\n" 'http://127.0.0.1:4321/%'     # expect 400
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:4321/home     # expect 200 (server still alive)
kill %1
```

- [x] **Step 7: Commit**

```bash
git add server.js src/server/router.js src/server/router.test.js
git commit -m "Move routing into src/server/router.js and answer malformed URLs with 400 instead of crashing"
```

---

### Task 3: Return a real 404 for unknown slugs, and answer HEAD without a body

**Files:**
- Create: `src/server/dev-apps.js`
- Create: `web/404.html`
- Modify: `src/server/static.js` (`send`, `serveFile`)
- Modify: `src/server/router.js` (the slug fallback)
- Test: `src/server/router.test.js`

**Interfaces:**
- Consumes: `request(method, path)` from Task 2's test file.
- Produces: `hasDevApp(slug) -> boolean` and `loadDevApps() -> Array` in `src/server/dev-apps.js`; `serveFile(res, filePath, status = 200)` in `static.js`.

- [x] **Step 1: Add the failing tests**

Append to `src/server/router.test.js`:

```js
test("a slug listed in data/apps.json gets the app template", async () => {
  const res = await request("GET", "/the-relay");
  expect(res.status).toBe(200);
  expect(res.body).toContain('id="content"');
});

test("a slug that exists nowhere answers 404 with the not-found page", async () => {
  const res = await request("GET", "/definitely-not-an-app");
  expect(res.status).toBe(404);
  expect(res.headers["content-type"]).toBe("text/html; charset=utf-8");
  expect(res.body).toContain("Nothing here");
});

test("HEAD carries the headers of a GET but no body", async () => {
  const res = await request("HEAD", "/home");
  expect(res.status).toBe(200);
  expect(Number(res.headers["content-length"])).toBeGreaterThan(1000);
  expect(res.body).toBe("");
});
```

- [x] **Step 2: Run to verify they fail**

Run: `bun test src/server/router.test.js`
Expected: the three new tests FAIL (200 instead of 404; missing content-length; body not empty).

- [x] **Step 3: Create `src/server/dev-apps.js`**

```js
// The in-development apps: one entry per landing page in data/apps.json.
// Read fresh on every call — the file is a few hundred bytes and reading it
// each time is what lets "save apps.json, refresh the browser" keep working
// with no restart.

const fs = require("fs");
const path = require("path");
const { DATA_DIR } = require("./static");

function loadDevApps() {
  try {
    const parsed = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "apps.json"), "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Couldn't read data/apps.json:", err.message);
    return [];
  }
}

function hasDevApp(slug) {
  return loadDevApps().some((app) => app && app.slug === slug);
}

module.exports = { loadDevApps, hasDevApp };
```

- [x] **Step 4: Teach `static.js` about status codes, HEAD and Content-Length**

In `src/server/static.js`, replace the `send` and `serveFile` functions with:

```js
function send(res, status, body, contentType, extraHeaders = {}) {
  const payload = Buffer.isBuffer(body) ? body : Buffer.from(String(body));
  res.writeHead(status, {
    "Content-Type": contentType || "text/plain; charset=utf-8",
    "Content-Length": payload.length,
    ...extraHeaders,
  });
  // node's ServerResponse carries its request as res.req; a HEAD answer is
  // the GET headers with the body withheld.
  if (res.req && res.req.method === "HEAD") {
    res.end();
    return;
  }
  res.end(payload);
}

function serveFile(res, filePath, status = 200) {
  const ext = path.extname(filePath).toLowerCase();
  fs.readFile(filePath, (err, data) => {
    if (err) {
      send(res, 404, "404 Not Found");
      return;
    }
    send(res, status, data, MIME[ext] || "application/octet-stream");
  });
}
```

Leave `redirect` and `serveWithin` as they are.

- [x] **Step 5: Create `web/404.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Not found — cilippofilia.dev</title>
  <meta name="robots" content="noindex" />
  <link rel="stylesheet" href="/css/tokens.css" />
  <link rel="stylesheet" href="/css/base.css" />
  <link rel="stylesheet" href="/css/layout.css" />
  <link rel="stylesheet" href="/css/components.css" />
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />
  <meta name="theme-color" content="#000000" />
</head>
<body>
  <main>
    <div class="wrap">
      <section class="hero" style="margin-top:0">
        <h1>Nothing here.</h1>
        <p class="lede">That address doesn't match a page or an app on this site.</p>
        <div class="button-row">
          <a class="button" href="/home">Back home</a>
          <a class="button secondary" href="/home#apps">See the apps</a>
        </div>
      </section>
    </div>
  </main>
  <script src="/js/nav.js"></script>
</body>
</html>
```

- [x] **Step 6: Route unknown slugs to it**

In `src/server/router.js`, add near the top with the other requires:

```js
const { hasDevApp } = require("./dev-apps");
```

Replace the final two blocks of `route()` (the `/^\/[a-zA-Z0-9-]+$/` fallback and the trailing `send(res, 404, ...)`) with:

```js
  // A single clean slug that has an entry in data/apps.json gets the
  // generic app template, which renders that entry in the browser.
  if (/^\/[a-zA-Z0-9-]+$/.test(pathname) && hasDevApp(pathname.slice(1))) {
    serveFile(res, path.join(PUBLIC_DIR, "app.html"));
    return;
  }

  serveFile(res, path.join(PUBLIC_DIR, "404.html"), 404);
```

- [x] **Step 7: Run the tests**

Run: `bun test`
Expected: `11 pass, 0 fail`

- [x] **Step 8: Verify in the browser**

Start `PORT=4321 bun server.js &`, open http://127.0.0.1:4321/whatever — the dark not-found page with header, footer and two buttons should render; http://127.0.0.1:4321/the-relay still renders the relay page. `kill %1`.

- [x] **Step 9: Commit**

```bash
git add src/server/dev-apps.js src/server/static.js src/server/router.js src/server/router.test.js web/404.html
git commit -m "Answer unknown slugs with a real 404 page and serve HEAD requests without a body"
```

---

### Task 4: Cache headers for static files

**Files:**
- Modify: `src/server/static.js` (`serveFile`)
- Test: `src/server/router.test.js`

- [x] **Step 1: Add the failing test**

Append to `src/server/router.test.js`:

```js
test("assets are cacheable for an hour, pages and feeds are revalidated", async () => {
  const css = await request("GET", "/css/base.css");
  expect(css.headers["cache-control"]).toBe("public, max-age=3600");

  const icon = await request("GET", "/assets/app-icons/thumb/relay-icon.png");
  expect(icon.headers["cache-control"]).toBe("public, max-age=3600");

  const home = await request("GET", "/home");
  expect(home.headers["cache-control"]).toBe("no-cache");

  const feed = await request("GET", "/apps.json");
  expect(feed.headers["cache-control"]).toBe("no-cache");
});
```

- [x] **Step 2: Run to verify it fails**

Run: `bun test src/server/router.test.js`
Expected: FAIL — `cache-control` is `undefined`.

- [x] **Step 3: Implement**

In `src/server/static.js`, add below the `MIME` table:

```js
// HTML and the two JSON feeds change whenever their files do, so the
// browser must always revalidate; everything else (CSS, JS, images) is
// safe to hold for an hour on a local machine.
const CACHE_CONTROL = {
  ".html": "no-cache",
  ".json": "no-cache",
};
const DEFAULT_CACHE_CONTROL = "public, max-age=3600";
```

and change the success branch of `serveFile` to:

```js
    send(res, status, data, MIME[ext] || "application/octet-stream", {
      "Cache-Control": CACHE_CONTROL[ext] || DEFAULT_CACHE_CONTROL,
    });
```

- [x] **Step 4: Run the tests**

Run: `bun test`
Expected: `12 pass, 0 fail`

- [x] **Step 5: Commit**

```bash
git add src/server/static.js src/server/router.test.js
git commit -m "Send Cache-Control on static responses"
```

---

### Task 5: Escape everything the client writes into innerHTML

**Files:**
- Create: `web/js/html.js`
- Create: `web/js/html.test.js`
- Modify: `web/js/app-card.js` (the `appCard` template)
- Modify: `web/js/apps-feed.js` (the featured strip)
- Test: `web/js/app-card.test.js`

**Interfaces:**
- Produces: `escapeHtml(value) -> string` in `web/js/html.js`. Safe in both text and double-quoted attribute positions. `null`/`undefined` become `""`.

- [x] **Step 1: Write the failing tests**

Create `web/js/html.test.js`:

```js
import { test, expect } from "bun:test";
import { escapeHtml } from "./html.js";

test("escapeHtml neutralises the five HTML metacharacters", () => {
  expect(escapeHtml(`<a href="x">Tom & Jerry's</a>`)).toBe(
    "&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;"
  );
});

test("escapeHtml turns null and undefined into an empty string and numbers into text", () => {
  expect(escapeHtml(null)).toBe("");
  expect(escapeHtml(undefined)).toBe("");
  expect(escapeHtml(42)).toBe("42");
});
```

Append to `web/js/app-card.test.js`:

```js
test("a card escapes markup that arrives in its fields", () => {
  const html = appCard({
    websiteUrl: '/x" onmouseover="alert(1)',
    appStoreUrl: "https://apps.apple.com/x",
    icon: "🍸",
    name: '<img src=x onerror=alert(1)>: "Sub"',
    badge: "<b>Live</b>",
    badgeStyle: "live",
    tagline: "Tom & Jerry <3",
  });
  expect(html).not.toContain("<img src=x");
  expect(html).not.toContain('onmouseover="alert');
  expect(html).not.toContain("<b>Live</b>");
  expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  expect(html).toContain("Tom &amp; Jerry &lt;3");
  expect(html).toContain('href="/x&quot; onmouseover=&quot;alert(1)"');
});
```

- [x] **Step 2: Run to verify they fail**

Run: `bun test web/js`
Expected: `html.test.js` fails with "Cannot find module './html.js'"; the new app-card test fails on `not.toContain("<img src=x")`.

- [x] **Step 3: Create `web/js/html.js`**

```js
// The one escaping function every client-side template goes through.
// Both feeds are third-party or hand-edited text; a stray "<" in an App
// Store description must render as a "<", not become markup.
const REPLACEMENTS = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"']/g, (ch) => REPLACEMENTS[ch]);
}
```

- [x] **Step 4: Escape inside `appCard`**

In `web/js/app-card.js`, add at the top:

```js
import { escapeHtml as esc } from "./html.js";
```

Replace the body of `appCard` (from `const { title, subtitle }` to the closing backtick) with:

```js
  const { title, subtitle } = splitName(name);
  const safeIcon = esc(icon);
  return `
    <article class="card">
      <div class="card-head">
        ${
          isImageIcon(icon)
            ? `<img class="icon-img" src="${safeIcon}" alt="" width="48" height="48" />`
            : `<span class="icon">${safeIcon || "📱"}</span>`
        }
        <div class="card-title">
          <h3>${esc(title)}</h3>
          ${subtitle ? `<p class="card-subtitle">${esc(subtitle)}</p>` : ""}
        </div>
      </div>
      <span class="badge ${esc(badgeStyle)}">${esc(badge)}</span>
      <p>${esc(tagline)}</p>
      <div class="card-actions">
        ${websiteUrl ? `<a class="button secondary" href="${esc(websiteUrl)}">Website</a>` : ""}
        ${
          appStoreUrl
            ? `<a class="button" href="${esc(appStoreUrl)}" target="_blank" rel="noopener">App Store</a>`
            : `<button type="button" class="button" disabled>App Store</button>`
        }
      </div>
    </article>
  `;
```

- [x] **Step 5: Escape the featured strip in `apps-feed.js`**

Change the import line to:

```js
import { appCard, badgeClass } from "./app-card.js";
import { escapeHtml as esc } from "./html.js";
```

Replace the `strip.innerHTML = ...` template with:

```js
  strip.innerHTML = `
    ${
      upcoming.icon
        ? `<img class="featured-icon" src="${esc(upcoming.icon)}" alt="" width="64" height="64" />`
        : ""
    }
    <div class="featured-body">
      <span class="featured-eyebrow">Preorder</span>
      <h3>${esc(upcoming.name)}</h3>
      <p>${esc(upcoming.tagline)} Releases ${esc(fmtDate(upcoming.releaseDate))}.</p>
    </div>
    <a class="button secondary" href="${esc(upcoming.localUrl || upcoming.url)}">Preorder ›</a>
  `;
```

- [x] **Step 6: Run the tests**

Run: `bun test`
Expected: `15 pass, 0 fail`

- [x] **Step 7: Check the home page still renders both grids**

`PORT=4321 bun server.js &`, open http://127.0.0.1:4321/home, scroll to "What's on the App Store": three Live cards and one In development card with icons, subtitles and buttons, exactly as before. `kill %1`.

- [x] **Step 8: Commit**

```bash
git add web/js/html.js web/js/html.test.js web/js/app-card.js web/js/app-card.test.js web/js/apps-feed.js
git commit -m "Escape feed and apps.json text before writing it into the page"
```

---

### Task 6: Move the app template's inline script into a tested module

**Files:**
- Create: `web/js/app-detail.js`
- Create: `web/js/app-detail.test.js`
- Create: `web/js/app-page.js`
- Modify: `web/app.html` (delete the inline `<script>`, link the module)

**Interfaces:**
- Consumes: `escapeHtml` from `web/js/html.js`; `badgeClass`, `isImageIcon` from `web/js/app-card.js`.
- Produces: `renderAppDetail(app) -> string` and `renderNotFound(slug) -> string` in `web/js/app-detail.js`.

- [x] **Step 1: Write the failing tests**

Create `web/js/app-detail.test.js`:

```js
import { test, expect } from "bun:test";
import { renderAppDetail, renderNotFound } from "./app-detail.js";

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

test("renderAppDetail lays out icon, badge, copy, platforms and a disabled store button", () => {
  const html = renderAppDetail(relay);
  expect(html).toContain('<img class="icon-lg icon-img" src="/assets/app-icons/thumb/relay-icon.png"');
  expect(html).toContain('<span class="badge dev">In development</span>');
  expect(html).toContain("<h1>relay</h1>");
  expect(html).toContain('<p class="lede">An analog signal-sorting mystery.</p>');
  expect(html).toContain('<span class="chip">iPhone</span><span class="chip">iPad</span><span class="chip">Mac</span>');
  expect(html).toContain("Not yet published");
  expect(html).not.toContain("View on the App Store");
});

test("renderAppDetail links to the App Store when a URL is present and uses an emoji plate otherwise", () => {
  const html = renderAppDetail({ ...relay, icon: "✨", appStoreUrl: "https://apps.apple.com/x" });
  expect(html).toContain('<span class="icon-lg">✨</span>');
  expect(html).toContain('<a class="button" href="https://apps.apple.com/x">View on the App Store</a>');
});

test("renderAppDetail escapes its inputs", () => {
  const html = renderAppDetail({ ...relay, name: "<b>x</b>", platforms: ["<i>"] });
  expect(html).toContain("<h1>&lt;b&gt;x&lt;/b&gt;</h1>");
  expect(html).toContain('<span class="chip">&lt;i&gt;</span>');
});

test("renderNotFound names the slug and escapes it", () => {
  const html = renderNotFound("<nope>");
  expect(html).toContain("Nothing here yet");
  expect(html).toContain("<code>/&lt;nope&gt;</code>");
});
```

- [x] **Step 2: Run to verify they fail**

Run: `bun test web/js/app-detail.test.js`
Expected: FAIL — cannot find module.

- [x] **Step 3: Create `web/js/app-detail.js`**

```js
// Pure renderers for the generic in-development app page (web/app.html).
// No DOM access here so they can be tested with bun test.
import { badgeClass, isImageIcon } from "./app-card.js";
import { escapeHtml as esc } from "./html.js";

export function renderNotFound(slug) {
  return `
    <section class="hero" style="margin-top:0">
      <h1>Nothing here yet</h1>
      <p class="lede">There's no app at <code>/${esc(slug)}</code>. Add an entry with this
      slug to <code>data/apps.json</code> to give it a page.</p>
      <a class="button secondary" href="/home#apps">← Back to App Store</a>
    </section>
  `;
}

export function renderAppDetail(app) {
  const icon = esc(app.icon);
  const platforms = (app.platforms || []).map((p) => `<span class="chip">${esc(p)}</span>`).join("");
  return `
    <section class="hero app-detail" style="margin-top:0">
      <div class="app-detail-head">
        ${
          isImageIcon(app.icon)
            ? `<img class="icon-lg icon-img" src="${icon}" alt="" width="88" height="88" />`
            : `<span class="icon-lg">${icon || "📱"}</span>`
        }
        <div class="app-detail-meta">
          <span class="badge ${badgeClass(app.status)}">${esc(app.status)}</span>
          <h1>${esc(app.name)}</h1>
          <p class="lede">${esc(app.tagline)}</p>
        </div>
      </div>
      <div class="app-detail-body">
        <p class="app-detail-description">${esc(app.description)}</p>
        <div class="app-detail-side">
          <div>
            <h4>Platforms</h4>
            <div class="platforms">${platforms}</div>
          </div>
          <div>
            ${
              app.appStoreUrl
                ? `<a class="button" href="${esc(app.appStoreUrl)}">View on the App Store</a>`
                : `<button type="button" class="button secondary" disabled>Not yet published</button>`
            }
          </div>
          <div>
            <a class="back-link" href="/home#apps">‹ Go back</a>
          </div>
        </div>
      </div>
    </section>
  `;
}
```

- [x] **Step 4: Create `web/js/app-page.js`**

```js
// Mounts the generic app page: reads the slug from the URL, fetches
// /apps.json, and hands the matching entry to the renderers.
import { renderAppDetail, renderNotFound } from "./app-detail.js";

const slug = window.location.pathname.replace(/^\/+|\/+$/g, "");
const content = document.getElementById("content");

fetch("/apps.json")
  .then((r) => r.json())
  .then((apps) => {
    const app = apps.find((a) => a.slug === slug);
    if (!app) {
      content.innerHTML = renderNotFound(slug);
      document.title = "Not found — cilippofilia.dev";
      return;
    }
    document.title = `${app.name} — cilippofilia.dev`;
    content.innerHTML = renderAppDetail(app);
  })
  .catch(() => {
    content.innerHTML = '<p class="empty-state">Couldn\'t load apps.json.</p>';
  });
```

- [x] **Step 5: Replace the inline script in `web/app.html`**

Delete everything from `<script>` (the line after `<script src="/js/nav.js"></script>`) through its closing `</script>`, and put in its place:

```html
  <script type="module" src="/js/app-page.js"></script>
```

The body should now be exactly:

```html
<body>
  <main>
    <div class="wrap" id="content">
      <p class="empty-state">Loading…</p>
    </div>
  </main>
  <script src="/js/nav.js"></script>
  <script type="module" src="/js/app-page.js"></script>
</body>
```

- [x] **Step 6: Run the tests**

Run: `bun test`
Expected: `19 pass, 0 fail`

- [x] **Step 7: Verify in the browser**

`PORT=4321 bun server.js &`, open http://127.0.0.1:4321/the-relay: icon, purple "In development" badge, headline, description, three platform chips, dashed "Not yet published" button, back link. Title reads "relay — cilippofilia.dev". `kill %1`.

- [x] **Step 8: Commit**

```bash
git add web/js/app-detail.js web/js/app-detail.test.js web/js/app-page.js web/app.html
git commit -m "Render the app template from a tested module instead of an inline script"
```

---

### Task 7: Bundle anime.js v4 locally and drop the CDN tag

**Files:**
- Create: `src/client/floating-icons.js`
- Delete: `web/js/floating-icons.js`
- Modify: `web/index.html` (head `<script>` and the module tag at the bottom)
- Modify: `package.json` (add `scripts`)
- Modify: `.gitignore`

**Interfaces:**
- Produces: `bun run build` writes `web/js/floating-icons.bundle.js`; `bun run start` builds then serves; `bun run test` runs `bun test`.

- [x] **Step 1: Add scripts to `package.json`**

Add a `scripts` block so the file reads:

```json
{
  "name": "cilippofilia-site",
  "private": true,
  "scripts": {
    "build": "bun build src/client/floating-icons.js --outfile web/js/floating-icons.bundle.js --minify --target browser",
    "start": "bun run build && bun server.js",
    "dev": "bun run build && bun --watch server.js",
    "test": "bun test"
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

- [x] **Step 2: Ignore the build output**

Append to `.gitignore`:

```
# Built by `bun run build`
web/js/floating-icons.bundle.js
```

- [x] **Step 3: Write the v4 source at `src/client/floating-icons.js`**

```js
// Continuous idle drift for the floating app icons on the home page.
// Each icon wanders to a fresh random point (with a small rotation)
// every time it finishes a leg, so it keeps roaming around the hero
// background rather than oscillating between two spots.
//
// Bundled by `bun run build` into web/js/floating-icons.bundle.js so the
// page has no CDN dependency — the site is local-only and must work offline.
import { animate, utils } from "animejs";

document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  // How far an icon may wander from its resting point. Scaled to the
  // window so the drift stays a gentle nudge on a phone instead of
  // carrying an icon off the edge of a 390px screen.
  const amp = Math.max(16, Math.min(52, Math.round(window.innerWidth * 0.05)));
  const ampY = Math.round(amp * 0.85);

  document.querySelectorAll(".floating-icon").forEach((el, i) => {
    const wander = () => {
      animate(el, {
        translateX: utils.random(-amp, amp),
        translateY: utils.random(-ampY, ampY),
        rotate: utils.random(-14, 14),
        duration: utils.random(7000, 12000),
        ease: "inOutSine",
        onComplete: wander,
      });
    };
    setTimeout(wander, i * 300);
  });
});
```

- [x] **Step 4: Build it**

Run: `bun run build`
Expected: prints a bundle line for `web/js/floating-icons.bundle.js`; `ls -la web/js/floating-icons.bundle.js` shows a file roughly 20–40 KB.

- [x] **Step 5: Point `web/index.html` at the bundle and remove the CDN tag**

Delete this line from `<head>`:

```html
  <script src="https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.min.js" defer></script>
```

At the bottom, change

```html
  <script type="module" src="/js/floating-icons.js"></script>
```

to

```html
  <script type="module" src="/js/floating-icons.bundle.js"></script>
```

- [x] **Step 6: Delete the old file and check no reference survives**

```bash
git rm web/js/floating-icons.js
grep -rn "floating-icons.js\|jsdelivr\|anime.min" web src README.md
```
Expected: the grep prints only README lines (fixed in Task 12), nothing under `web/` or `src/`.

- [ ] **Step 7: Verify in the browser**

`bun run start &` (it builds first). Open http://127.0.0.1:4321/home: the five icons behind the intro drift slowly and rotate slightly. Open the browser console: no errors, no request to jsdelivr in the Network tab. `kill %1`.

- [ ] **Step 8: Run the tests and commit**

Run: `bun test` — expected `19 pass`.

```bash
git add package.json .gitignore src/client/floating-icons.js web/index.html
git commit -m "Bundle anime.js v4 locally for the floating icons instead of loading v3 from a CDN"
```

---

### Task 8: Distinct titles, social metadata, canonical links, and links back to the hub

**Files:**
- Modify: `web/index.html`, `web/app.html` (head)
- Modify: `web/drinko/index.html`, `web/iterly/index.html`, `web/itswritten/index.html`, `web/nine-tiles-puzzle/index.html` (head + footer)
- Modify: `web/drinko/privacy-policy.html`, `web/iterly/privacy-policy.html`, `web/itswritten/privacy-policy.html`, `web/nine-tiles-puzzle/privacy-policy.html` (head + links)
- Test: `src/server/router.test.js`

- [ ] **Step 1: Add the failing test**

Append to `src/server/router.test.js`:

```js
test("every page has its own title, a canonical link and Open Graph tags", async () => {
  const pages = ["/home", "/drinko/", "/iterly/", "/itswritten/", "/nine-tiles-puzzle/"];
  const titles = new Set();
  for (const p of pages) {
    const res = await request("GET", p);
    const title = res.body.match(/<title>([^<]+)<\/title>/)[1];
    titles.add(title);
    expect(res.body).toContain('<link rel="canonical" href="https://cilippofilia.dev');
    expect(res.body).toContain('<meta property="og:title"');
    expect(res.body).toContain('<meta property="og:description"');
    expect(res.body).toContain('<meta property="og:image" content="https://cilippofilia.dev/');
  }
  expect(titles.size).toBe(pages.length);
});

test("landing pages link back to the hub", async () => {
  for (const p of ["/drinko/", "/iterly/", "/itswritten/", "/nine-tiles-puzzle/"]) {
    const res = await request("GET", p);
    expect(res.body).toContain('href="/home"');
  }
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `bun test src/server/router.test.js`
Expected: FAIL on the canonical assertion for `/home`.

- [ ] **Step 3: Home page head**

In `web/index.html`, replace `<title>cilippofilia.dev</title>` with `<title>Filippo Cilia — SwiftUI apps for iPhone, iPad and Mac</title>` and add directly after the existing `<meta name="description" ...>` line:

```html
  <link rel="canonical" href="https://cilippofilia.dev/home" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="cilippofilia.dev" />
  <meta property="og:title" content="Filippo Cilia — SwiftUI apps for iPhone, iPad and Mac" />
  <meta property="og:description" content="Drinko, itsWritten, Iterly, 9 Tiles Puzzle and what's next, all written in Swift and SwiftUI." />
  <meta property="og:url" content="https://cilippofilia.dev/home" />
  <meta property="og:image" content="https://cilippofilia.dev/assets/profile.jpg" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:site" content="@fcilia_dev" />
```

- [ ] **Step 4: App template head**

In `web/app.html`, replace `<title>cilippofilia.dev</title>` with `<title>In development — cilippofilia.dev</title>` and add after the description meta:

```html
  <meta name="robots" content="noindex" />
```

(These pages are placeholders for unreleased work and are addressed by slug; they get no OG tags.)

- [ ] **Step 5: Landing page heads**

For each of the four landing `index.html` files, replace the `<title>` and add the block after the `<meta name="description" ...>` line, using this table. `SLUG` is the folder name, `TITLE` and `DESC` per row, `IMAGE` is `https://cilippofilia.dev/SLUG/assets/icon.png`.

| SLUG | TITLE | DESC |
|---|---|---|
| drinko | Drinko — Cocktail recipes, lessons and a cabinet for iPhone, iPad and Mac | Better cocktails at home: 100+ classic recipes, bartending lessons, and a cabinet that knows what you already have. |
| iterly | Iterly — A project tracker for indie developers | Projects, tasks and subtasks grouped by release, an activity heatmap with streaks, and Home Screen widgets. Local-first, no account. |
| itswritten | itsWritten — A private, on-device AI journal | itsWritten is a private journal for iPhone: write first, then reflect with Apple Intelligence on your device. No account, no cloud chat, saved threads you can revisit. |
| nine-tiles-puzzle | 9 Tiles Puzzle — A sliding-image puzzle with seven ways to play | Fetch a photo, slice it into a grid, scramble the pieces, and put it back together across seven game modes. |

Block to add, with the placeholders filled in:

```html
  <link rel="canonical" href="https://cilippofilia.dev/SLUG/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="cilippofilia.dev">
  <meta property="og:title" content="TITLE">
  <meta property="og:description" content="DESC">
  <meta property="og:url" content="https://cilippofilia.dev/SLUG/">
  <meta property="og:image" content="IMAGE">
  <meta name="twitter:card" content="summary">
```

- [ ] **Step 6: Privacy page heads**

In each `privacy-policy.html`, add after the description meta:

```html
  <link rel="canonical" href="https://cilippofilia.dev/SLUG/privacy-policy.html">
  <meta name="robots" content="noindex">
```

- [ ] **Step 7: Link back to the hub and fix the `index.html` hrefs**

In every landing `index.html` footer, change the `.links` block to add a first link:

```html
      <div class="links">
        <a href="/home">More apps</a>
        <a href="privacy-policy.html">Privacy Policy</a>
        <a href="https://github.com/cilippofilia/REPO">GitHub</a>
        <a href="mailto:cilia.filippo@icloud.com">Contact</a>
      </div>
```

(`REPO` is whatever that page already links.) In every `privacy-policy.html`, replace both `href="index.html"` occurrences (the back link and the footer "Home") with `href="./"`, and add `<a href="/home">More apps</a>` as the first footer link.

- [ ] **Step 8: Run the tests**

Run: `bun test`
Expected: `21 pass, 0 fail`

- [ ] **Step 9: Verify in the browser**

`bun run start &`. Open each landing page: the footer shows "More apps · Privacy Policy · GitHub · Contact" and "More apps" goes to `/home`. On a privacy page, "← Back home" lands on `/drinko/` (no `index.html` in the address bar). `kill %1`.

- [ ] **Step 10: Commit**

```bash
git add web/index.html web/app.html web/drinko web/iterly web/itswritten web/nine-tiles-puzzle src/server/router.test.js
git commit -m "Give every page a distinct title, canonical link and Open Graph tags, and link the landing pages back to the hub"
```

---

### Task 9: Remove unreferenced 1024px icons and downscale the landing icons

**Files:**
- Delete: `web/assets/app-icons/9tiles-icon.png`, `drinko-icon.png`, `iterly-icon.png`, `itsWritten-icon.png`, `relay-icon.png` (the five files directly in that folder; `thumb/` stays)
- Modify (binary): `web/drinko/assets/icon.png`, `web/iterly/assets/icon.png`, `web/itswritten/assets/icon.png`, `web/nine-tiles-puzzle/assets/icon.png`

- [ ] **Step 1: Prove the big icons are unreferenced**

Run:
```bash
grep -rn "app-icons/" web --include='*.html' --include='*.js' --include='*.css' | grep -v "app-icons/thumb/"
```
Expected: no output. If anything prints, stop and report it instead of deleting.

- [ ] **Step 2: Delete them**

```bash
git rm web/assets/app-icons/9tiles-icon.png web/assets/app-icons/drinko-icon.png web/assets/app-icons/iterly-icon.png web/assets/app-icons/itsWritten-icon.png web/assets/app-icons/relay-icon.png
du -sh web/assets/app-icons
```
Expected: about 320 KB.

- [ ] **Step 3: Downscale the landing icons**

The largest display size is `.icon-orb` at 132 px, so 320 px covers 2× displays with margin.

```bash
for app in drinko iterly itswritten nine-tiles-puzzle; do
  sips -Z 320 "web/$app/assets/icon.png" >/dev/null
  sips -g pixelWidth "web/$app/assets/icon.png" | tail -1
done
ls -la web/*/assets/icon.png
```
Expected: each reports `pixelWidth: 320` and each file is under 120 KB.

- [ ] **Step 4: Verify in the browser**

`bun run start &`. Open http://127.0.0.1:4321/drinko/ and http://127.0.0.1:4321/nine-tiles-puzzle/: the hero icon orb and the small nav icon look crisp. Home page floating icons and cards unchanged. `kill %1`.

- [ ] **Step 5: Commit**

```bash
git add -A web/assets/app-icons web/drinko/assets web/iterly/assets web/itswritten/assets web/nine-tiles-puzzle/assets
git commit -m "Drop the unreferenced 1024px app icons and downscale the landing page icons to 320px"
```

---

### Task 10: One shared reveal script for the landing pages

**Files:**
- Create: `web/js/reveal.js`
- Delete: `web/drinko/app.js`, `web/iterly/app.js`, `web/itswritten/app.js`
- Modify: `web/nine-tiles-puzzle/app.js` (remove the first 20 lines), the four landing `index.html` files (script tags)
- Test: `src/server/router.test.js`

- [ ] **Step 1: Confirm the three are identical and the fourth starts with the same block**

```bash
diff web/drinko/app.js web/iterly/app.js && diff web/drinko/app.js web/itswritten/app.js && echo IDENTICAL
diff <(head -20 web/nine-tiles-puzzle/app.js) web/drinko/app.js && echo PREFIX-MATCHES
```
Expected: both words print.

- [ ] **Step 2: Add the failing test**

Append to `src/server/router.test.js`:

```js
test("landing pages share /js/reveal.js and no longer ship their own copies", async () => {
  const shared = await request("GET", "/js/reveal.js");
  expect(shared.status).toBe(200);
  expect(shared.body).toContain("IntersectionObserver");
  for (const p of ["/drinko/", "/iterly/", "/itswritten/", "/nine-tiles-puzzle/"]) {
    const res = await request("GET", p);
    expect(res.body).toContain('<script src="/js/reveal.js"></script>');
  }
  for (const p of ["/drinko/app.js", "/iterly/app.js", "/itswritten/app.js"]) {
    const res = await request("GET", p);
    expect(res.status).toBe(404);
  }
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `bun test src/server/router.test.js`
Expected: FAIL — `/js/reveal.js` is 404.

- [ ] **Step 4: Create `web/js/reveal.js`**

A classic script (no `import`/`export`) so it drops into the landing pages as-is:

```js
// Reveals each <main> section as it scrolls into view, on every landing
// page. Reduced-motion visitors, and browsers without IntersectionObserver,
// see everything immediately.
(() => {
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
})();
```

- [ ] **Step 5: Delete the copies and trim the 9 Tiles script**

```bash
git rm web/drinko/app.js web/iterly/app.js web/itswritten/app.js
sed -i '' '1,21d' web/nine-tiles-puzzle/app.js
head -3 web/nine-tiles-puzzle/app.js
```
Expected: the file now begins with `// Countdown to release.` (line 21 of the original is the blank line after the reveal block; if the first line printed is not that comment, adjust the deletion so the file starts at that comment and add back `const reduceMotion = ...` only if the countdown code references `reduceMotion` — as of today it does not).

- [ ] **Step 6: Update the script tags**

In `web/drinko/index.html`, `web/iterly/index.html`, `web/itswritten/index.html` replace

```html
  <script src="app.js"></script>
```
with
```html
  <script src="/js/reveal.js"></script>
```

In `web/nine-tiles-puzzle/index.html` replace the same line with

```html
  <script src="/js/reveal.js"></script>
  <script src="app.js"></script>
```

- [ ] **Step 7: Run the tests**

Run: `bun test`
Expected: `22 pass, 0 fail`

- [ ] **Step 8: Verify in the browser**

`bun run start &`. On each landing page the feature sections fade/rise in as you scroll (compare to before: identical). On 9 Tiles the countdown still ticks every second. `kill %1`.

- [ ] **Step 9: Commit**

```bash
git add web/js/reveal.js web/nine-tiles-puzzle/app.js web/drinko/index.html web/iterly/index.html web/itswritten/index.html web/nine-tiles-puzzle/index.html src/server/router.test.js
git commit -m "Share one reveal script across the landing pages"
```

---

### Task 11: One shared landing stylesheet plus a theme file per app

The four `style.css` files are copies that differ only in tokens, the name of the decorative float class, two bloom colours, two button shadows, one link colour, and page-specific sections. This task extracts the shared part once and reduces each app to a token file.

**Files:**
- Create: `web/css/landing.css`
- Create: `web/drinko/theme.css`, `web/iterly/theme.css`, `web/itswritten/theme.css`, `web/nine-tiles-puzzle/theme.css`
- Create: `web/iterly/page.css`, `web/nine-tiles-puzzle/page.css`
- Delete: the four `style.css`
- Modify: all eight landing/privacy HTML files (stylesheet links, float class names and custom-property names)
- Test: `src/server/router.test.js`

**Interfaces:**
- Produces: `landing.css` expects each theme to define these custom properties on `:root` (light) and inside `@media (prefers-color-scheme: dark)`: `--bg`, `--bg2`, `--surface`, `--surface-hover`, `--text`, `--muted`, `--border`, `--accent`, `--accent-rgb`, `--link`, `--bloom-1`, `--bloom-2`, `--brand-gradient`, `--radius-lg`, `--radius-md`, `--float-mask-default`, plus any app-specific mask SVG variables the HTML references.
- Produces: the decorative float element is `<div class="float" style="... --float-rotate:..; --float-opacity:..; --float-duration:..; --float-delay:..; --float-mask:var(--...)">` on every landing page.

- [ ] **Step 1: Take reference screenshots**

`bun run start &`. In a browser at 1280 px wide and again at 390 px wide, screenshot the top of each of the four landing pages and one privacy page, in both light and dark system appearance (the landing pages honour `prefers-color-scheme`). Save them to `/tmp/landing-before/`. These are the acceptance reference for Step 10. `kill %1`.

- [ ] **Step 2: Add the failing test**

Append to `src/server/router.test.js`:

```js
test("landing pages load the shared stylesheet plus their own theme and no style.css", async () => {
  for (const p of ["/drinko/", "/iterly/", "/itswritten/", "/nine-tiles-puzzle/"]) {
    const res = await request("GET", p);
    expect(res.body).toContain('<link rel="stylesheet" href="/css/landing.css">');
    expect(res.body).toContain('<link rel="stylesheet" href="theme.css">');
    expect(res.body).not.toContain('href="style.css"');
    expect(res.body).not.toContain('class="glass"');
    expect(res.body).not.toContain('class="mark"');
    expect(res.body).not.toContain('class="piece"');
  }
  const shared = await request("GET", "/css/landing.css");
  expect(shared.status).toBe(200);
  expect(shared.body).toContain(".float {");
  expect(shared.body).not.toContain("--blue");
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `bun test src/server/router.test.js`
Expected: FAIL — landing.css is 404.

- [ ] **Step 4: Create `web/css/landing.css` from the Iterly stylesheet**

Iterly's `style.css` has its two token blocks first, then `* { box-sizing... }`. Find that line and copy from it to the end, then neutralise the app-specific names:

```bash
cut_line=$(grep -n '^\* {' web/iterly/style.css | head -1 | cut -d: -f1)
sed -n "${cut_line},\$p" web/iterly/style.css > web/css/landing.css
sed -i '' \
  -e 's/\.mark\b/.float/g' \
  -e 's/--mark-/--float-/g' \
  -e 's/markFloat/floatDrift/g' \
  -e 's/var(--check-svg)/var(--float-mask-default)/g' \
  -e 's/Floating ship marks/Floating decorative marks/' \
  web/css/landing.css
```

Then open `web/css/landing.css` and make these four hand edits (line numbers refer to the original iterly file, so subtract 38):

1. The first bloom (`background: radial-gradient(circle, var(--blue), transparent 70%);`) → `var(--bloom-1)`.
2. The second bloom (`var(--sky)`) → `var(--bloom-2)`.
3. The two primary-button shadows `rgba(30, 95, 196, 0.35)` and `rgba(30, 95, 196, 0.45)` → `rgba(var(--accent-rgb), 0.35)` and `rgba(var(--accent-rgb), 0.45)`.
4. The two `color: var(--accent);` rules that Drinko has as `color: var(--blue)` (original lines 338 and 436, the eyebrow and the footer link colour) → `color: var(--link);`.
5. Cut the trailing `/* ---------- Note ---------- */ .note {...}` block (original lines 483–495) out of `landing.css` and paste it into a new `web/iterly/page.css`.

Add a header comment at the top of `landing.css`:

```css
/* Shared by every app landing page under web/<app>/. Each page links this
   after its own theme.css, which supplies the colour tokens, the accent
   RGB triple, the two bloom colours and the default float mask. Anything
   page-specific (9 Tiles' countdown, Iterly's note) lives in that page's
   page.css, not here. */
```

Confirm no app colour name survives:
```bash
grep -n "\-\-blue\|\-\-sky\|\-\-yellow\|\-\-ink\|\-\-paper\|\-\-graphite\|check-svg\|tag-svg\|shaker-svg\|coupe-svg\|piece-svg\|w-svg\|cursor-svg" web/css/landing.css
```
Expected: no output.

- [ ] **Step 5: Write each `theme.css`**

For each app, `theme.css` = that app's `:root` block and dark-scheme block — everything before its own `* { box-sizing... }` line — plus the new tokens. The box-sizing line is at line 38 for drinko/iterly/itswritten and line 39 for nine-tiles-puzzle, so find it per file rather than hardcoding:

```bash
for app in drinko iterly itswritten nine-tiles-puzzle; do
  cut_line=$(grep -n '^\* {' "web/$app/style.css" | head -1 | cut -d: -f1)
  sed -n "1,$((cut_line - 1))p" "web/$app/style.css" > "web/$app/theme.css"
done
```

Then add, inside the `:root { ... }` block of each theme (before its closing brace), the five bridging tokens. Values come straight from what the original stylesheet used:

| app | `--accent-rgb` | `--link` | `--bloom-1` | `--bloom-2` | `--float-mask-default` |
|---|---|---|---|---|---|
| drinko | `52, 126, 247` (its `--blue`, `#347ef7`) | `var(--blue)` | `var(--blue)` | `var(--yellow)` | `var(--coupe-svg)` |
| iterly | `30, 95, 196` (its `--blue-deep`, `#1e5fc4`) | `var(--accent)` | `var(--blue)` | `var(--sky)` | `var(--check-svg)` |
| itswritten | `168, 130, 63` (its `--accent`, `#a8823f`) | `var(--accent)` | `var(--graphite)` | `var(--paper)` | `var(--w-svg)` |
| nine-tiles-puzzle | `255, 100, 60` (its primary-button shadow, original line 361) | `var(--orange)` | `var(--red)` | `var(--yellow)` | `var(--piece-svg)` |

Inside each theme's `@media (prefers-color-scheme: dark)` block, add a dark `--accent-rgb` too, using the RGB of the same variable's dark value (Drinko: `--blue` is `#4a8df8` → `74, 141, 248`; Iterly: `--blue-deep` is `#2b6fe0` → `43, 111, 224`; for itsWritten and 9 Tiles read the dark value of the variable named above and convert it). If a theme's dark block does not redefine that variable, skip this.

Also carry over the per-app float variable names. In each theme file run the same renames as Step 4 (`--glass-`→`--float-`, `--mark-`→`--float-`, `--piece-`→`--float-`) so the mask SVG tokens keep their app names but the float mechanics use the shared names.

- [ ] **Step 6: Move the page-specific blocks**

- `web/iterly/page.css` already holds `.note` from Step 4.
- Create `web/nine-tiles-puzzle/page.css` with the countdown block: original `style.css` lines 248–321 (from `.countdown {` — there is no section comment above it, just a blank line — through the last rule before `.badge-row[hidden]` at line 324). Confirm the exact span with `sed -n '246,325p' web/nine-tiles-puzzle/style.css` before cutting. Rename `--piece-` → `--float-` inside it if present.
- Diff the remainder of each original against `landing.css` and resolve every leftover hunk into `theme.css` (a token) or `page.css` (a rule):

```bash
for app in drinko itswritten nine-tiles-puzzle; do
  cut_line=$(grep -n '^\* {' "web/$app/style.css" | head -1 | cut -d: -f1)
  echo "== $app"
  diff <(sed -n "${cut_line},\$p" "web/$app/style.css" | sed -e 's/\.glass\b/.float/g;s/\.piece\b/.float/g;s/--glass-/--float-/g;s/--piece-/--float-/g;s/glassFloat/floatDrift/g;s/pieceFloat/floatDrift/g') web/css/landing.css
done
```
Expected after resolving: each diff shows only the hunks already accounted for (bloom vars, shadow rgba, `--link`, mask default, and 9 Tiles' countdown / Iterly's note). Anything else is a real rule difference: move it into that app's `page.css`.

- [ ] **Step 7: Update the HTML**

In all eight files under the four app folders:

```bash
for app in drinko iterly itswritten nine-tiles-puzzle; do
  for f in "web/$app/index.html" "web/$app/privacy-policy.html"; do
    sed -i '' \
      -e 's|<link rel="stylesheet" href="style.css">|<link rel="stylesheet" href="theme.css">\n  <link rel="stylesheet" href="/css/landing.css">|' \
      -e 's/class="glass"/class="float"/g; s/class="mark"/class="float"/g; s/class="piece"/class="float"/g' \
      -e 's/--glass-/--float-/g; s/--mark-/--float-/g; s/--piece-/--float-/g' \
      "$f"
  done
done
```

Then add `<link rel="stylesheet" href="page.css">` after the landing.css link in `web/iterly/index.html` and `web/nine-tiles-puzzle/index.html` only.

Check nothing was missed:
```bash
grep -rn 'style.css\|class="glass"\|class="mark"\|class="piece"\|--glass-\|--mark-\|--piece-' web/drinko web/iterly web/itswritten web/nine-tiles-puzzle
```
Expected: no output.

- [ ] **Step 8: Delete the old stylesheets**

```bash
git rm web/drinko/style.css web/iterly/style.css web/itswritten/style.css web/nine-tiles-puzzle/style.css
```

- [ ] **Step 9: Run the tests**

Run: `bun test`
Expected: `23 pass, 0 fail`

- [ ] **Step 10: Visual acceptance against the Step 1 screenshots**

`bun run start &`. Re-take the same screenshots (both widths, both appearances) and compare side by side with `/tmp/landing-before/`. They must match: background blooms, floating marks (shape, opacity, drift), hero orb, button colours and shadows, eyebrow colour, footer link colour, 9 Tiles countdown, Iterly note box. Fix any difference in the relevant `theme.css`/`page.css` before continuing. `kill %1`.

- [ ] **Step 11: Commit**

```bash
git add web/css/landing.css web/drinko web/iterly web/itswritten web/nine-tiles-puzzle src/server/router.test.js
git commit -m "Share one landing stylesheet across the app pages, keeping only a theme file per app"
```

---

### Task 12: Docs, comments and repo housekeeping

**Files:**
- Modify: `README.md`, `src/server/router.js`, `src/server/appstore.js`, `web/css/intro.css` (comments), `.prettierrc` (new), `package.json` (format script)
- Delete: `public/`

- [ ] **Step 1: Fix the `public/` references in code comments**

```bash
sed -i '' 's|public/|web/|g' src/server/appstore.js web/css/intro.css src/server/router.js
grep -rn "public/" server.js src web/css web/js
```
Expected: no output.

- [ ] **Step 2: Remove the orphan folder**

```bash
diff public/favicon.svg web/assets/favicon.svg && git rm -r public
```
Expected: `diff` prints nothing (identical) and the folder is removed.

- [ ] **Step 3: Rewrite the README's stale sections**

Replace the second paragraph (beginning "Visually it follows the tokens in `/style-guide`") with:

```markdown
Visually it is dark-only and follows Apple's Liquid Glass language
(iOS/macOS 26): the header, buttons and floating cards use a translucent,
blurred `backdrop-filter` fill with a hairline border and an inset top
highlight, over two soft colour blooms fixed behind the page. Glass never
stacks — a button that sits *on* a glass card gets a flat tint instead of
its own blur — and there is a solid fallback for
`prefers-reduced-transparency` and browsers without `backdrop-filter`.
Every token lives in `web/css/tokens.css`; `/style-guide` renders them.
```

Replace the "Run it" section with:

```markdown
## Run it

```
bun run start
```

That builds the one bundled script (`web/js/floating-icons.bundle.js`,
from `src/client/floating-icons.js`, which imports `animejs`) and starts
the server. Then open **http://localhost:4321/home**.

- `bun run dev` — same, but restarts the server when a file under `src/`
  or `server.js` changes.
- `bun test` — routing, rendering and escaping tests.
- `bun run format` — Prettier over the JavaScript.
- Change the port with `PORT=3000 bun run start` if 4321 is taken.
```

Replace every remaining `public/` in README.md with `web/` (`sed -i '' 's|public/|web/|g' README.md`), change `node server.js` to `bun run start` wherever it appears, and rewrite the "Project layout" tree to:

```
server.js            — listens on 127.0.0.1 and hands requests to the router
src/server/
  router.js          — the routing table + request handler (tested)
  static.js          — path resolution, MIME types, cache headers, file serving
  appstore.js        — live App Store lookup for the developer id, cached
  dev-apps.js        — reads data/apps.json for the in-development slugs
src/client/
  floating-icons.js  — source for the bundled icon-drift script
data/apps.json       — in-development apps: one entry per landing page
web/
  index.html         — landing page: intro, profile card, app grids
  app.html           — generic per-app template for in-development apps
  404.html           — not-found page
  style-guide.html   — design tokens and components reference
  css/
    tokens.css       — colours, radii, glass material (start here)
    base.css         — document ground, ambient background, focus rings
    layout.css       — header, nav, main, footer, hero copy
    components.css   — buttons, cards, grids, badges, app detail
    intro.css        — the home page's opening screen (home page only)
    landing.css      — shared stylesheet for the four app landing pages
  js/
    nav.js           — shared header/footer, injected on every page
    html.js          — escapeHtml
    app-card.js      — the card shape both app grids render into
    apps-feed.js     — fills those grids from Apple's feed and apps.json
    app-detail.js    — renderers for app.html (app-page.js mounts them)
    intro-flip.js    — the scroll-linked intro animation
    reveal.js        — scroll-in reveal shared by the landing pages
  assets/            — images, app icons, favicons
  drinko/ iterly/ itswritten/ nine-tiles-puzzle/
                     — one landing page each: index.html, privacy-policy.html,
                       theme.css (tokens), optional page.css, assets/
```

Under "Custom app pages", after the sentence that ends "No route to add in `server.js`.", add:

```markdown
Each of these pages links `/css/landing.css` (shared layout and components)
after its own `theme.css` (colour tokens, accent RGB, bloom colours, default
float mask). Copy an existing `theme.css` to start a new one.
```

- [ ] **Step 4: Prettier config and format script**

Create `.prettierrc`:

```json
{
  "printWidth": 100
}
```

Add to the `scripts` block of `package.json`:

```json
    "format": "prettier --write server.js \"src/**/*.js\" \"web/js/**/*.js\" \"!web/js/*.bundle.js\""
```

Run `bun run format` and then `git diff --stat`. If it reformats more than a handful of lines in any file, revert those files with `git checkout -- <file>`, widen `printWidth` to 110 and retry. The goal is a config that leaves the existing code essentially untouched; the existing files were already written at roughly 100 columns.

- [ ] **Step 5: Run the tests and verify docs**

Run: `bun test` — `23 pass`.
Run: `grep -rn "public/\|node server.js\|jsdelivr" README.md server.js src web/css web/js` — expected: no output.

- [ ] **Step 6: Commit**

```bash
git add README.md .prettierrc package.json src/server/router.js src/server/appstore.js web/css/intro.css
git add -A public
git commit -m "Bring the README and code comments in line with the web/ layout and Bun scripts"
```

---

### Task 13: Rebuild the style guide on the real tokens

The guide at `/style-guide` is a light page with its own `--sg-*` palette while the site is dark. This task makes it consume the shared stylesheets so it documents the real thing.

**Files:**
- Modify: `web/style-guide.html`
- Test: `src/server/router.test.js`

- [ ] **Step 1: Add the failing test**

Append to `src/server/router.test.js`:

```js
test("the style guide uses the site's own stylesheets and tokens", async () => {
  const res = await request("GET", "/style-guide");
  expect(res.status).toBe(200);
  expect(res.body).toContain('<link rel="stylesheet" href="/css/tokens.css"');
  expect(res.body).toContain('<link rel="stylesheet" href="/css/components.css"');
  expect(res.body).not.toContain("--sg-");
  expect(res.body).toContain('<meta name="theme-color" content="#000000"');
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `bun test src/server/router.test.js`
Expected: FAIL on `--sg-`.

- [ ] **Step 3: Swap the head**

In `web/style-guide.html`, replace `<meta name="theme-color" content="#ffffff" />` with `#000000`, and insert before the `<style>` tag:

```html
<link rel="stylesheet" href="/css/tokens.css" />
<link rel="stylesheet" href="/css/base.css" />
<link rel="stylesheet" href="/css/layout.css" />
<link rel="stylesheet" href="/css/components.css" />
```

Delete the whole `:root { --sg-bg: ... color-scheme: light; }` block from the inline `<style>`, and delete the inline `* { box-sizing }`, `html, body { margin ... }` and the `body { background/color/font-family }` rules that duplicate `base.css`.

- [ ] **Step 4: Map the remaining `--sg-*` uses onto the real tokens**

```bash
sed -i '' \
  -e 's/var(--sg-bg-alt)/var(--bg-alt)/g' \
  -e 's/var(--sg-bg)/var(--bg)/g' \
  -e 's/var(--sg-text-dim)/var(--text-dim)/g' \
  -e 's/var(--sg-text)/var(--text)/g' \
  -e 's/var(--sg-blue-hover)/var(--accent-hover)/g' \
  -e 's/var(--sg-blue)/var(--accent)/g' \
  -e 's/var(--sg-border)/var(--border)/g' \
  -e 's/var(--sg-max)/var(--max-width)/g' \
  web/style-guide.html
grep -n "sg-" web/style-guide.html
```
Expected: no output. If any `--sg-` name remains that is not in the list, map it to the closest token in `web/css/tokens.css` and re-run the grep.

- [ ] **Step 5: Correct the copy and swatch labels**

Open the file and update every place the text quotes a value: replace `#ffffff` with `#000000`, `#f5f5f7` (as a background) with `#1c1c1e`, `#1d1d1f` with `#f5f5f7`, `#6e6e73` with `#98989d`, `#0071e3` with `#2997ff`, `#0077ed` with `#55a9ff`, `#d2d2d7` with `rgba(255,255,255,0.14)`. Change the intro sentence that says the tokens are "measured off apple.com/uk" to:

```
Tokens are the ones the site actually uses, from /css/tokens.css: a dark ground, Apple's system font stack, 980px pill buttons, a 1024px column, and the Liquid Glass surface material (translucent fill, hairline border, inset highlight).
```

Wherever the guide shows a button or a card example using its own class names, switch them to the real classes (`button`, `button secondary`, `card`, `badge live` / `badge dev` / `badge concept`, `chip`) so the examples render with the production CSS. Add a "Glass material" section that shows one `.card` and one `.button secondary` on the dark ground with a short caption stating the never-stack rule.

- [ ] **Step 6: Inject the shared chrome**

Add before `</body>`:

```html
<script src="/js/nav.js"></script>
```

- [ ] **Step 7: Run the tests and verify**

Run: `bun test` — `24 pass`.
`bun run start &`, open http://127.0.0.1:4321/style-guide: dark page, site header and footer, every swatch and component rendered with the same look as `/home`. `kill %1`.

- [ ] **Step 8: Commit**

```bash
git add web/style-guide.html src/server/router.test.js
git commit -m "Rebuild the style guide on the site's real dark tokens and components"
```

---

## Final verification (run after Task 13)

```bash
bun test                                                     # 24 pass, 0 fail
bun run start &
sleep 2
curl -s -o /dev/null -w "%{http_code}\n" 'http://127.0.0.1:4321/%'        # 400
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:4321/no-such-app # 404
curl -sI http://127.0.0.1:4321/css/base.css | grep -i "cache-control\|content-length"
grep -rn "public/\|jsdelivr" README.md server.js src web/css web/js || echo "no stale refs"
du -sh web/assets/app-icons                                  # < 700K
ls web/drinko/app.js web/iterly/app.js web/itswritten/app.js 2>&1 | grep -c "No such"   # 3
kill %1
git log --oneline main..design-polish
```

Then hand the branch over with `superpowers:finishing-a-development-branch`.
