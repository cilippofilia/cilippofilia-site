// The one card shape both app grids on the home page render into: the
// published apps that come back from Apple, and the in-development ones
// read out of data/apps.json. The two feeds carry different fields, so
// they each normalize into these arguments rather than into each other.

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

export function appCard({ href, external = false, icon, name, badge, badgeStyle, tagline }) {
  const { title, subtitle } = splitName(name);
  return `
    <a class="card" href="${href}" ${external ? 'target="_blank" rel="noopener"' : ""}>
      <div class="card-head">
        ${
          isImageIcon(icon)
            ? `<img class="icon-img" src="${icon}" alt="" width="48" height="48" />`
            : `<span class="icon">${icon || "📱"}</span>`
        }
        <div class="card-title">
          <h3>${title}</h3>
          ${subtitle ? `<p class="card-subtitle">${subtitle}</p>` : ""}
        </div>
      </div>
      <span class="badge ${badgeStyle}">${badge}</span>
      <p>${tagline || ""}</p>
    </a>
  `;
}
