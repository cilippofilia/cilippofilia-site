// Persists the 404 minigame's high score. This is a single shared number,
// not per-visitor — the site only runs locally today (every request comes
// from the same machine), so there's no meaningful identity to key on yet.
// Once this moves to Netlify, per-visitor scoring belongs in a Netlify
// Function backed by a hosted store, not here.

const path = require("path");
const { Database } = require("bun:sqlite");
const { DATA_DIR } = require("./static");

const db = new Database(path.join(DATA_DIR, "notfound-scores.db"));
db.exec(`
  CREATE TABLE IF NOT EXISTS notfound_score (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    best INTEGER NOT NULL DEFAULT 0
  )
`);
db.exec(`INSERT OR IGNORE INTO notfound_score (id, best) VALUES (1, 0)`);

function getBest() {
  const row = db.query("SELECT best FROM notfound_score WHERE id = 1").get();
  return row ? row.best : 0;
}

// Raises the stored best if `score` beats it. Always returns the score now
// on record, whether or not this call was the one that set it.
function submitScore(score) {
  const clean = Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0;
  const current = getBest();
  if (clean <= current) return current;
  db.query("UPDATE notfound_score SET best = ? WHERE id = 1").run(clean);
  return clean;
}

module.exports = { getBest, submitScore };
