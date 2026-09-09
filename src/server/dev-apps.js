// The in-development apps: one entry per landing page in data/apps.json.
// Read fresh on every call — the file is a few hundred bytes and reading it
// each time is what lets "save apps.json, refresh the browser" keep working
// with no restart.

const fs = require("fs");
const path = require("path");
const { DATA_DIR } = require("./static");

function loadDevApps() {
  try {
    const parsed = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "apps.json"), "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Couldn't read data/apps.json:", err.message);
    return [];
  }
}

function hasDevApp(slug) {
  return loadDevApps().some((app) => app && app.slug === slug);
}

module.exports = { loadDevApps, hasDevApp };
