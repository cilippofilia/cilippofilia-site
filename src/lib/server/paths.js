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
