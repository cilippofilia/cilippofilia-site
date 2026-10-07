// Shapes the home page's App Store block from its two feeds: the published
// apps live from Apple (/api/appstore-apps) and the unreleased ones from
// data/apps.json. Both feed one continuous grid ordered by status (see
// app-status.js); the soonest unreleased Apple app is pulled out as the
// featured preorder strip instead.

import { badgeClass, sortByStatus } from "./app-status.js";
import { campaignUrl } from "./campaign.js";

// Every App Store link on the home page shares one campaign token, so App
// Analytics can compare it with the landing pages.
export const HOME_CAMPAIGN = "site-home";

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
    appStoreUrl: campaignUrl(app.url, HOME_CAMPAIGN),
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
    appStoreUrl: campaignUrl(app.appStoreUrl, HOME_CAMPAIGN),
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
