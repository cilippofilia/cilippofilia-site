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
// APIs. SvelteKit's own CSRF check only covers form content types, not
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
