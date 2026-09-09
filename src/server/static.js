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

// HTML and the two JSON feeds change whenever their files do, so the
// browser must always revalidate; everything else (CSS, JS, images) is
// safe to hold for an hour on a local machine.
const CACHE_CONTROL = {
  ".html": "no-cache",
  ".json": "no-cache",
};
const DEFAULT_CACHE_CONTROL = "public, max-age=3600";

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

function redirect(res, location, status = 302) {
  res.writeHead(status, { Location: location });
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

module.exports = { ROOT, PUBLIC_DIR, DATA_DIR, send, redirect, serveFile, serveWithin };
