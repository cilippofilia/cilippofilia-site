import { test, expect } from "bun:test";
import { createAppStore, toApp, appstoreCacheControl } from "./appstore.js";

const result = {
  wrapperType: "software",
  trackId: 6449893371,
  trackName: "Drinko: Cocktail Recipes",
  description: "Make cocktails.\nMore text",
  artworkUrl100: "https://is1-ssl.mzstatic.com/x/100x100bb.jpg",
  trackViewUrl: "https://apps.apple.com/app/id6449893371",
  primaryGenreName: "Food & Drink",
  releaseDate: "2023-05-01T00:00:00Z",
};

const ok = (results) => async () => new Response(JSON.stringify({ results }));

test("toApp maps a lookup result and links custom landing pages", () => {
  expect(toApp(result)).toEqual({
    id: 6449893371,
    name: "Drinko: Cocktail Recipes",
    tagline: "Make cocktails.",
    icon: "https://is1-ssl.mzstatic.com/x/512x512bb.jpg",
    url: "https://apps.apple.com/app/id6449893371",
    genre: "Food & Drink",
    releaseDate: "2023-05-01T00:00:00Z",
    localUrl: "/drinko",
  });
  expect(toApp({ ...result, trackId: 1 }).localUrl).toBeNull();
});

test("getPublishedApps keeps software results only", async () => {
  const store = createAppStore({ fetchImpl: ok([{ wrapperType: "artist" }, result]) });
  expect((await store.getPublishedApps()).map((a) => a.id)).toEqual([6449893371]);
});

test("a fresh cache is served without refetching", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls++;
    return new Response(JSON.stringify({ results: [result] }));
  };
  let t = 0;
  const store = createAppStore({ fetchImpl, now: () => t });
  await store.getPublishedApps();
  t = 9 * 60 * 1000;
  await store.getPublishedApps();
  expect(calls).toBe(1);
  t = 11 * 60 * 1000;
  await store.getPublishedApps();
  expect(calls).toBe(2);
});

test("a failed refresh serves the last good result", async () => {
  let fail = false;
  const fetchImpl = async () => {
    if (fail) throw new Error("offline");
    return new Response(JSON.stringify({ results: [result] }));
  };
  let t = 0;
  const store = createAppStore({ fetchImpl, now: () => t });
  await store.getPublishedApps();
  fail = true;
  t = 60 * 60 * 1000;
  expect((await store.getPublishedApps()).length).toBe(1);
});

test("a cold start with Apple unreachable gives an empty list", async () => {
  const store = createAppStore({ fetchImpl: async () => new Response("<html>", { status: 503 }) });
  expect(await store.getPublishedApps()).toEqual([]);
});

test("an empty list is never cached by the CDN", () => {
  expect(appstoreCacheControl([])).toBe("no-store");
  expect(appstoreCacheControl([{}])).toBe("public, max-age=0, s-maxage=600");
});
