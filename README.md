# cilippofilia.dev

A landing page hub for my apps. It runs two ways: a local-only Bun server
for working on it (bound to `127.0.0.1`, so nothing on your network can
reach it), and a static Netlify deploy of the same `web/` folder — see
"Deploying to Netlify" below.

Visually it follows the tokens in `/style-guide` (also in this repo at
`web/style-guide.html`) — light, SF Pro, Apple-style pills and spacing,
measured off apple.com/uk's own CSS. `web/css/` holds the shared
stylesheets every page but the style guide and the custom app sites
(`web/nine-tiles-puzzle/`, `web/drinko/`, ... — real, separately-designed
landing pages) pulls from.

The surface material follows Apple's Liquid Glass language (iOS/macOS 26):
the header, buttons, and floating cards (app cards, the featured/preorder
strip, the profile card, the app-detail side rail) use a translucent,
blurred `backdrop-filter` fill with a hairline border and an inset top
highlight, over a couple of soft, low-opacity color blooms fixed behind the
page content. Glass never stacks — a button or badge that sits *on* an
already-glass card (the "Preorder ›" CTA, the app-detail side panel's
buttons) gets a flat tint instead of its own blur. There's a fallback to
plain solid cards for `prefers-reduced-transparency` and browsers without
`backdrop-filter` support. All of this lives in the `--glass-*` custom
properties at the top of `web/css/tokens.css`.

## Run it

```
bun install
bun run dev
```

Then open **http://localhost:4321/home**.

`bun run dev` builds the floating-icons bundle and restarts the server on
file changes. `bun run start` does the same without watching, and
`bun server.js` skips the build (fine unless you've edited
`src/client/floating-icons.js`). Change the port with
`PORT=3000 bun server.js` if 4321 is taken.

Run the tests with `bun test`.

## Pages that exist right now

- `/home` — the landing page. Everything is on it: the intro, the maze
  minigame, and under "What's on the App Store", one grid of every app:
  the live ones pulled from your real App Store developer page, then the
  unreleased ones from `data/apps.json`, ordered by status
- `/app-store` — the old standalone page, now a permanent redirect to
  `/home#apps`, so existing links still work
- one page per in-development app in `data/apps.json`, e.g. `/the-relay`
- `/nine-tiles-puzzle`, `/drinko`, `/iterly`, `/itswritten` — real
  marketing sites, custom multi-file pages (their own CSS/JS/assets), not
  the generic template
- `/style-guide` — design tokens and components reference
- `/privacy`, `/terms` — the site's privacy policy and terms of use, linked
  from every page's footer (each app keeps its own policy in its folder)
- anything else gets `web/404.html`, with its whack-a-broken-link minigame

## The "Published" section

`/api/appstore-apps` (`src/server/appstore.js`) calls Apple's iTunes
lookup API for developer id `1690376038` (Filippo Carlo Cilia), caches the
result for 10 minutes, and lists whatever comes back — icon, name, and a
link to the real App Store page. New apps you ship show up here
automatically, with no editing required. If Apple can't be reached
(offline, etc.) it falls back to the last successful result, or shows a
plain "couldn't reach the App Store" message if it's never succeeded yet.

If you ever publish under a different developer account, update
`APPLE_DEVELOPER_ID` near the top of `src/server/appstore.js`.

A published app's card shows a "Preorder" badge with its release date
instead of "Live" when Apple's `releaseDate` for it is still in the
future (this is automatic — nothing to configure per app). A published
app can also link straight to its own custom local page instead of out
to Apple — see "Custom app pages" below.

The grid orders apps by status — Live, Beta, In development, Planning,
Discovery (see `web/js/app-status.js`) — keeping each feed's own order
within a status. Unreleased apps only appear if their slug is named in
`DEV_SLUGS_TO_SHOW`, near the top of `web/js/apps-feed.js` — the rest of
`data/apps.json` is filtered out rather than deleted. Add a slug there to
show it.

## Adding an in-development app page

You don't need to write any HTML. Open `data/apps.json` and add an entry:

```json
{
  "slug": "my-new-app",
  "name": "My New App",
  "tagline": "One line that sells it.",
  "description": "A couple of sentences for the detail page.",
  "platforms": ["iPhone", "iPad"],
  "status": "Planning",
  "icon": "✨",
  "appStoreUrl": ""
}
```

Save, refresh the browser — `/my-new-app` now works locally (on Netlify,
after the next deploy). To also list it in the grid on `/home`, add its
slug to `DEV_SLUGS_TO_SHOW` (see above). `status` must be one of `Beta`,
`In development`, `Planning`, or `Discovery` (case doesn't matter): it
sets the badge colour and the app's place in the grid. Anything else gets
a neutral badge and sorts last, with Discovery. Once the app actually
ships, delete its entry here — it'll show up as Live on its own from then
on.

## Custom app pages

Some apps need more than the shared template — a real marketing site with
its own CSS, JS, and screenshots (9 Tiles Puzzle is the example: its
whole existing landing page lives at `web/nine-tiles-puzzle/`).

To add one: drop the site's files into a new folder under `web/`
(anything with its own `index.html`), and it's served automatically —
`/<folder-name>` redirects to `/<folder-name>/` so its relative asset
links resolve correctly, and everything under that path is served
straight from the folder. No route to add in `src/server/router.js` or
`netlify.toml`.

The four existing landing pages share their layout and scroll-in reveal:
each page links `/css/landing.css` and then its own `style.css` (just the
colour theme and any page-specific rules), and loads `/js/landing-reveal.js`.
Those shared files must be referenced by absolute path — the local server
only serves files inside the app's own folder under `/<folder-name>/`.
Copy an existing `style.css` to theme a new one.

If a matching entry exists in `CUSTOM_APP_PAGES` in
`src/server/appstore.js` (keyed by the app's App Store track id), its
"Published" card links straight to this local page instead of out to
Apple.

## Deploying to Netlify

`netlify.toml` publishes `web/` and recreates the local router's routes
there; `server.js` itself doesn't run on Netlify. The build bundles
floating-icons and runs `src/build/netlify.js`, which copies
`data/apps.json` into `web/` and writes `web/_redirects` with a rewrite to
the app template for each in-development slug. `/api/appstore-apps` runs
as a Netlify Function (`netlify/functions/appstore-apps.mjs`).

The two minigame score APIs (`/api/notfound-score`, `/api/maze-score`)
are local-only — they're backed by SQLite files under `data/`. On Netlify
the games still play, they just don't save a best score or leaderboard.

## Pointing "cilippofilia.dev" at your local server

Locally the address bar says `localhost:4321`. To have the browser show
`cilippofilia.dev/home` for your local server instead, map the domain to
your own machine by adding one line to `/etc/hosts` (macOS):

```
sudo nano /etc/hosts
```

Add:

```
127.0.0.1   cilippofilia.dev
```

Save, then visit **http://cilippofilia.dev:4321/home**. This only affects
your own machine — but while that line is there, it also hides the real
cilippofilia.dev from you if the domain points at the Netlify deploy.
Remove it to see the live site.

## Project layout

```
server.js            — binds the local server to 127.0.0.1:4321
netlify.toml         — Netlify build, function, and redirect config
src/server/
  router.js          — the routing table
  static.js          — path resolution, MIME types, file serving
  appstore.js        — live App Store lookup for the developer id, cached
  dev-apps.js        — reads data/apps.json for the app template route
  notfound-scores.js — the 404 minigame's best score (SQLite)
  maze-scores.js     — the maze minigame's leaderboard (SQLite)
src/client/
  floating-icons.js  — idle drift for the icons behind the hero, bundled
                       into web/js/floating-icons.bundle.js by bun run build
src/build/
  netlify.js         — the Netlify build step (apps.json, _redirects)
netlify/functions/
  appstore-apps.mjs  — /api/appstore-apps on Netlify
data/apps.json       — in-development apps: one entry per landing page
web/
  index.html         — landing page, plus the published (live) and
                       in-development (apps.json) app grids
  app.html           — generic per-app template for in-development apps
  404.html           — not-found page and its minigame
  style-guide.html   — design tokens and components reference
  privacy.html, terms.html — site privacy policy and terms of use
  css/               — shared styling, linked in this order
    tokens.css       — colours, radii, glass material (start here)
    base.css         — document ground, ambient background, focus rings
    layout.css       — header, nav, main, footer, hero copy
    components.css   — buttons, cards, grids, badges, app detail
    intro.css        — the home page's opening screen (home page only)
    maze-game.css, notfound-game.css — the two minigames
    legal.css        — prose styling for /privacy and /terms
  js/
    nav.js           — shared header/footer, injected on every page
    app-card.js      — the card shape every app in the grid renders into
    app-status.js    — the status order and badge colours
    apps-feed.js     — fills the grid from Apple's feed and apps.json
    app-page.js, app-detail.js — the generic app page
    intro-flip.js    — the scroll-linked intro animation
    reveal.js        — scroll-reveal for cards
    maze-*.js        — the maze minigame and its "how was this made?" walkthrough
    notfound-game*.js — the 404 minigame
    html.js          — HTML escaping every client template goes through
  assets/            — images, app icons, favicons
  nine-tiles-puzzle/, drinko/, iterly/, itswritten/
                     — custom multi-file app sites (see above)
```
