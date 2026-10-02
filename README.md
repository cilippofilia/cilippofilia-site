# cilippofilia.dev

The landing page hub for my apps: one grid of everything I've shipped to the App Store (pulled live from Apple) plus
what's still in development, a page per app, and a couple of minigames along the way.

It's plain HTML, CSS and vanilla JS with no framework, served two ways from the same `web/` folder:

- **Locally**, by a small Bun server bound to `127.0.0.1:4321`, so nothing else on your network can reach it.
- **In production**, as a static Netlify deploy, with `netlify.toml` recreating the local routes.

## Run it

```sh
bun install
bun run dev
```

Then open **http://localhost:4321/home**.

| Command | What it does |
| --- | --- |
| `bun run dev` | Builds the floating-icons bundle, then runs the server and restarts it on file changes |
| `bun run start` | Same, without watching |
| `bun server.js` | Runs the server with no build step (fine unless you've edited `src/client/floating-icons.js`) |
| `bun run build` | Rebuilds `web/js/floating-icons.bundle.js` only |
| `bun test` | Runs every test |
| `bun run format:check` | Checks formatting with Prettier |

If port 4321 is taken, use `PORT=3000 bun server.js`.

## Pages

| Path | What's there |
| --- | --- |
| `/home` | The landing page: intro, the maze minigame, and the app grid |
| `/app-store` | Permanent redirect to `/home#apps`, so old links still work |
| `/<slug>` | A generated page for each in-development app in `data/apps.json` (e.g. `/the-relay`) |
| `/nine-tiles-puzzle`, `/drinko`, `/iterly`, `/itswritten` | Custom marketing sites with their own CSS, JS and assets |
| `/style-guide` | Live reference for the design tokens and components |
| `/privacy`, `/terms` | The site's privacy policy and terms of use (each app keeps its own policy in its folder) |
| `/robots.txt`, `/sitemap.xml` | For search engines |
| anything else | `web/404.html`, with its whack-a-broken-link minigame |

## The app grid

The grid on `/home` merges two sources:

1. **Published apps**, from `/api/appstore-apps` (`src/server/appstore.js`). It calls Apple's iTunes lookup API for
   developer id `1690376038`, caches the result for 10 minutes, and falls back to the last good result if Apple can't
   be reached. New releases appear on their own. If Apple's `releaseDate` is still in the future, the card shows a
   "Preorder" badge with the date instead of "Live".
2. **Unreleased apps**, from `data/apps.json`, but only those whose slug is listed in `DEV_SLUGS_TO_SHOW` near the top of
   `web/js/apps-feed.js`. The rest stay in the file without being shown.

Cards are ordered by status (Live, Beta, In development, Planning, Discovery; see `web/js/app-status.js`), keeping each
source's own order within a status.

To publish under a different developer account, change `APPLE_DEVELOPER_ID` in `src/server/appstore.js`.

## Adding an in-development app

No HTML needed. Add an entry to `data/apps.json`:

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

`/my-new-app` works locally straight away, and on Netlify after the next deploy. To list it in the grid too, add its
slug to `DEV_SLUGS_TO_SHOW`.

`status` should be `Beta`, `In development`, `Planning` or `Discovery` (case doesn't matter). It sets the badge colour
and the sort position; anything else gets a neutral badge and sorts last. Once the app ships, delete its entry: it'll
come back as Live from the App Store feed.

## Adding a custom app site

For an app that needs a real marketing site rather than the shared template:

1. Create a folder under `web/` with its own `index.html`. It's served at `/<folder-name>/` automatically, with no route
   to add in `src/server/router.js` or `netlify.toml`.
2. Link `/css/landing.css`, then the site's own `style.css` (theme tokens and page-specific rules only; copy an existing
   one to start), and load `/js/landing-reveal.js`. Use absolute paths for these shared files, because the local server
   only serves files inside the app's own folder under `/<folder-name>/`.
3. If the app is already on the App Store, add its track id to `CUSTOM_APP_PAGES` in `src/server/appstore.js` so its
   card links to this page instead of out to Apple.
4. Add `/<folder-name>/` and `/<folder-name>/privacy-policy.html` to `web/sitemap.xml`, or `bun test` will fail.

## Design

The site is dark only and follows Apple's Liquid Glass look: the header, buttons and floating cards use a translucent,
blurred fill with a hairline border and a top highlight, over soft colour blooms fixed behind the page. Glass never
stacks; a control sitting on a glass card gets a flat tint instead of its own blur. Without `backdrop-filter` support,
or with `prefers-reduced-transparency`, surfaces fall back to solid cards.

Everything starts from the custom properties in `web/css/tokens.css`. Shared stylesheets load in this order:
`tokens.css` → `base.css` → `layout.css` → `components.css` → page-specific. See `/style-guide` for the live reference.

## Deploying to Netlify

`server.js` doesn't run on Netlify. Instead, the build (`bun run build && bun src/build/netlify.js`):

- bundles floating-icons (the bundle is gitignored, so it's built on deploy)
- copies `data/apps.json` to `web/apps.json`
- writes `web/_redirects` with one rewrite to `app.html` per in-development slug

The fixed routes are `[[redirects]]` in `netlify.toml`, and `/api/appstore-apps` runs as the Netlify Function
`netlify/functions/appstore-apps.mjs`.

The minigame score APIs (`/api/notfound-score`, `/api/maze-score`) are local-only because they're backed by SQLite
files under `data/`. On Netlify the games still play; they just don't save scores.

When you add or change a route in `src/server/router.js`, make the matching change in `netlify.toml` or
`src/build/netlify.js`, or it'll work locally and 404 in production.

## Tests

Tests use `bun:test` and sit next to the code they cover (`src/server/router.test.js`, `web/js/app-card.test.js`, and
so on). `sitemap.xml` is kept by hand, so `router.test.js` checks it both ways: every public page and custom app site
is listed, and every listed URL resolves.

`bun test` loads `.env.test`, which points the score databases at `data/.test/` instead of the real files, and
`src/test-setup.js` clears that folder at the start of each run.

## Seeing cilippofilia.dev in the address bar locally

To browse the local server as `cilippofilia.dev`, add this line to `/etc/hosts` (`sudo nano /etc/hosts` on macOS):

```
127.0.0.1   cilippofilia.dev
```

Then visit **http://cilippofilia.dev:4321/home**. This only affects your machine, but while the line is there it also
hides the live site from you. Remove it to see production again.

## Project layout

```
server.js              binds the local server to 127.0.0.1:4321
netlify.toml           Netlify build, function and redirect config
src/
  server/
    router.js          the routing table
    static.js          path resolution, MIME types, file serving
    appstore.js        live App Store lookup, cached
    dev-apps.js        reads data/apps.json for the app template route
    notfound-scores.js the 404 minigame's best score (SQLite)
    maze-scores.js     the maze minigame's leaderboard (SQLite)
  client/
    floating-icons.js  idle drift for the hero icons, bundled by `bun run build`
  build/
    netlify.js         the Netlify build step (apps.json, _redirects)
  test-setup.js        clears the test score databases before each run
netlify/functions/
  appstore-apps.mjs    /api/appstore-apps on Netlify
data/apps.json         in-development apps, one entry per page
web/
  index.html           the landing page
  app.html             generic page for in-development apps
  404.html             not-found page and its minigame
  style-guide.html     design tokens and components reference
  privacy.html, terms.html
  robots.txt, sitemap.xml
  css/
    tokens.css         colours, spacing, radii, glass material (start here)
    base.css           document ground, ambient background, focus rings
    layout.css         header, nav, main, footer, hero copy
    components.css     buttons, cards, grids, badges, app detail
    landing.css        shared layout for the custom app sites
    intro.css          the home page's opening screen
    legal.css          prose for /privacy and /terms
    style-guide.css    the style guide page
    maze-game.css, notfound-game.css
  js/
    nav.js             shared header and footer, injected on every page
    app-card.js        the card every app in the grid renders into
    app-status.js      status order and badge colours
    apps-feed.js       fills the grid from Apple's feed and apps.json
    app-page.js, app-detail.js   the generic app page
    intro-flip.js      the scroll-linked intro animation
    reveal.js          scroll-reveal for cards
    landing-reveal.js  scroll-reveal for the custom app sites
    maze-*.js          the maze minigame and its "how was this made?" walkthrough
    notfound-game*.js  the 404 minigame
    html.js            HTML escaping for every client template
  assets/              images, app icons, favicons
  nine-tiles-puzzle/, drinko/, iterly/, itswritten/
                       custom app sites
```
