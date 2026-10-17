import { test, expect } from "bun:test";
import { validDevApps, findDevApp, publicDevApps, DEV_SLUGS_TO_SHOW } from "./dev-apps.js";

const app = (slug) => ({ slug, name: slug, status: "In development" });

test("validDevApps keeps well-formed slugs only", () => {
  const list = [app("the-relay"), app("bad slug"), app("../etc"), { name: "no slug" }, null, app("ok-2")];
  expect(validDevApps(list).map((a) => a.slug)).toEqual(["the-relay", "ok-2"]);
});

test("validDevApps drops slugs that a fixed route or landing page already owns", () => {
  const list = ["home", "privacy", "terms", "style-guide", "app-store", "api", "assets", "drinko", "nine-tiles-puzzle"]
    .map(app)
    .concat(app("fresh"));
  expect(validDevApps(list).map((a) => a.slug)).toEqual(["fresh"]);
});

test("validDevApps treats a non-array as empty", () => {
  expect(validDevApps({ slug: "x" })).toEqual([]);
});

test("findDevApp finds by exact slug among valid apps only", () => {
  const list = [app("the-relay"), app("drinko")];
  expect(findDevApp("the-relay", list).slug).toBe("the-relay");
  expect(findDevApp("drinko", list)).toBeUndefined();
  expect(findDevApp("THE-RELAY", list)).toBeUndefined();
});

test("publicDevApps is the shown subset, in apps.json order", () => {
  const list = [app("hidden"), app("the-relay"), ...DEV_SLUGS_TO_SHOW.map(app)];
  const shown = publicDevApps(list).map((a) => a.slug);
  expect(shown).toEqual(list.map((a) => a.slug).filter((slug) => DEV_SLUGS_TO_SHOW.includes(slug)));
  expect(shown).not.toContain("hidden");
});

test("the real data/apps.json parses and has the relay page", () => {
  expect(findDevApp("the-relay")).toBeDefined();
});
