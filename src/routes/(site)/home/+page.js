import { publicDevApps } from "#lib/apps/dev-apps.js";

export function load() {
  return { devApps: publicDevApps() };
}
