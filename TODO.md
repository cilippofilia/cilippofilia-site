# TODO

Open items left over from the 2026-09-09 site review. The full review and plan
were removed from `docs/superpowers/`; they're in git history at `9a87e54` if
the original detail is ever needed (its line-level steps predate Netlify, the
minigames, the legal pages and the CSS token work, so re-check before following
them).

- [ ] **Housekeeping.** Delete `public/` (orphan `favicon.svg`, duplicate of
      `web/assets/favicon.svg`). Fix the `public/` comments in
      `src/server/appstore.js:12` and `web/css/intro.css:3`. Add a `.prettierrc`
      and a `format` script, or drop `prettier` from `devDependencies`. Decide
      whether to keep `svelte` / `bun-plugin-svelte`, which nothing uses.
