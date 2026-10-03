// Name and icon helpers shared by every app card and detail page. The
// published apps (from Apple) and the unreleased ones (from data/apps.json)
// carry different fields, but both have a "Title: Subtitle" name and an
// icon that is either an emoji or a path to a real app icon.

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
