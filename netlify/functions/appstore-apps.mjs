// /api/appstore-apps on Netlify — the same live App Store lookup the local
// router serves, shared from src/server/appstore.js.

import appstore from "../../src/server/appstore.js";

export default async () => {
  const apps = await appstore.getPublishedApps();
  // An empty list means Apple couldn't be reached on a cold start; don't let
  // the CDN hold onto that for the full 10 minutes.
  const cacheControl = apps.length ? "public, max-age=0, s-maxage=600" : "no-store";
  return Response.json(apps, { headers: { "Cache-Control": cacheControl } });
};

export const config = { path: "/api/appstore-apps" };
