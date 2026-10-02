// Live App Store data: everything Filippo Carlo Cilia has actually shipped,
// read straight from Apple rather than kept in a list here, so newly
// published apps appear on the site with no editing.
//
// Runs on Node inside the Netlify Function as well as on Bun locally, so
// no Bun-only APIs here. fetch is injectable so the cache can be tested
// without the network.

// https://apps.apple.com/us/developer/filippo-carlo-cilia/id1690376038
const APPLE_DEVELOPER_ID = "1690376038";
const LOOKUP_URL = `https://itunes.apple.com/lookup?id=${APPLE_DEVELOPER_ID}&entity=software&limit=200`;
const CACHE_MS = 10 * 60 * 1000;
const TIMEOUT_MS = 8000;

// Published apps that also have their own landing page on this site
// instead of just linking straight out to Apple.
const CUSTOM_APP_PAGES = {
  6449893371: "drinko", // Drinko: Cocktail Recipes
  6757445119: "itswritten", // itsWritten: AI Journal
  6760037639: "iterly", // Iterly: Ship Your Apps
  6776386637: "nine-tiles-puzzle", // 9 Tiles Puzzle
};

export function toApp(r) {
  return {
    id: r.trackId,
    name: r.trackName,
    tagline: (r.description || "").split(/\n/)[0].slice(0, 160),
    icon: (r.artworkUrl100 || "").replace("100x100bb", "512x512bb"),
    url: r.trackViewUrl,
    genre: r.primaryGenreName || "",
    releaseDate: r.releaseDate || null,
    localUrl: CUSTOM_APP_PAGES[r.trackId] ? `/${CUSTOM_APP_PAGES[r.trackId]}` : null,
  };
}

export function createAppStore({ fetchImpl = (...args) => fetch(...args), now = Date.now } = {}) {
  let cache = { fetchedAt: 0, apps: [] };

  async function fetchPublishedApps() {
    const res = await fetchImpl(LOOKUP_URL, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`iTunes lookup answered ${res.status}`);
    const parsed = await res.json();
    return (parsed.results || []).filter((r) => r.wrapperType === "software").map(toApp);
  }

  // Cached for a few minutes so a page reload doesn't hit Apple every time.
  // A failed refresh serves the last good result rather than failing the
  // request: being a few minutes stale beats an empty page.
  async function getPublishedApps() {
    const isFresh = now() - cache.fetchedAt < CACHE_MS;
    if (isFresh && cache.apps.length) return cache.apps;
    try {
      const apps = await fetchPublishedApps();
      cache = { fetchedAt: now(), apps };
      return apps;
    } catch (err) {
      console.error("Couldn't refresh App Store apps:", err.message);
      return cache.apps; // possibly empty, on a cold start with no network
    }
  }

  return { getPublishedApps };
}

const defaultStore = createAppStore();
export const getPublishedApps = () => defaultStore.getPublishedApps();

// An empty list means Apple couldn't be reached on a cold start; don't let
// the CDN hold onto that for the full 10 minutes.
export function appstoreCacheControl(apps) {
  return apps.length ? "public, max-age=0, s-maxage=600" : "no-store";
}
