# cilippofilia.co.uk (local)

A local-only landing page hub. It never leaves your machine — the server
only binds to `127.0.0.1`, so nothing on your network (let alone the
internet) can reach it.

Visually it follows the tokens in `/style-guide` (also in this repo at
`public/style-guide.html`) — light, SF Pro, Apple-style pills and spacing,
measured off apple.com/uk's own CSS. `public/styles.css` is the shared
stylesheet every page but the style guide and `public/nine-tiles-puzzle/`
(a real, separately-designed landing page) pulls from.

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
properties at the top of `public/styles.css`.

## Run it

```
node server.js
```

Then open **http://localhost:4321/home**.

(Change the port with `PORT=3000 node server.js` if 4321 is taken.)

## Pages that exist right now

- `/home` — the landing page. Everything is on it: the intro, and under
  "What's on the App Store", **Published**, pulled live from your real
  App Store developer page, plus **In development**, from `data/apps.json`
- `/app-store` — the old standalone page, now a permanent redirect to
  `/home#apps`, so existing links still work
- one page per in-development app, e.g. `/the-relay`, `/running-plan`
- `/nine-tiles-puzzle` — the real marketing site for 9 Tiles Puzzle, a
  custom multi-file page (its own CSS/JS/assets), not the generic template

## The "Published" section

`server.js` calls Apple's iTunes lookup API for developer id `1690376038`
(Filippo Carlo Cilia) every time `/home` is loaded, caches the result
for 10 minutes, and lists whatever comes back — icon, name, and a link to
the real App Store page. New apps you ship show up here automatically,
with no editing required. If Apple can't be reached (offline, etc.) it
falls back to the last successful result, or shows a plain "couldn't
reach the App Store" message if it's never succeeded yet.

If you ever publish under a different developer account, update
`APPLE_DEVELOPER_ID` near the top of `server.js`.

A published app's card shows a "Preorder" badge with its release date
instead of "Live" when Apple's `releaseDate` for it is still in the
future (this is automatic — nothing to configure per app). A published
app can also link straight to its own custom local page instead of out
to Apple — see "Custom app pages" below.

The "In development" section only lists the slugs named in
`DEV_SLUGS_TO_SHOW`, near the top of the inline script in `home.html` —
the rest of `data/apps.json` is filtered out rather than deleted. Add a
slug there to show it.

## Adding an in-development app page

You don't need to write any HTML. Open `data/apps.json` and add an entry:

```json
{
  "slug": "my-new-app",
  "name": "My New App",
  "tagline": "One line that sells it.",
  "description": "A couple of sentences for the detail page.",
  "platforms": ["iPhone", "iPad"],
  "status": "Concept",
  "icon": "✨",
  "appStoreUrl": ""
}
```

Save, refresh the browser — `/my-new-app` now works, and it shows up in
the "In development" section of `/home` automatically. `status`
just changes the badge color; it currently recognizes anything containing
"dev" or "concept", and falls back to a neutral badge otherwise. Once the
app actually ships, delete its entry here — it'll show up in "Published"
on its own from then on.

## Custom app pages

Some apps need more than the shared template — a real marketing site with
its own CSS, JS, and screenshots (9 Tiles Puzzle is the example: its
whole existing landing page lives at `public/nine-tiles-puzzle/`).

To add one: drop the site's files into a new folder under `public/`
(anything with its own `index.html`), and the server serves it
automatically — `/<folder-name>` redirects to `/<folder-name>/` so its
relative asset links resolve correctly, and everything under that path
is served straight from the folder. No route to add in `server.js`.

If a matching entry exists in `CUSTOM_APP_PAGES` in `server.js` (keyed by
the app's App Store track id), its "Published" card links straight to
this local page instead of out to Apple.

## Making the address bar actually say "cilippofilia.co.uk"

Right now it's `localhost:4321`. If you want the browser to show
`cilippofilia.co.uk/home` instead, map the domain to your own machine by
adding one line to `/etc/hosts` (macOS):

```
sudo nano /etc/hosts
```

Add:

```
127.0.0.1   cilippofilia.co.uk
```

Save, then visit **http://cilippofilia.co.uk:4321/home**. This only affects
your own machine — nobody else's computer resolves that name any
differently, and no real domain is registered or touched.

## Project layout

```
server.js          — local static server + live App Store fetch (no npm deps)
data/apps.json      — in-development apps: one entry per landing page
public/
  home.html         — landing page, plus the published (live) and
                      in-development (apps.json) app grids
  app.html          — generic per-app template for in-development apps
  styles.css        — shared styling
  nav.js            — shared header/footer, injected on every page
```
