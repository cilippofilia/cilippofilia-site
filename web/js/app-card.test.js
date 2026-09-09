import { test, expect } from "bun:test";
import { appCard, splitName } from "./app-card.js";

test("splitName separates a title from its subtitle", () => {
  expect(splitName("Drinko: Cocktail Recipes")).toEqual({
    title: "Drinko",
    subtitle: "Cocktail Recipes",
  });
  expect(splitName("relay")).toEqual({ title: "relay", subtitle: "" });
});

test("a published card links to both its landing page and the App Store", () => {
  const html = appCard({
    websiteUrl: "/drinko",
    appStoreUrl: "https://apps.apple.com/app/id6449893371",
    icon: "/icon.png",
    name: "Drinko: Cocktail Recipes",
    badge: "Live",
    badgeStyle: "live",
    tagline: "Cocktails.",
  });
  expect(html).not.toContain('<a class="card"');
  expect(html).toContain('href="/drinko"');
  expect(html).toContain('href="https://apps.apple.com/app/id6449893371"');
  expect(html).toContain('target="_blank"');
  expect(html).toContain(">Website<");
  expect(html).toContain(">App Store<");
});

test("an unpublished card shows a disabled App Store button", () => {
  const html = appCard({
    websiteUrl: "/the-relay",
    appStoreUrl: "",
    name: "relay",
    badge: "In development",
    badgeStyle: "dev",
  });
  expect(html).toContain('href="/the-relay"');
  expect(html).toContain("disabled");
  expect(html).not.toContain('target="_blank"');
});

test("a card with no landing page omits the Website button", () => {
  const html = appCard({
    websiteUrl: null,
    appStoreUrl: "https://apps.apple.com/x",
    name: "X",
    badge: "Live",
    badgeStyle: "live",
  });
  expect(html).not.toContain(">Website<");
  expect(html).toContain(">App Store<");
});
