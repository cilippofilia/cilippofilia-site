---
paths:
  - "**/*.test.js"
  - "src/test-setup.js"
  - "bunfig.toml"
  - ".env.test"
---

# Testing rules

- Use `bun:test` only (`import { test, expect } from "bun:test"`). No Jest or Vitest.
- Tests sit next to the code they cover as `name.test.js` (`src/lib/apps/feed.test.js`,
  `src/hooks.server.test.js`).
- Test names are plain-English statements of the behaviour: `"is blocked by a wall"`,
  `"a body over the cap is dropped, not parsed"`. Use flat `test()` calls; there are no `describe` blocks in this repo.
- Prefer small hand-built fixtures (a function like `twoCellMaze()`) over large shared fixtures.
- Test pure modules directly; they must not touch `document` or `window`. If code needs the DOM, split the logic out
  first (see `client-js.md`). Components aren't unit-tested; their logic lives in tested `.js` modules.
- Endpoint behaviour is tested through its `src/lib/server/` function with plain `Request` objects and a fake store
  (`score-api.test.js`), not by starting a server. The hook is tested by calling `handle` with a fake event and
  `resolve` (`hooks.server.test.js`).
- `src/build-output.test.js` runs one full `vite build` and checks the prerendered output: every public page and dev
  app exists, head tags, one `<h1>`, the CSP meta on every page, no inline scripts, no CSS on the root nodes, landing
  pages' stylesheets, sitemap, robots, and `netlify.toml` header parity. When you add a page, it's checked
  automatically if it's in the sitemap lists.
- Never write to the real `data/*.db`. `.env.test` points `SCORES_DIR_OVERRIDE` at `data/.test/`, and
  `src/test-setup.js` wipes it before each run. Don't assume rows survive between runs.
- Don't make real network calls to Apple in tests; inject `fetchImpl` into `createAppStore`.
- When fixing a bug, add a test that fails without the fix.
- Run `bun test` and check it passes before saying you're done.
