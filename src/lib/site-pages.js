// Every public page at its canonical URL, for sitemap.xml. Built from the
// same lists the routes use, so a new landing page or public dev app can't
// be missed. Left out on purpose: /style-guide (internal reference) and the
// 404 page.

import { SITE_ORIGIN } from "./apps/meta.js";
import { LANDING_APPS } from "./apps/landing-apps.js";
import { publicDevApps } from "./apps/dev-apps.js";

const SITE_PAGES = ["/home", "/privacy", "/terms"];

export function sitemapPaths() {
  return [
    ...SITE_PAGES,
    ...LANDING_APPS.flatMap((app) => [`/${app}/`, `/${app}/privacy-policy.html`]),
    ...publicDevApps().map((app) => `/${app.slug}`),
  ].map((p) => SITE_ORIGIN + p);
}
