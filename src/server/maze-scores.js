// Persists the maze minigame's leaderboard: every winning run's time and
// move count, ranked fastest-first (fewer moves breaking a time tie).
// Single shared table, no per-visitor identity — same reasoning as
// notfound-scores.js's single shared best score.

const path = require("path");
const { Database } = require("bun:sqlite");
const { SCORES_DIR } = require("./static");

const db = new Database(path.join(SCORES_DIR, "maze-scores.db"));
db.exec(`
  CREATE TABLE IF NOT EXISTS maze_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    time_ms INTEGER NOT NULL,
    moves INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  )
`);

function getTop(limit = 5) {
  const rows = db
    .query("SELECT time_ms, moves FROM maze_scores ORDER BY time_ms ASC, moves ASC LIMIT ?")
    .all(limit);
  return rows.map((row) => ({ timeMs: row.time_ms, moves: row.moves }));
}

// Records a run if it looks like a real completed solve, then always
// returns the current top `limit` entries.
function submitEntry(timeMs, moves, limit = 5) {
  if (Number.isFinite(timeMs) && timeMs > 0 && Number.isInteger(moves) && moves > 0) {
    db.query("INSERT INTO maze_scores (time_ms, moves, created_at) VALUES (?, ?, ?)").run(
      Math.floor(timeMs),
      moves,
      Date.now()
    );
  }
  return getTop(limit);
}

module.exports = { getTop, submitEntry };
