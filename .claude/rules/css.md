---
paths:
  - "src/lib/styles/**"
  - "src/**/*.svelte"
---

# CSS and design rules

## Tokens first

- Colours, radii, spacing, easing and glass come from custom properties in `src/lib/styles/tokens.css`. Don't
  hardcode a hex, pixel spacing or radius that a token already covers. If a value is genuinely new and reused, add a
  token with a comment explaining what it's for.
- Spacing is on the 4px grid (`--space-4` … `--space-96`), plus the semantic ones (`--gutter`, `--grid-gap`,
  `--space-section`, `--pad-surface`, `--gap-columns`). `--space-14` is the only off-grid step, for the gap between
  stacked items inside a card.
- Radii: `--radius-lg` for floating glass surfaces, `--radius` for a surface nested one level in, `--radius-pill`
  for anything fully rounded, `--radius-icon` for app-icon squircles.
- Motion uses `--ease-spring`.
- The site is **dark only** (`color-scheme: dark`). Don't add light-mode styles or a theme toggle.

## Liquid Glass

- Glass (`--glass-fill`, `--glass-blur`, `--glass-border`, `--glass-highlight`, `--glass-shadow`) is reserved for
  functional chrome: header, floating cards, buttons.
- **Glass never stacks.** A control sitting on a glass card gets `--flat-tint` / `--flat-tint-hover`, not its own
  `backdrop-filter`.
- Every new glass surface must also work under the existing fallbacks: `@supports not (backdrop-filter: …)` and
  `@media (prefers-reduced-transparency: reduce)` (see `components.css`).

## Where styles live

- The `(site)` layout imports `tokens.css` → `base.css` → `layout.css` → `components.css`, in that order. Put a rule
  in the lowest layer it belongs to.
- Page stylesheets (`intro.css`, `maze-game.css`, `notfound-game.css`, `legal.css`, `style-guide.css`) stay **global**
  CSS files imported by the page that owns them. The games and the intro create elements in JS, which Svelte's scoping
  classes never reach, and scoping would also change specificity.
- Scoped `<style>` blocks are for new rules that belong to one component and only style markup that component renders.
- The root `+error.svelte` loads on every page as SvelteKit's fallback, so it must not `import` CSS: it links its
  stylesheets with `?url` imports inside `<svelte:head>`. A component it renders that needs its own styles uses
  `<svelte:options css="injected" />` (see `PullToRefresh.svelte`), so the styles arrive only where it mounts. A test
  fails if anything the root layout or error page loads carries CSS.
- Any animation or transition gets a `@media (prefers-reduced-motion: reduce)` override.
- Hover effects go inside `@media (hover: hover)` so touch devices don't get stuck hover states.
- After changing a shared component, check that `/style-guide` (`src/routes/(site)/style-guide/+page.svelte`,
  `style-guide.css`) still reflects it, and update it if not.

## App landing pages

- Each landing page imports `landing.css` then its own `src/lib/styles/apps/<app>.css`, which holds only that app's
  theme tokens and page-specific rules. Shared landing layout and components go in `landing.css`.
- Landing pages never load the site's `tokens.css` / `components.css`. Keep the two systems separate.
