import { test, expect } from "bun:test";
import { sitemapPaths } from "./site-pages.js";

test("the sitemap lists every public page, matching the old hand-kept file", () => {
  expect(sitemapPaths()).toEqual([
    "https://cilippofilia.dev/home",
    "https://cilippofilia.dev/privacy",
    "https://cilippofilia.dev/terms",
    "https://cilippofilia.dev/drinko/",
    "https://cilippofilia.dev/drinko/privacy-policy.html",
    "https://cilippofilia.dev/iterly/",
    "https://cilippofilia.dev/iterly/privacy-policy.html",
    "https://cilippofilia.dev/itswritten/",
    "https://cilippofilia.dev/itswritten/privacy-policy.html",
    "https://cilippofilia.dev/nine-tiles-puzzle/",
    "https://cilippofilia.dev/nine-tiles-puzzle/privacy-policy.html",
    "https://cilippofilia.dev/the-relay",
  ]);
});
