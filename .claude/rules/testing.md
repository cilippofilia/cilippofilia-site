---
paths:
  - "**/*.test.js"
  - "src/test-setup.js"
  - "bunfig.toml"
  - ".env.test"
---

# Testing rules

- Use `bun:test` only (`import { test, expect } from "bun:test"`). No Jest or Vitest.
- Tests sit next to the code they cover as `name.test.js` (`src/server/router.test.js`, `web/js/app-card.test.js`).
- Test names are plain-English statements of the behaviour: `"is blocked by a wall"`,
  `"a malformed percent-escape answers 400 and the server keeps serving"`. Use flat `test()` calls; there are no
  `describe` blocks in this repo.
- Prefer small hand-built fixtures (a function like `twoCellMaze()`) over large shared fixtures.
- Test pure modules directly. Client tests import ES modules from `web/js/` and must not touch `document` or
  `window`. If the code needs the DOM, split the logic out first (see `client-js.md`).
- Router tests start the real `handleRequest` on port `0` and send raw `node:http` requests (not `fetch`, which
  re-encodes `%` and follows redirects). Reuse the `request()` helper in `router.test.js`.
- Never write to the real `data/*.db`. `.env.test` points `SCORES_DIR_OVERRIDE` at `data/.test/`, and
  `src/test-setup.js` wipes it before each run. Don't assume rows survive between runs.
- Don't make real network calls to Apple in tests.
- When fixing a bug, add a test that fails without the fix.
- Run `bun test` and check it passes before saying you're done.
