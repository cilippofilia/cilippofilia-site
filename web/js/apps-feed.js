// Fills the home page's App Store block from its two feeds:
//
//   /api/appstore-apps — what is actually published, live from Apple. The
//     soonest unreleased app is pulled out as the featured preorder strip;
//     the rest are "Live".
//   /apps.json         — the unreleased apps, from data/apps.json, each with
//     its own status (Beta, In development, Planning, Discovery).
//
// Both feed one continuous grid, ordered by status (see app-status.js), so
// it waits for both before rendering anything. The grid and the heading
// over it stay hidden if neither feed has anything to show: a heading over
// nothing is worse than no heading. A failed fetch just contributes no
// cards rather than showing an error.

import { appCard } from "./app-card.js";
import { badgeClass, sortByStatus } from "./app-status.js";
import { escapeHtml as esc } from "./html.js";
import { observeReveal } from "./reveal.js";

// While only relay is ready to show publicly, filter the rest of
// apps.json out here rather than deleting their entries.
const DEV_SLUGS_TO_SHOW = ["the-relay"];

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const show = (id) => {
  const el = document.getElementById(id);
  if (el) el.hidden = false;
};

// Whichever app is still a preorder gets the featured strip to itself, so
// the grid skips it. Computed from Apple's own release date, never
// hardcoded.
function findUpcoming(publishedApps) {
  return publishedApps.find((a) => a.releaseDate && new Date(a.releaseDate) > new Date());
}

function renderFeatured(upcoming) {
  const strip = document.getElementById("featured-strip");
  strip.innerHTML = `
    ${
      upcoming.icon
        ? `<img class="featured-icon" src="${esc(upcoming.icon)}" alt="" width="64" height="64" />`
        : ""
    }
    <div class="featured-body">
      <span class="featured-eyebrow">Preorder</span>
      <h3>${esc(upcoming.name)}</h3>
      <p>${esc(upcoming.tagline)} Releases ${esc(fmtDate(upcoming.releaseDate))}.</p>
    </div>
    <a class="button secondary" href="${esc(upcoming.localUrl || upcoming.url)}">Preorder <span class="chevron">›</span></a>
  `;
  strip.hidden = false;
}

// Both feeds normalized to one shape: the status to sort by, plus the
// card's arguments.
function publishedCard(app) {
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

function devCard(app) {
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

function render(publishedApps, devApps) {
  const upcoming = findUpcoming(publishedApps);
  const cards = sortByStatus([
    ...publishedApps.filter((a) => a !== upcoming).map(publishedCard),
    ...devApps.filter((a) => a && DEV_SLUGS_TO_SHOW.includes(a.slug)).map(devCard),
  ]);

  if (!upcoming && !cards.length) return;
  show("apps-heading");
  if (upcoming) renderFeatured(upcoming);
  if (cards.length) {
    document.getElementById("apps-grid").innerHTML = cards.map(appCard).join("");
    show("apps-section");
  }
  observeReveal();
}

const fetchList = (url) =>
  fetch(url)
    .then((r) => r.json())
    .then((list) => (Array.isArray(list) ? list : []))
    .catch(() => []);

Promise.all([fetchList("/api/appstore-apps"), fetchList("/apps.json")]).then(([published, dev]) =>
  render(published, dev)
);
