# General rules (always apply)

- This repo is a vanilla HTML/CSS/JS website run with Bun. The Swift/SwiftUI guidance in the user's global
  `~/.claude/CLAUDE.md` does not apply here; ignore it unless a task is explicitly about an Apple app.
- No frameworks, no client bundler (except the one `src/client/floating-icons.js` bundle), no new dependencies
  without asking first. `animejs` is the only runtime dependency.
  Exception: on the `svelte-migration` branch the site is being rewritten in SvelteKit, and the dependencies listed
  in `docs/superpowers/specs/2026-10-02-sveltekit-migration-design.md` are approved. Anything beyond that list still
  needs asking first. The rest of these rules describe the current site and stay in force for code that hasn't been
  ported yet; they get rewritten for SvelteKit as the last step of the migration.
- Match the surrounding code: comment density, naming, CommonJS vs ESM (see the per-area rules). Comments explain
  *why* a thing is the way it is, in full sentences; that's the house style throughout.
- Public contact email is `cilia.filippo.dev@gmail.com`. Never put the iCloud address in anything published.
- Copy and page titles: use `·` as the separator (`Privacy Policy · cilippofilia.dev`), not em dashes. British
  English, en-GB date formatting.
- Don't run `bun run format` over the whole repo as part of an unrelated change. Format only files you touch, and
  only if they were already formatted.
- Before claiming done: run `bun test`. If you touched `src/client/`, run `bun run build` too.

## Git

- Commit subjects are imperative, sentence case, no prefix, no trailing period
  (`Add privacy policy and terms pages; use the public contact address`). One logical change per commit.
- Commit or push only when asked. Work on a branch, not `main`.

## Keep local and Netlify in sync

Every route exists twice: `src/server/router.js` (local) and `netlify.toml` / `src/build/netlify.js` (deploy).
Changing one without the other means it works locally and 404s in production. See `server.md`.
