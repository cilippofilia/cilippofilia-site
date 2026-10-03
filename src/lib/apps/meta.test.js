import { test, expect } from "bun:test";
import { appPageMeta } from "./meta.js";

const relay = {
  slug: "the-relay",
  name: "relay",
  tagline: "An analog signal-sorting mystery.",
  description: "A decommissioned coastal relay station.",
  platforms: ["iPhone", "iPad", "Mac"],
  status: "In development",
  icon: "/assets/app-icons/thumb/relay-icon.png",
  appStoreUrl: "",
};

test("appPageMeta gives each app its own title, description, canonical and image", () => {
  expect(appPageMeta(relay)).toEqual({
    title: "relay · cilippofilia.dev",
    description: "An analog signal-sorting mystery.",
    url: "https://cilippofilia.dev/the-relay",
    image: "https://cilippofilia.dev/assets/app-icons/thumb/relay-icon.png",
  });
});

test("appPageMeta falls back to the site image for an emoji icon", () => {
  expect(appPageMeta({ ...relay, icon: "✨" }).image).toBe("https://cilippofilia.dev/assets/profile.jpg");
});
