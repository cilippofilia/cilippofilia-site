import { test, expect } from "bun:test";
import { splitName, isImageIcon } from "./names.js";

test("splitName separates a title from its subtitle", () => {
  expect(splitName("Drinko: Cocktail Recipes")).toEqual({ title: "Drinko", subtitle: "Cocktail Recipes" });
  expect(splitName("relay")).toEqual({ title: "relay", subtitle: "" });
  expect(splitName(undefined)).toEqual({ title: "", subtitle: "" });
});

test("isImageIcon tells a path or URL from an emoji", () => {
  expect(isImageIcon("/assets/x.png")).toBe(true);
  expect(isImageIcon("https://is1-ssl.mzstatic.com/x.png")).toBe(true);
  expect(isImageIcon("🍸")).toBe(false);
  expect(isImageIcon(undefined)).toBe(false);
});
