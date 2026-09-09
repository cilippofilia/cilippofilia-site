// The one card shape both app grids on the home page render into: the
// published apps that come back from Apple, and the in-development ones
// read out of data/apps.json. The two feeds carry different fields, so
// they each normalize into these arguments rather than into each other.

import { escapeHtml as esc } from "./html.js";

// "Drinko: Cocktail Recipes" -> title "Drinko", subtitle "Cocktail Recipes".
export function splitName(name) {
  const idx = (name || "").indexOf(":");
  if (idx === -1) return { title: name || "", subtitle: "" };
  return { title: name.slice(0, idx).trim(), subtitle: name.slice(idx + 1).trim() };
}

// Icons are either an emoji or a path to a real app icon.
export function isImageIcon(icon) {
  return typeof icon === "string" && /^(\/|https?:)/.test(icon);
}

// Badge colour for an in-development app's free-text status. Anything
// unrecognized falls back to a neutral badge rather than going unstyled.
export function badgeClass(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("dev")) return "dev";
  if (s.includes("concept")) return "concept";
  return "example";
}

// Every card carries the same two actions. "Website" is the app's own
// landing page on this site and "App Store" is Apple's listing; an app that
// isn't published yet keeps the App Store button but disabled, so the row
// reads the same across the grid. The card itself is not a link — links
// can't nest inside links — so the buttons are the only way off the card.
export function appCard({ websiteUrl, appStoreUrl, icon, name, badge, badgeStyle, tagline }) {
  const { title, subtitle } = splitName(name);
  const safeIcon = esc(icon);
  return `
    <article class="card">
      <div class="card-head">
        ${
          isImageIcon(icon)
            ? `<img class="icon-img" src="${safeIcon}" alt="" width="48" height="48" />`
            : `<span class="icon">${safeIcon || "📱"}</span>`
        }
        <div class="card-title">
          <h3>${esc(title)}</h3>
          ${subtitle ? `<p class="card-subtitle">${esc(subtitle)}</p>` : ""}
        </div>
      </div>
      <span class="badge ${esc(badgeStyle)}">${esc(badge)}</span>
      <p>${esc(tagline)}</p>
      <div class="card-actions">
        ${websiteUrl ? `<a class="button secondary" href="${esc(websiteUrl)}">Website</a>` : ""}
        ${
          appStoreUrl
            ? `<a class="button" href="${esc(appStoreUrl)}" target="_blank" rel="noopener">App Store</a>`
            : `<button type="button" class="button" disabled>App Store</button>`
        }
      </div>
    </article>
  `;
}
