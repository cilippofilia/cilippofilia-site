// The in-development apps from data/apps.json, imported at build time.
// Every valid entry is prerendered to its own /<slug> page; the home page
// grid shows only DEV_SLUGS_TO_SHOW.

import apps from "../../../data/apps.json";
import { LANDING_APPS } from "./landing-apps.js";

export const SLUG_PATTERN = /^[a-zA-Z0-9-]+$/;

// First path segments a fixed route already owns.
export const RESERVED_SLUGS = new Set([
  "home",
  "style-guide",
  "privacy",
  "terms",
  "games",
  "app-store",
  "api",
  "assets",
  ...LANDING_APPS,
]);

// While only relay is ready to show publicly, filter the rest of
// apps.json out here rather than deleting their entries.
export const DEV_SLUGS_TO_SHOW = ["the-relay"];

export function validDevApps(list = apps) {
  if (!Array.isArray(list)) return [];
  return list.filter(
    (app) => app && typeof app.slug === "string" && SLUG_PATTERN.test(app.slug) && !RESERVED_SLUGS.has(app.slug)
  );
}

export function findDevApp(slug, list = apps) {
  return validDevApps(list).find((app) => app.slug === slug);
}

export function publicDevApps(list = apps) {
  return validDevApps(list).filter((app) => DEV_SLUGS_TO_SHOW.includes(app.slug));
}
