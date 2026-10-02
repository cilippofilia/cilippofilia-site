import { test, expect } from "bun:test";
import path from "node:path";
import { devAppRedirects, findCustomSiteSlugs } from "./netlify.js";

test("each in-development app gets a rewrite to the app template", () => {
  const lines = devAppRedirects([{ slug: "the-relay" }, { slug: "running-plan" }], []);
  expect(lines).toEqual(["/the-relay  /app.html  200", "/running-plan  /app.html  200"]);
});

test("slugs the router would route elsewhere first are skipped", () => {
  const apps = [{ slug: "home" }, { slug: "css" }, { slug: "drinko" }, { slug: "kept" }];
  expect(devAppRedirects(apps, ["drinko"])).toEqual(["/kept  /app.html  200"]);
});

test("entries without a clean slug are skipped", () => {
  const apps = [null, {}, { slug: 42 }, { slug: "../etc" }, { slug: "a/b" }, { slug: "ok-1" }];
  expect(devAppRedirects(apps, [])).toEqual(["/ok-1  /app.html  200"]);
});

test("custom app sites are the web/ folders with their own index.html", () => {
  const slugs = findCustomSiteSlugs(path.join(import.meta.dir, "..", "..", "web"));
  expect(slugs).toContain("nine-tiles-puzzle");
  expect(slugs).not.toContain("css");
});
