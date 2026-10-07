import { test, expect } from "bun:test";
import { buildAppsBlock, findUpcoming, formatReleaseDate, publishedCard, devCard } from "./feed.js";
import { PROVIDER_TOKEN } from "./campaign.js";

const now = new Date("2026-10-02T12:00:00Z");
const live = {
  id: 1,
  name: "Drinko: Cocktail Recipes",
  tagline: "Cocktails.",
  icon: "/d.png",
  url: "https://apps.apple.com/d",
  genre: "Food",
  releaseDate: "2023-01-01T00:00:00Z",
  localUrl: "/drinko",
};
const preorder = {
  ...live,
  id: 2,
  name: "9 Tiles Puzzle",
  releaseDate: "2026-12-01T00:00:00Z",
  localUrl: "/nine-tiles-puzzle",
};
const relay = {
  slug: "the-relay",
  name: "relay",
  status: "In development",
  tagline: "Mystery.",
  icon: "/r.png",
  appStoreUrl: "",
};

test("findUpcoming picks the app whose release date is still ahead", () => {
  expect(findUpcoming([live, preorder], now)).toBe(preorder);
  expect(findUpcoming([live], now)).toBeUndefined();
});

test("publishedCard and devCard normalise both feeds to card props", () => {
  expect(publishedCard(live)).toEqual({
    status: "Live",
    websiteUrl: "/drinko",
    appStoreUrl: `https://apps.apple.com/d?pt=${PROVIDER_TOKEN}&ct=site-home`,
    icon: "/d.png",
    name: "Drinko: Cocktail Recipes",
    badge: "Live",
    badgeStyle: "live",
    tagline: "Cocktails.",
  });
  expect(publishedCard({ ...live, tagline: "" }).tagline).toBe("Food");
  expect(devCard(relay)).toEqual({
    status: "In development",
    websiteUrl: "/the-relay",
    appStoreUrl: "",
    icon: "/r.png",
    name: "relay",
    badge: "In development",
    badgeStyle: "dev",
    tagline: "Mystery.",
  });
});

test("buildAppsBlock pulls the preorder out of the grid and sorts the rest by status", () => {
  const { upcoming, cards } = buildAppsBlock([live, preorder], [relay], now);
  expect(upcoming).toBe(preorder);
  expect(cards.map((c) => c.name)).toEqual(["Drinko: Cocktail Recipes", "relay"]);
});

test("buildAppsBlock with both feeds empty has nothing to show", () => {
  expect(buildAppsBlock([], [], now)).toEqual({ upcoming: undefined, cards: [] });
});

test("buildAppsBlock tolerates non-array feeds", () => {
  expect(buildAppsBlock(null, undefined, now)).toEqual({ upcoming: undefined, cards: [] });
});

test("formatReleaseDate is en-GB", () => {
  expect(formatReleaseDate("2026-09-28T00:00:00Z")).toBe("28 Sep 2026");
});
