// Local-only static server for cilippofilia.co.uk.
//
// - Binds to 127.0.0.1 only — nothing outside this machine can reach it.
// - /home maps to public/index.html. The old /app-store page is gone — its
//   content now lives in a section of /home, and the path redirects there so
//   existing links still land somewhere sensible.
// - A path like /nine-tiles-puzzle that matches a folder in public/ with its
//   own index.html (a full custom landing page, own CSS/JS/assets) is served
//   straight from that folder.
// - Any other single-segment path falls back to public/app.html, a generic
//   template that looks itself up in data/apps.json by the URL slug — add a
//   new app just by editing apps.json, no new HTML file required.
//
// The file-reading and App Store plumbing live in src/server/; this file is
// only the routing table.
//
// Run with: node server.js
// Then open: http://localhost:4321/home

const http = require("http");
const fs = require("fs");
const path = require("path");

const { getPublishedApps } = require("./src/server/appstore");
const {
  PUBLIC_DIR,
  DATA_DIR,
  send,
  redirect,
  serveFile,
  serveWithin,
} = require("./src/server/static");

const PORT = process.env.PORT ? Number(process.env.PORT) : 4321;
const HOST = "127.0.0.1"; // local only, on purpose

// Directories under public/ served verbatim. Anything not listed here is
// routed explicitly below, so a new top-level folder has to be opted in
// rather than being exposed the moment it is created.
const STATIC_DIRS = ["/css/", "/js/", "/assets/"];

// Pages that map straight to a file in public/.
const PAGES = {
  "/home": "index.html",
  "/style-guide": "style-guide.html",
};

// Paths that have moved. Kept so old links and bookmarks still land.
const REDIRECTS = {
  "/": ["/home", 302],
  "/app-store": ["/home#apps", 301],
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);

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

  // A custom multi-file app site: public/<slug>/index.html plus its own
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

  // Anything else that looks like a single clean slug (e.g. /running-plan)
  // falls back to the generic app template, which resolves itself against
  // data/apps.json in the browser.
  if (/^\/[a-zA-Z0-9-]+$/.test(pathname)) {
    serveFile(res, path.join(PUBLIC_DIR, "app.html"));
    return;
  }

  send(res, 404, "404 Not Found");
});

server.listen(PORT, HOST, () => {
  console.log(`cilippofilia.co.uk running locally at http://${HOST}:${PORT}/home`);
  console.log("(bound to 127.0.0.1 — not reachable from any other device)");
});
