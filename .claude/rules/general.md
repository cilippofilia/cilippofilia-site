# General rules (always apply)

- This repo is a SvelteKit site (Svelte 5, adapter-netlify, prerendered) run with Bun. The Swift/SwiftUI guidance in
  the user's global `~/.claude/CLAUDE.md` does not apply here; ignore it unless a task is explicitly about an Apple
  app.
- SvelteKit/Svelte is the only framework. No new dependencies without asking first; `animejs` is the only runtime
  dependency, and everything else in `package.json` is build or dev tooling.
- Match the surrounding code: comment density, naming, ES modules throughout. Comments explain *why* a thing is the
  way it is, in full sentences; that's the house style throughout.
- Public contact email is `cilia.filippo.dev@gmail.com`. Never put the iCloud address in anything published.
- Copy and page titles: use `·` as the separator (`Privacy Policy · cilippofilia.dev`), not em dashes. British
  English, en-GB date formatting.
- Don't run `bun run format` over the whole repo as part of an unrelated change. Format only files you touch, and
  only if they were already formatted.
- Before claiming done: run `bun test`. It includes `src/build-output.test.js`, which runs a full `vite build`, so a
  green run also means the site builds and prerenders.
- The repo lives on an iCloud-synced Desktop, which sometimes leaves conflict copies named `file 2.ext`. Check
  `git status` for them before committing, and never commit one. Inside `src/routes/` they also break the build
  (`+page 2.js` is a reserved-name error).

## Git

- Commit subjects are imperative, sentence case, no prefix, no trailing period
  (`Add privacy policy and terms pages; use the public contact address`). One logical change per commit.
- Commit or push only when asked. Work on a branch, not `main`.

## Keep local and Netlify in sync

SvelteKit's file-based routing serves the same routes locally and on Netlify. Only two things are kept in sync by
hand, both in `server.md`: `REDIRECTS` in `src/hooks.server.js` ↔ `[[redirects]]` in `netlify.toml`, and
`SECURITY_HEADERS` ↔ `[[headers]]` in `netlify.toml` (a test fails if the headers drift).
