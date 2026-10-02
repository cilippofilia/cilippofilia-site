import { json } from "@sveltejs/kit";
import { getPublishedApps, appstoreCacheControl } from "#lib/server/appstore.js";

// Live from Apple on every request (behind appstore.js's cache), so this
// one runs as a Netlify Function rather than being prerendered.
export const prerender = false;

export async function GET() {
  const apps = await getPublishedApps();
  return json(apps, { headers: { "Cache-Control": appstoreCacheControl(apps) } });
}
