// Persists the skate runner's leaderboard: every run's score and which
// skater set it, ranked highest first, with the earlier run winning a tie.
// Single shared table, no per-visitor identity, same as maze-scores.js.

import path from "node:path";
import { ensureScoresDir } from "./paths.js";
import { CHARACTERS } from "../games/runner-sprites.js";

// Loaded through a non-literal specifier so neither Vite's SSR build nor
// Netlify's function bundler tries to follow it: this module is only ever
// imported on Bun (see score-stores.js).
const BUN_SQLITE = "bun:sqlite";
const { Database } = await import(/* @vite-ignore */ BUN_SQLITE);

// Far beyond any real run (over an hour at top speed, about 22 points a
// second), so anything over it is a forged request rather than a score.
export const MAX_SCORE = 100000;
const DEFAULT_SKATER = "ollie";

const db = new Database(path.join(ensureScoresDir(), "runner-scores.db"));
db.exec(`
  CREATE TABLE IF NOT EXISTS runner_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    score INTEGER NOT NULL,
    skater TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )
`);

export function getTop(limit = 5) {
  const rows = db
    .query("SELECT score, skater FROM runner_scores ORDER BY score DESC, created_at ASC, id ASC LIMIT ?")
    .all(limit);
  return rows.map((row) => ({ score: row.score, skater: row.skater }));
}

// Records a run if the score is plausible, then always returns the current
// top `limit` entries. Only known skater keys are stored, so the table never
// holds free text from a request.
export function submitEntry(score, skater, limit = 5) {
  if (Number.isInteger(score) && score > 0 && score <= MAX_SCORE) {
    const key = Object.hasOwn(CHARACTERS, skater) ? skater : DEFAULT_SKATER;
    db.query("INSERT INTO runner_scores (score, skater, created_at) VALUES (?, ?, ?)").run(score, key, Date.now());
  }
  return getTop(limit);
}
