// Local-only static server for cilippofilia.co.uk.
//
// - Binds to 127.0.0.1 only — nothing outside this machine can reach it.
// - /home maps to public/index.html. The old /app-store page is
//   gone — its content now lives in a section of /home, and the path
//   redirects there so existing links still land somewhere sensible.
// - A path like /nine-tiles-puzzle that matches a folder in public/ with its
//   own index.html (a full custom landing page, own CSS/JS/assets) is served
//   straight from that folder.
// - Any other single-segment path falls back to public/app.html, a generic
//   template that looks itself up in data/apps.json by the URL slug — add a
//   new app just by editing apps.json, no new HTML file required.
//
// Run with: node server.js
// Then open: http://localhost:4321/home

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT ? Number(process.env.PORT) : 4321;
const HOST = "127.0.0.1"; // local only, on purpose
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = path.join(ROOT, "data");

// Filippo Carlo Cilia's App Store developer id — pulled live so shipped apps
// show up on /home automatically as new ones go out.
// https://apps.apple.com/us/developer/filippo-carlo-cilia/id1690376038
const APPLE_DEVELOPER_ID = "1690376038";
const APPSTORE_CACHE_MS = 10 * 60 * 1000; // 10 minutes
let appStoreCache = { fetchedAt: 0, apps: [] };

// Published apps that also have their own custom landing page under
// public/<slug>/ instead of just linking straight out to Apple.
const CUSTOM_APP_PAGES = {
  6776386637: "nine-tiles-puzzle", // 9 Tiles Puzzle
};

function fetchPublishedApps() {
  return new Promise((resolve, reject) => {
    const url = `https://itunes.apple.com/lookup?id=${APPLE_DEVELOPER_ID}&entity=software&limit=200`;
    https
      .get(url, { timeout: 8000 }, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(body);
            const apps = (parsed.results || [])
              .filter((r) => r.wrapperType === "software")
              .map((r) => ({
                id: r.trackId,
                name: r.trackName,
                tagline: (r.description || "").split(/\n/)[0].slice(0, 160),
                icon: (r.artworkUrl100 || "").replace("100x100bb", "512x512bb"),
                url: r.trackViewUrl,
                genre: r.primaryGenreName || "",
                releaseDate: r.releaseDate || null,
                localUrl: CUSTOM_APP_PAGES[r.trackId] ? `/${CUSTOM_APP_PAGES[r.trackId]}` : null,
              }));
            resolve(apps);
          } catch (err) {
            reject(err);
          }
        });
      })
      .on("timeout", function () {
        this.destroy(new Error("iTunes lookup timed out"));
      })
      .on("error", reject);
  });
}

async function getPublishedApps() {
  const isFresh = Date.now() - appStoreCache.fetchedAt < APPSTORE_CACHE_MS;
  if (isFresh && appStoreCache.apps.length) return appStoreCache.apps;

  try {
    const apps = await fetchPublishedApps();
    appStoreCache = { fetchedAt: Date.now(), apps };
    return apps;
  } catch (err) {
    console.error("Couldn't refresh App Store apps:", err.message);
    return appStoreCache.apps; // serve stale cache (possibly empty) rather than fail
  }
}

// Directories under public/ served verbatim. Anything not listed here is
// routed explicitly below, so a new top-level folder has to be opted in.
const STATIC_DIRS = ["/css/", "/js/", "/assets/"];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function send(res, status, body, contentType) {
  res.writeHead(status, { "Content-Type": contentType || "text/plain; charset=utf-8" });
  res.end(body);
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  fs.readFile(filePath, (err, data) => {
    if (err) {
      send(res, 404, "404 Not Found");
      return;
    }
    send(res, 200, data, MIME[ext] || "application/octet-stream");
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let pathname = decodeURIComponent(url.pathname);

  if (pathname === "/") {
    res.writeHead(302, { Location: "/home" });
    res.end();
    return;
  }

  // Live data: apps actually published on the App Store, fetched from
  // Apple and cached for a few minutes.
  if (pathname === "/api/appstore-apps") {
    const apps = await getPublishedApps();
    send(res, 200, JSON.stringify(apps), "application/json; charset=utf-8");
    return;
  }

  // Static: /apps.json, plus everything under public/css, /js and /assets
  if (pathname === "/apps.json") {
    serveFile(res, path.join(DATA_DIR, "apps.json"));
    return;
  }

  if (STATIC_DIRS.some((dir) => pathname.startsWith(dir))) {
    // Resolve first, then confirm the result is still inside public/. That
    // is what actually contains a traversal attempt — normalizing the URL
    // and stripping leading "../" only catches the obvious shapes.
    const filePath = path.resolve(PUBLIC_DIR, "." + pathname);
    if (!filePath.startsWith(PUBLIC_DIR + path.sep)) {
      send(res, 403, "Forbidden");
      return;
    }
    serveFile(res, filePath);
    return;
  }

  if (pathname === "/favicon.ico") {
    serveFile(res, path.join(PUBLIC_DIR, "assets", "favicon.svg"));
    return;
  }

  // Named pages
  if (pathname === "/home") {
    serveFile(res, path.join(PUBLIC_DIR, "index.html"));
    return;
  }

  // The App Store listing is a section of /home now. This has to stay an
  // explicit route rather than just being deleted: /app-store still matches
  // the single-segment rule below, so without it the request would fall
  // through to the generic per-app template and look for an app by that slug.
  if (pathname === "/app-store") {
    res.writeHead(301, { Location: "/home#apps" });
    res.end();
    return;
  }

  if (pathname === "/style-guide") {
    serveFile(res, path.join(PUBLIC_DIR, "style-guide.html"));
    return;
  }

  // A custom multi-file app site: public/<slug>/index.html plus its own
  // CSS/JS/assets alongside it, served as-is.
  const firstSlash = pathname.indexOf("/", 1);
  const firstSegment = firstSlash === -1 ? pathname.slice(1) : pathname.slice(1, firstSlash);
  const customDir = firstSegment ? path.join(PUBLIC_DIR, firstSegment) : null;
  const hasCustomPage = customDir && fs.existsSync(path.join(customDir, "index.html"));

  if (hasCustomPage) {
    if (firstSlash === -1) {
      // Bare "/slug" — redirect to "/slug/" so the page's relative links
      // (style.css, assets/icon.png, ...) resolve against the right folder.
      res.writeHead(302, { Location: `/${firstSegment}/` });
      res.end();
      return;
    }
    const rest = pathname.slice(firstSlash + 1);
    const relPath = rest === "" ? "index.html" : rest;
    const filePath = path.normalize(path.join(customDir, relPath));
    if (!filePath.startsWith(customDir)) {
      send(res, 403, "Forbidden");
      return;
    }
    serveFile(res, filePath);
    return;
  }

  // Anything else that looks like a single clean slug (e.g. /running-plan)
  // falls back to the generic app template, which resolves itself against
  // data/apps.json in the browser.
  const isSingleSegment = /^\/[a-zA-Z0-9-]+$/.test(pathname);
  if (isSingleSegment) {
    serveFile(res, path.join(PUBLIC_DIR, "app.html"));
    return;
  }

  send(res, 404, "404 Not Found");
});

server.listen(PORT, HOST, () => {
  console.log(`cilippofilia.co.uk running locally at http://${HOST}:${PORT}/home`);
  console.log("(bound to 127.0.0.1 — not reachable from any other device)");
});
