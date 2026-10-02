---
paths:
  - "web/js/**"
  - "src/client/**"
  - "web/*/app.js"
---

# Client JavaScript rules

## Modules and loading

- `web/js/*.js` is plain browser JS with no build step. Page scripts are ES modules loaded with
  `<script type="module" src="/js/...">` and import siblings with relative `./x.js` specifiers (include the `.js`).
- `nav.js` and `landing-reveal.js` are classic (non-module) scripts. Keep them that way, since every page includes
  them.
- `src/client/floating-icons.js` is the one bundled file (it imports `animejs`). After editing it, run
  `bun run build`. Never edit or commit `web/js/floating-icons.bundle.js`.
- Don't add CDN script tags or npm imports in `web/js/`. If something needs a library, ask first; the answer is
  probably a bundle like floating-icons.

## Separate logic from DOM

- Put pure logic (state, maths, rendering to an HTML string) in its own module with no DOM access, and test it
  (`maze-move.js`, `maze-wilson.js`, `notfound-game-logic.js`, `app-card.js`, `app-detail.js`, `app-status.js`).
  The DOM-wiring file (`maze-game.js`, `notfound-game.js`, `app-page.js`) imports it.
- New non-trivial logic needs a colocated `*.test.js`. See `testing.md`.

## HTML injection

- Any interpolated value in an `innerHTML` template goes through `escapeHtml` from `./html.js`
  (`import { escapeHtml as esc } from "./html.js"`). That includes App Store data, `apps.json` fields, URLs in
  `href`/`src`, and class names. Numbers you computed yourself are the only exception.
- Prefer `textContent` when writing plain text into a single element.

## Behaviour

- Respect `prefers-reduced-motion`: check `matchMedia("(prefers-reduced-motion: reduce)")` and skip or shorten
  animation (see `reveal.js`, `intro-flip.js`).
- Prefer `IntersectionObserver` over scroll listeners for scroll-triggered state.
- Network calls fail quietly. A failed fetch contributes nothing or shows a short empty-state line, never an alert
  or a thrown error. The score APIs don't exist on Netlify, so games must keep working when they fail.
- Hide headings over empty sections (`el.hidden = true`) rather than rendering a heading over nothing.
- Dates: `toLocaleDateString("en-GB", …)`.
- Feature flags like `DEV_SLUGS_TO_SHOW` filter data; don't delete entries from `apps.json` to hide them.
