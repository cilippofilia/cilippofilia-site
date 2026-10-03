// Shapes the home page's App Store block from its two feeds: the published
// apps live from Apple (/api/appstore-apps) and the unreleased ones from
// data/apps.json. Both feed one continuous grid ordered by status (see
// app-status.js); the soonest unreleased Apple app is pulled out as the
// featured preorder strip instead.

import { badgeClass, sortByStatus } from "./app-status.js";

export const formatReleaseDate = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

// Whichever app is still a preorder gets the featured strip to itself.
// Computed from Apple's own release date, never hardcoded.
export function findUpcoming(publishedApps, now = new Date()) {
  return publishedApps.find((a) => a.releaseDate && new Date(a.releaseDate) > now);
}

export function publishedCard(app) {
  return {
    status: "Live",
    websiteUrl: app.localUrl,
    appStoreUrl: app.url,
    icon: app.icon,
    name: app.name,
    badge: "Live",
    badgeStyle: "live",
    tagline: app.tagline || app.genre,
  };
}

export function devCard(app) {
  return {
    status: app.status,
    websiteUrl: `/${app.slug}`,
    appStoreUrl: app.appStoreUrl,
    icon: app.icon,
    name: app.name,
    badge: app.status || "",
    badgeStyle: badgeClass(app.status),
    tagline: app.tagline,
  };
}

export function buildAppsBlock(publishedApps, devApps, now = new Date()) {
  const published = Array.isArray(publishedApps) ? publishedApps : [];
  const dev = Array.isArray(devApps) ? devApps : [];
  const upcoming = findUpcoming(published, now);
  const cards = sortByStatus([...published.filter((a) => a !== upcoming).map(publishedCard), ...dev.map(devCard)]);
  return { upcoming, cards };
}
