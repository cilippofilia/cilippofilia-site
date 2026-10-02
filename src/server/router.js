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
const { hasDevApp } = require("./dev-apps");
const { getBest, submitScore } = require("./notfound-scores");
const { getTop: getMazeTop, submitEntry: submitMazeEntry } = require("./maze-scores");

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

// Directories under web/ served verbatim. Anything not listed here is
// routed explicitly below, so a new top-level folder has to be opted in
// rather than being exposed the moment it is created.
const STATIC_DIRS = ["/css/", "/js/", "/assets/"];

// Pages that map straight to a file in web/.
const PAGES = {
  "/home": "index.html",
  "/style-guide": "style-guide.html",
  "/privacy": "privacy.html",
  "/terms": "terms.html",
  "/robots.txt": "robots.txt",
  "/sitemap.xml": "sitemap.xml",
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

  if (pathname === "/api/notfound-score") {
    if (req.method === "POST") {
      let score = 0;
      try {
        score = JSON.parse(await readBody(req)).score;
      } catch {
        // malformed body — treat as no score, still return the real best
      }
      send(res, 200, JSON.stringify({ best: submitScore(score) }), "application/json; charset=utf-8");
    } else {
      send(res, 200, JSON.stringify({ best: getBest() }), "application/json; charset=utf-8");
    }
    return;
  }

  if (pathname === "/api/maze-score") {
    if (req.method === "POST") {
      let timeMs = 0;
      let moves = 0;
      try {
        const parsed = JSON.parse(await readBody(req));
        timeMs = parsed.timeMs;
        moves = parsed.moves;
      } catch {
        // malformed body — treat as no entry, still return the real leaderboard
      }
      send(res, 200, JSON.stringify({ top: submitMazeEntry(timeMs, moves) }), "application/json; charset=utf-8");
    } else {
      send(res, 200, JSON.stringify({ top: getMazeTop() }), "application/json; charset=utf-8");
    }
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

  // A single clean slug that has an entry in data/apps.json gets the
  // generic app template, which renders that entry in the browser.
  if (/^\/[a-zA-Z0-9-]+$/.test(pathname) && hasDevApp(pathname.slice(1))) {
    serveFile(res, path.join(PUBLIC_DIR, "app.html"));
    return;
  }

  serveFile(res, path.join(PUBLIC_DIR, "404.html"), 404);
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
