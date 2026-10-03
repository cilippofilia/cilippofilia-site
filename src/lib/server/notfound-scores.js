// Persists the 404 minigame's high score. This is a single shared number,
// not per-visitor.
// Saved only where the site runs on Bun (locally); on Netlify the score
// endpoints answer 503 and the game plays on without one.

import path from "node:path";
import { ensureScoresDir } from "./paths.js";

// Loaded through a non-literal specifier so neither Vite's SSR build nor
// Netlify's function bundler tries to follow it: this module is only ever
// imported on Bun (see score-stores.js).
const BUN_SQLITE = "bun:sqlite";
const { Database } = await import(/* @vite-ignore */ BUN_SQLITE);

const db = new Database(path.join(ensureScoresDir(), "notfound-scores.db"));
db.exec(`
  CREATE TABLE IF NOT EXISTS notfound_score (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    best INTEGER NOT NULL DEFAULT 0
  )
`);
db.exec(`INSERT OR IGNORE INTO notfound_score (id, best) VALUES (1, 0)`);

export function getBest() {
  const row = db.query("SELECT best FROM notfound_score WHERE id = 1").get();
  return row ? row.best : 0;
}

// Raises the stored best if `score` beats it. Always returns the score now
// on record, whether or not this call was the one that set it.
export function submitScore(score) {
  const clean = Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0;
  const current = getBest();
  if (clean <= current) return current;
  db.query("UPDATE notfound_score SET best = ? WHERE id = 1").run(clean);
  return clean;
}
