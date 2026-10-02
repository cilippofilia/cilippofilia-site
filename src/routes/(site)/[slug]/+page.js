import { error } from "@sveltejs/kit";
import { findDevApp, validDevApps } from "#lib/apps/dev-apps.js";

// One prerendered page per valid data/apps.json entry. Static routes and the
// landing pages rank above this parameter, and validDevApps already drops
// any slug they own. Anything else 404s.
export function entries() {
  return validDevApps().map((app) => ({ slug: app.slug }));
}

export function load({ params }) {
  const app = findDevApp(params.slug);
  if (!app) error(404, "Not found");
  return { app };
}
