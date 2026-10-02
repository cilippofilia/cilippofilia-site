// /api/appstore-apps on Netlify — the same live App Store lookup server.js
// serves locally, shared from src/server/appstore.js.

import appstore from "../../src/server/appstore.js";

export default async () => {
  const apps = await appstore.getPublishedApps();
  return Response.json(apps, {
    headers: { "Cache-Control": "public, max-age=0, s-maxage=600" },
  });
};

export const config = { path: "/api/appstore-apps" };
