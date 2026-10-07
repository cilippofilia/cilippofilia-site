---
paths:
  - "src/lib/**/*.js"
  - "src/lib/**/*.svelte"
  - "src/routes/**/*.svelte"
  - "src/routes/**/+page.js"
  - "src/routes/**/+layout.js"
---

# Client code rules (Svelte components and browser JS)

These cover everything under `src/lib/` and `src/routes/` except `src/lib/server/` (see `server.md`).

## Components

- Svelte 5 runes: `$props()`, `$state()`, `$derived()`, `$effect()`, `{@render children()}`, `onclick={...}`.
  No `export let`, `$:` or `on:click`.
- Pages are prerendered, so a component must render the same markup on the server as on first load. Anything that
  needs `window` or `document` runs in `onMount`, `$effect` or an action.
- `<body data-sveltekit-reload>` makes every link a full page load. Don't rely on client-side navigation, and don't
  remove it without dealing with the per-page global CSS and window listeners that it keeps from carrying over.
- Svelte escapes every `{value}`. Never use `{@html ...}` for App Store data or `apps.json` fields.

## Separate logic from the DOM

- Pure logic (state, maths, data shaping) lives in a plain `.js` module with no DOM access and a colocated test:
  `src/lib/games/maze-wilson.js`, `maze-move.js`, `notfound-game-logic.js`, `runner-logic.js`, `active-game.js`,
  `src/lib/apps/feed.js`, `app-status.js`, `names.js`, `meta.js`, `dev-apps.js`, `src/lib/pull-to-refresh.js`.
- The big imperative modules (`src/lib/intro/intro-flip.js`, `src/lib/games/maze-game.js`, `maze-explainer.js`,
  `runner-game.js`, `notfound-game.js`) export `init…(root, { signal })`. The owning component renders **static**
  markup for them (no reactive bindings on nodes they mutate), calls `init…` from `onMount` with an
  `AbortController`'s signal, and aborts it on destroy. Inside, every `addEventListener` takes `{ signal }`, every
  self-rescheduling timer or `requestAnimationFrame` callback starts with `if (signal.aborted) return;`, and anything
  appended outside the root is removed on `"abort"`. Never pass `{ signal }` to a listener on the signal itself: it
  would be removed before the abort event fires.
- The maze and the runner both listen for arrow keys on `window`. The runner calls `claimKeys("runner")`
  (`src/lib/games/active-game.js`) while a run is live and `releaseKeys` when it pauses or ends; the maze ignores
  keys while `keysClaimedByOther("maze")`. Claims last only as long as a run, so a game left mid-round still
  answers when the player comes back to it.
- Scroll reveals are actions: `use:reveal` (`src/lib/actions/reveal.js`) on `.reveal` elements on site pages,
  `use:landingReveal` on a landing page's `<main>`.

## Behaviour

- Respect `prefers-reduced-motion`: check `matchMedia("(prefers-reduced-motion: reduce)")` and skip or shorten
  animation (see `reveal.js`, `intro-flip.js`, `FloatingIcons.svelte`).
- Prefer `IntersectionObserver` over scroll listeners for scroll-triggered state.
- Site pages replace Safari's native pull-to-refresh with `PullToRefresh.svelte`, which sets
  `overscroll-behavior-y: none` on `<html>` while mounted. Safari's rubber-band at the top drags the page out from
  under the intro's fixed hero image, so don't bring it back on site pages. New touch-driven game areas go in its
  `GAME_AREAS` selector so a swipe there is never read as a pull.
- Network calls fail quietly: check `r.ok`, and on failure contribute nothing rather than showing an alert or
  throwing. The score APIs answer 503 on Netlify, so the games must keep working when they fail.
- Don't render a heading over an empty section; render the section only when there's something in it.
- Dates: `toLocaleDateString("en-GB", …)`.
- Feature flags like `DEV_SLUGS_TO_SHOW` filter data; don't delete entries from `apps.json` to hide them.
- `animejs` is imported dynamically inside `onMount` so it only loads in the browser. Don't add CDN scripts; ask
  before adding any other library.
