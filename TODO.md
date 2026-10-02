# TODO

Open items left over from the 2026-09-09 site review. The full review and plan
were removed from `docs/superpowers/`; they're in git history at `9a87e54` if
the original detail is ever needed (its line-level steps predate Netlify, the
minigames, the legal pages and the CSS token work, so re-check before following
them).

- [ ] **Page metadata.** Give every page a distinct `<title>`, `og:title`,
      `og:description`, `og:image` and `<link rel="canonical">`. Link the four
      landing pages (`web/drinko/`, `web/iterly/`, `web/itswritten/`,
      `web/nine-tiles-puzzle/`) back to `/home`. Their privacy pages link to
      `index.html` literally, which leaves `/drinko/index.html` in the address
      bar; link to `./` instead.
- [ ] **Image weight.** `web/assets/app-icons/*.png` (five 1024px files,
      ~9.9 MB) aren't referenced; only `thumb/` is used. Delete them. Downscale
      each landing page's `assets/icon.png` (rendered at 132px) to ~264px.
- [ ] **Shared landing reveal script.** `web/drinko/app.js`,
      `web/iterly/app.js` and `web/itswritten/app.js` are identical
      IntersectionObserver reveals, and the same code opens
      `web/nine-tiles-puzzle/app.js`. Pull them into one shared script.
- [ ] **Shared landing stylesheet.** The four landing `style.css` files are
      mostly copies; they differ in `:root` tokens, the float class name
      (`.glass` / `.mark` / `.piece`), bloom colours, button shadows, and 9 Tiles'
      countdown block. Split into a shared `web/css/landing.css` plus a small
      per-app theme file.
- [ ] **Housekeeping.** Delete `public/` (orphan `favicon.svg`, duplicate of
      `web/assets/favicon.svg`). Fix the `public/` comments in
      `src/server/appstore.js:12` and `web/css/intro.css:3`. Add a `.prettierrc`
      and a `format` script, or drop `prettier` from `devDependencies`. Decide
      whether to keep `svelte` / `bun-plugin-svelte`, which nothing uses.
- [ ] **Style guide.** `web/style-guide.html` is a light page with its own
      `--sg-*` tokens. Rebuild it on `web/css/tokens.css` so it matches the
      dark Liquid Glass site.
