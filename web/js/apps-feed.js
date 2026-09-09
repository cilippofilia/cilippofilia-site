// Fills the home page's App Store block from its two feeds:
//
//   /api/appstore-apps — what is actually published, live from Apple. The
//     soonest unreleased app is pulled out as the featured preorder strip;
//     the rest become the "published" grid.
//   /apps.json         — the in-development apps, from data/apps.json.
//
// Each grid stays hidden until its feed comes back, and so does the heading
// over both of them: a heading over nothing is worse than no heading.
// A failed fetch leaves the page as it was rather than showing an error.

import { appCard, badgeClass } from "./app-card.js";
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

function renderPublished(apps) {
  // Whichever app is still a preorder gets the featured strip to itself, so
  // the grid below skips it. Computed from Apple's own release date, never
  // hardcoded.
  const upcoming = apps.find((a) => a.releaseDate && new Date(a.releaseDate) > new Date());

  const live = apps.filter((a) => a !== upcoming);
  if (live.length) {
    document.getElementById("published-grid").innerHTML = live
      .map((app) =>
        appCard({
          websiteUrl: app.localUrl,
          appStoreUrl: app.url,
          icon: app.icon,
          name: app.name,
          badge: "Live",
          badgeStyle: "live",
          tagline: app.tagline || app.genre,
        })
      )
      .join("");
    show("published-section");
  }

  if (!upcoming) {
    observeReveal();
    return;
  }
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
    <a class="button secondary" href="${esc(upcoming.localUrl || upcoming.url)}">Preorder ›</a>
  `;
  strip.hidden = false;
  observeReveal();
}

function renderInDevelopment(allApps) {
  const apps = allApps.filter((app) => DEV_SLUGS_TO_SHOW.includes(app.slug));
  if (!apps.length) return;
  document.getElementById("dev-grid").innerHTML = apps
    .map((app) =>
      appCard({
        websiteUrl: `/${app.slug}`,
        appStoreUrl: app.appStoreUrl,
        icon: app.icon,
        name: app.name,
        badge: app.status || "",
        badgeStyle: badgeClass(app.status),
        tagline: app.tagline,
      })
    )
    .join("");
  show("dev-section");
  observeReveal();
}

fetch("/api/appstore-apps")
  .then((r) => r.json())
  .then((apps) => {
    if (apps.length) show("apps-heading");
    renderPublished(apps);
  })
  .catch(() => {});

fetch("/apps.json")
  .then((r) => r.json())
  .then(renderInDevelopment)
  .catch(() => {});
