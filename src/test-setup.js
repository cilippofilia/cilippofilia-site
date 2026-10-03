// Preloaded by bun test (see bunfig.toml). Wipes the scratch score folder
// from .env.test before any test file opens its DB, so every run starts
// from empty tables instead of piling up rows from earlier runs — which
// eventually pushed the maze tests' rows out of getTop's window.

import path from "node:path";
import fs from "node:fs";

const dir = process.env.SCORES_DIR_OVERRIDE;
if (dir) {
  fs.rmSync(path.resolve(import.meta.dir, "..", dir), { recursive: true, force: true });
}
