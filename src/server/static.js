// Reading files off disk and writing them back out with the right headers.
//
// Paths resolve from the project root, worked out from this file's own
// location rather than from process.cwd() — so `node server.js` behaves the
// same whichever directory it is started from.

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const PUBLIC_DIR = path.join(ROOT, "web");
const DATA_DIR = path.join(ROOT, "data");

// Where the score databases (maze-scores.js, notfound-scores.js) live —
// separate from DATA_DIR so bun test's auto-loaded .env.test can point
// just this at a scratch folder, keeping test runs from writing into the
// real score files a running server reads from, without disturbing static
// data reads (e.g. apps.json) that still come from DATA_DIR.
const SCORES_DIR = process.env.SCORES_DIR_OVERRIDE
  ? path.resolve(ROOT, process.env.SCORES_DIR_OVERRIDE)
  : DATA_DIR;
fs.mkdirSync(SCORES_DIR, { recursive: true });

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

// HTML and the two JSON feeds change whenever their files do, so the
// browser must always revalidate; everything else (CSS, JS, images) is
// cached only briefly — this is a local dev server under active change, so
// a long cache just means stale JS/CSS surviving past the edit that fixed
// them.
const CACHE_CONTROL = {
  ".html": "no-cache",
  ".json": "no-cache",
};
const DEFAULT_CACHE_CONTROL = "public, max-age=5";

// Sent on every response, and kept identical to the [[headers]] block in
// netlify.toml so a CSP mistake shows up locally before it ships (a router
// test fails if the two drift apart).
//
// - Scripts only ever come from this origin: no inline <script>, no eval.
//   That also makes a javascript: URL that slipped into an href inert.
// - Styles allow 'unsafe-inline' because many pages and templates carry
//   style="..." attributes; inline CSS can't run code, so the cost is small.
// - Images: this origin, data: URIs (the SVG masks in the landing pages'
//   style.css) and Apple's artwork CDN, which serves App Store icons from
//   numbered hosts (is1-ssl, is2-ssl, ...).
// - frame-ancestors / X-Frame-Options stop the site being framed for
//   clickjacking, and form-action 'none' because there are no forms at all.
const SECURITY_HEADERS = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://*.mzstatic.com",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join("; "),
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Cross-Origin-Opener-Policy": "same-origin",
};

function send(res, status, body, contentType, extraHeaders = {}) {
  const payload = Buffer.isBuffer(body) ? body : Buffer.from(String(body));
  res.writeHead(status, {
    ...SECURITY_HEADERS,
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

function redirect(res, location, status = 302) {
  res.writeHead(status, { ...SECURITY_HEADERS, Location: location });
  res.end();
}

function serveFile(res, filePath, status = 200) {
  const ext = path.extname(filePath).toLowerCase();
  fs.readFile(filePath, (err, data) => {
    if (err) {
      send(res, 404, "404 Not Found");
      return;
    }
    send(res, status, data, MIME[ext] || "application/octet-stream", {
      "Cache-Control": CACHE_CONTROL[ext] || DEFAULT_CACHE_CONTROL,
    });
  });
}

// Serve `relativePath` from inside `baseDir`, refusing anything that escapes
// it. Resolving first and then checking where the result landed is what
// actually contains a traversal attempt — stripping "../" from the URL only
// catches the obvious shapes.
function serveWithin(res, baseDir, relativePath) {
  const filePath = path.resolve(baseDir, "." + relativePath);
  if (filePath !== baseDir && !filePath.startsWith(baseDir + path.sep)) {
    send(res, 403, "Forbidden");
    return;
  }
  serveFile(res, filePath);
}

module.exports = { ROOT, PUBLIC_DIR, DATA_DIR, SCORES_DIR, SECURITY_HEADERS, send, redirect, serveFile, serveWithin };
