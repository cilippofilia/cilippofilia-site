// Builds the site once and checks the prerendered output: every public page
// exists, carries its head tags, runs no script but SvelteKit's hashed
// bootstrap, nothing that loads on every page drags global CSS along, and
// netlify.toml sends the same security headers as the dev hook. Slow (a
// full vite build), so it runs once per bun test.

import { test, expect, beforeAll } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { $ } from "bun";
import { SECURITY_HEADERS } from "./lib/server/security-headers.js";
import { sitemapPaths } from "./lib/site-pages.js";
import { validDevApps } from "./lib/apps/dev-apps.js";
import { LANDING_APPS } from "./lib/apps/landing-apps.js";

// Where adapter-netlify writes prerendered pages.
const PUBLISH_DIR = path.join(process.cwd(), "build");
const CLIENT_MANIFEST = path.join(process.cwd(), ".svelte-kit", "output", "client", ".vite", "manifest.json");

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
    // The style guide's type specimen shows a sample <h1> next to the page's
    // own, as it always has.
    expect(html.match(/<h1[\s>]/g)?.length).toBe(url.endsWith("/style-guide") ? 2 : 1);
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
  for (const app of LANDING_APPS) {
    expect(fs.existsSync(path.join(PUBLISH_DIR, app, "privacy-policy.html"))).toBe(true);
  }
});

// The root layout (node 0) and root error page (node 1) load on every page,
// landing pages included. Any CSS they import, directly or through a shared
// chunk, would be injected everywhere; the site stylesheets once leaked onto
// the landing pages that way.
test("nothing that loads on every page imports CSS", () => {
  const manifest = JSON.parse(fs.readFileSync(CLIENT_MANIFEST, "utf8"));
  const cssOf = (key, seen = new Set()) => {
    if (seen.has(key) || !manifest[key]) return [];
    seen.add(key);
    const entry = manifest[key];
    return [...(entry.css || []), ...(entry.imports || []).flatMap((k) => cssOf(k, seen))];
  };
  const rootNodes = Object.keys(manifest).filter((k) => /client-optimized\/nodes\/[01]\.js$/.test(k));
  expect(rootNodes.length).toBe(2);
  for (const key of rootNodes) expect(cssOf(key)).toEqual([]);
});

test("landing pages link only the landing stylesheets", () => {
  for (const app of LANDING_APPS) {
    const sheets = [...read(`${app}/index.html`).matchAll(/<link href="([^"]+\.css)" rel="stylesheet">/g)].map(
      (m) => path.basename(m[1]).split(".")[0]
    );
    expect(sheets.sort()).toEqual([app, "landing"].sort());
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
