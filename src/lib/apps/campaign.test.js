import { test, expect } from "bun:test";
import { campaignUrl, PROVIDER_TOKEN } from "./campaign.js";

test("campaignUrl adds the provider and campaign tokens", () => {
  expect(campaignUrl("https://apps.apple.com/app/id6449893371", "site-drinko")).toBe(
    `https://apps.apple.com/app/id6449893371?pt=${PROVIDER_TOKEN}&ct=site-drinko`
  );
});

test("campaignUrl keeps Apple's existing query parameters", () => {
  expect(campaignUrl("https://apps.apple.com/us/app/drinko/id6449893371?uo=4", "site-home")).toBe(
    `https://apps.apple.com/us/app/drinko/id6449893371?uo=4&pt=${PROVIDER_TOKEN}&ct=site-home`
  );
});

test("campaignUrl replaces a campaign token rather than adding a second one", () => {
  const once = campaignUrl("https://apps.apple.com/app/id1", "site-home");
  expect(campaignUrl(once, "site-drinko")).toBe(`https://apps.apple.com/app/id1?pt=${PROVIDER_TOKEN}&ct=site-drinko`);
});

test("campaignUrl leaves empty and unparseable URLs alone", () => {
  expect(campaignUrl("", "site-home")).toBe("");
  expect(campaignUrl(undefined, "site-home")).toBeUndefined();
  expect(campaignUrl("not a url", "site-home")).toBe("not a url");
});
