import { isImageIcon } from "./names.js";

// The production origin, for absolute canonical and og:image URLs.
export const SITE_ORIGIN = "https://cilippofilia.dev";

// Per-app page metadata: what a dev app page's <title>, description,
// canonical and Open Graph tags say. Prerendered, so crawlers see it too.
export function appPageMeta(app) {
  const url = `${SITE_ORIGIN}/${app.slug}`;
  const image = isImageIcon(app.icon) ? new URL(app.icon, SITE_ORIGIN).href : `${SITE_ORIGIN}/assets/profile.jpg`;
  return { title: `${app.name} · cilippofilia.dev`, description: app.tagline, url, image };
}
