// Live App Store data: everything Filippo Carlo Cilia has actually shipped,
// read straight from Apple rather than kept in a list here, so newly
// published apps appear on the site with no editing.

const https = require("https");

// https://apps.apple.com/us/developer/filippo-carlo-cilia/id1690376038
const APPLE_DEVELOPER_ID = "1690376038";
const CACHE_MS = 10 * 60 * 1000;

// Published apps that also have their own custom landing page under
// public/<slug>/ instead of just linking straight out to Apple.
const CUSTOM_APP_PAGES = {
  6776386637: "nine-tiles-puzzle", // 9 Tiles Puzzle
};

let cache = { fetchedAt: 0, apps: [] };

function fetchPublishedApps() {
  return new Promise((resolve, reject) => {
    const url = `https://itunes.apple.com/lookup?id=${APPLE_DEVELOPER_ID}&entity=software&limit=200`;
    https
      .get(url, { timeout: 8000 }, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(body);
            const apps = (parsed.results || [])
              .filter((r) => r.wrapperType === "software")
              .map((r) => ({
                id: r.trackId,
                name: r.trackName,
                tagline: (r.description || "").split(/\n/)[0].slice(0, 160),
                icon: (r.artworkUrl100 || "").replace("100x100bb", "512x512bb"),
                url: r.trackViewUrl,
                genre: r.primaryGenreName || "",
                releaseDate: r.releaseDate || null,
                localUrl: CUSTOM_APP_PAGES[r.trackId] ? `/${CUSTOM_APP_PAGES[r.trackId]}` : null,
              }));
            resolve(apps);
          } catch (err) {
            reject(err);
          }
        });
      })
      .on("timeout", function () {
        this.destroy(new Error("iTunes lookup timed out"));
      })
      .on("error", reject);
  });
}

// Cached for a few minutes so a page reload doesn't hit Apple every time.
// A failed refresh serves the last good result rather than failing the
// request — being a few minutes stale beats an empty page.
async function getPublishedApps() {
  const isFresh = Date.now() - cache.fetchedAt < CACHE_MS;
  if (isFresh && cache.apps.length) return cache.apps;

  try {
    const apps = await fetchPublishedApps();
    cache = { fetchedAt: Date.now(), apps };
    return apps;
  } catch (err) {
    console.error("Couldn't refresh App Store apps:", err.message);
    return cache.apps; // possibly empty, on a cold start with no network
  }
}

module.exports = { getPublishedApps };
