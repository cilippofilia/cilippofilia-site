---
paths:
  - "web/css/**"
  - "web/*/style.css"
---

# CSS and design rules

## Tokens first

- Colours, radii, spacing, easing and glass come from custom properties in `web/css/tokens.css`. Don't hardcode a
  hex, pixel spacing or radius that a token already covers. If a value is genuinely new and reused, add a token with
  a comment explaining what it's for.
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

## Structure

- Load order is `tokens.css` → `base.css` → `layout.css` → `components.css` → page-specific. Put a rule in the
  lowest layer it belongs to. Page-only styles go in a page stylesheet (`intro.css`, `legal.css`, the game CSS),
  not `components.css`.
- Any animation or transition gets a `@media (prefers-reduced-motion: reduce)` override.
- Hover effects go inside `@media (hover: hover)` so touch devices don't get stuck hover states.
- After changing a shared component, check that `/style-guide` (`web/style-guide.html`, `style-guide.css`) still
  reflects it, and update it if not.

## App landing pages

- `web/<app>/style.css` holds only that app's theme tokens and page-specific rules. Shared layout and components go
  in `web/css/landing.css`.
- Landing pages don't load the site's `tokens.css` / `components.css`. Keep the two systems separate.
