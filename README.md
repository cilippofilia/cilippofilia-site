# cilippofilia.dev

The landing page hub for my apps: one grid of everything I've shipped to the App Store (pulled live from Apple) plus
what's still in development, a page per app, and a couple of minigames along the way.

It's a [SvelteKit](https://svelte.dev/docs/kit) site run with Bun. Every page is prerendered to static HTML and
deployed to Netlify with `@sveltejs/adapter-netlify`; the live App Store feed runs as a Netlify Function.

## Run it

```sh
bun install
bun run dev
```

Then open **http://localhost:4321/home**. The dev server binds to `127.0.0.1` only, so nothing else on your network
can reach it.

| Command | What it does |
| --- | --- |
| `bun run dev` | Runs `vite dev` under Bun, with hot reload |
| `bun run build` | Prerenders every page into `build/` and writes the Netlify Function into `.netlify/` |
| `bun run preview` | Serves the last build |
| `bun run start` | Build, then preview |
| `bun test` | Runs every test, including one full build that checks the prerendered output |
| `bun run format:check` | Checks formatting with Prettier (with the Svelte plugin) |

## Pages

| Path | What's there |
| --- | --- |
| `/home` | The landing page: intro, the app grid, and the maze minigame |
| `/app-store` | Permanent redirect to `/home#apps`, so old links still work |
| `/<slug>` | A prerendered page for each in-development app in `data/apps.json` (e.g. `/the-relay`) |
| `/nine-tiles-puzzle/`, `/drinko/`, `/iterly/`, `/itswritten/` | Each app's own landing page, plus `privacy-policy.html` |
| `/style-guide` | Live reference for the design tokens and components |
| `/privacy`, `/terms` | The site's privacy policy and terms of use |
| `/robots.txt`, `/sitemap.xml` | For search engines (the sitemap is generated) |
| anything else | The 404 page, with its whack-a-broken-link minigame |

## The app grid

The grid on `/home` merges two sources:

1. **Published apps**, fetched in the browser from `/api/appstore-apps` (`src/lib/server/appstore.js`). It calls
   Apple's iTunes lookup API for developer id `1690376038`, caches the result for 10 minutes, and falls back to the
   last good result if Apple can't be reached. New releases appear on their own. An app whose release date is still
   in the future gets the featured "Preorder" strip instead of a card.
2. **Unreleased apps**, from `data/apps.json` at build time, but only those whose slug is listed in
   `DEV_SLUGS_TO_SHOW` in `src/lib/apps/dev-apps.js`. The rest stay in the file without being shown.

Cards are ordered by status (Live, Beta, In development, Planning, Discovery; see `src/lib/apps/app-status.js`),
keeping each source's own order within a status.

To publish under a different developer account, change `APPLE_DEVELOPER_ID` in `src/lib/server/appstore.js`.

## Adding an in-development app

No page to write. Add an entry to `data/apps.json`:

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

`/my-new-app` is prerendered on the next build (restart `bun run dev` to see it locally). To list it in the grid and
the sitemap too, add its slug to `DEV_SLUGS_TO_SHOW`.

`status` should be `Beta`, `In development`, `Planning` or `Discovery` (case doesn't matter). It sets the badge colour
and the sort position; anything else gets a neutral badge and sorts last. Once the app ships, delete its entry: it'll
come back as Live from the App Store feed.

## Adding an app landing page

For an app that needs a real marketing page rather than the generated one:

1. Create `src/routes/(landing)/<app>/+page.svelte` and a `+page.js` with `export const trailingSlash = "always";`.
   Copy an existing landing page to start: it imports `#lib/styles/landing.css`, then
   `#lib/styles/apps/<app>.css` (that app's theme tokens and page-specific rules only).
2. Add `privacy-policy/+page.svelte` with a `+page.js` of `export const csr = false;` and
   `export const trailingSlash = "never";`, so it's served at `/<app>/privacy-policy.html`.
3. Put the app's images in `static/<app>/assets/`.
4. Add the slug to `LANDING_APPS` in `src/lib/apps/landing-apps.js` (sitemap, and keeps the slug away from
   `apps.json`) and to `PRIVACY_HTML` in `src/hooks.js` (so the `.html` URL works in dev).
5. If the app is already on the App Store, add its track id to `CUSTOM_APP_PAGES` in `src/lib/server/appstore.js` so
   its card links to this page instead of out to Apple.

## Design

The site is dark only and follows Apple's Liquid Glass look: the header, buttons and floating cards use a translucent,
blurred fill with a hairline border and a top highlight, over soft colour blooms fixed behind the page. Glass never
stacks; a control sitting on a glass card gets a flat tint instead of its own blur. Without `backdrop-filter` support,
or with `prefers-reduced-transparency`, surfaces fall back to solid cards.

Everything starts from the custom properties in `src/lib/styles/tokens.css`. The site layout loads
`tokens.css` → `base.css` → `layout.css` → `components.css`, then each page adds its own stylesheet. See `/style-guide`
for the live reference.

## Deploying to Netlify

`netlify.toml` runs `bun run build` and publishes `build/`. Pages are static files; `/api/appstore-apps` and unknown
paths (the 404 page) go to the Netlify Function adapter-netlify generates.

Two things are kept in step with the dev server by hand: the redirects (`REDIRECTS` in `src/hooks.server.js` and
`[[redirects]]` in `netlify.toml`) and the security headers (`src/lib/server/security-headers.js` and `[[headers]]`;
a test fails if those drift).

The minigame score APIs (`/api/notfound-score`, `/api/maze-score`) save to SQLite files under `data/`, which only
works where the site runs on Bun. On Netlify they answer 503 and the games play on without saving scores.

## Tests

Tests use `bun:test` and sit next to the code they cover (`src/lib/apps/feed.test.js`, `src/hooks.server.test.js`,
and so on). `src/build-output.test.js` runs one full build and checks the result: every page exists with its head
tags, the CSP, the sitemap, and that `netlify.toml` matches the dev headers.

`bun test` loads `.env.test`, which points the score databases at `data/.test/` instead of the real files, and
`src/test-setup.js` clears that folder at the start of each run.

## Seeing cilippofilia.dev in the address bar locally

To browse the dev server as `cilippofilia.dev`, add this line to `/etc/hosts` (`sudo nano /etc/hosts` on macOS):

```
127.0.0.1   cilippofilia.dev
```

and allow the host in `vite.config.js` (`server.allowedHosts: ["cilippofilia.dev"]`), since Vite rejects unknown
hostnames. Then visit **http://cilippofilia.dev:4321/home**. This only affects your machine, but while the line is
there it also hides the live site from you. Remove it to see production again.

## Project layout

```
vite.config.js         SvelteKit config (adapter, CSP) and the dev server
netlify.toml           build command, redirects and security headers for Netlify
data/apps.json         in-development apps, one entry per page
static/                images, favicons, robots.txt, and each landing page's assets/
src/
  app.html             the document shell
  hooks.js             reroute for the landing pages' privacy-policy.html URLs
  hooks.server.js      dev redirects, favicon, cross-origin guard, security headers
  build-output.test.js checks the prerendered build
  test-setup.js        clears the test score databases before each run
  routes/
    (site)/            home, privacy, terms, style-guide, [slug] (dev apps)
    (landing)/         drinko, iterly, itswritten, nine-tiles-puzzle (+ privacy-policy)
    api/               appstore-apps, maze-score, notfound-score
    sitemap.xml/       generated sitemap
    +error.svelte      the 404 page and its minigame
  lib/
    server/            App Store lookup, score stores and API, security headers, paths
    apps/              apps.json helpers, App Store block shaping, statuses, names, page meta
    components/        Seo, Header, Footer, app cards, the minigames' markup, ...
    games/             maze and 404 game logic and DOM wiring
    intro/             the scroll-linked intro animation
    actions/           scroll-reveal actions
    styles/            tokens and global CSS, page stylesheets, apps/<app>.css themes
    site-pages.js      every public URL, for the sitemap
```
