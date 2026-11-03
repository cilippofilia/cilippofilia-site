import { test, expect } from "bun:test";
import { PERSON, appSchema, jsonLdTag } from "./structured-data.js";

test("jsonLdTag escapes < so a value can't close the script tag", () => {
  const tag = jsonLdTag({ name: "</script><b>x" });
  expect(tag.startsWith('<script type="application/ld+json">')).toBe(true);
  expect(tag.match(/<\/script>/g)).toHaveLength(1);
  const json = tag.slice(tag.indexOf(">") + 1, -"</script>".length);
  expect(JSON.parse(json).name).toBe("</script><b>x");
});

test("appSchema credits the app to the person", () => {
  const app = appSchema({
    name: "Drinko",
    description: "d",
    slug: "drinko",
    appStoreId: "6449893371",
    category: "LifestyleApplication",
    operatingSystem: "iOS, iPadOS, macOS",
  });
  expect(app.author["@id"]).toBe(PERSON["@id"]);
  expect(app.url).toBe("https://cilippofilia.dev/drinko/");
  expect(app.downloadUrl).toBe("https://apps.apple.com/app/id6449893371");
});
