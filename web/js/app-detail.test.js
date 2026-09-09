import { test, expect } from "bun:test";
import { renderAppDetail, renderNotFound } from "./app-detail.js";

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

test("renderAppDetail lays out icon, badge, copy, platforms and a disabled store button", () => {
  const html = renderAppDetail(relay);
  expect(html).toContain('<img class="icon-lg icon-img" src="/assets/app-icons/thumb/relay-icon.png"');
  expect(html).toContain('<span class="badge dev">In development</span>');
  expect(html).toContain("<h1>relay</h1>");
  expect(html).toContain('<p class="lede">An analog signal-sorting mystery.</p>');
  expect(html).toContain('<span class="chip">iPhone</span><span class="chip">iPad</span><span class="chip">Mac</span>');
  expect(html).toContain("Not yet published");
  expect(html).not.toContain("View on the App Store");
});

test("renderAppDetail links to the App Store when a URL is present and uses an emoji plate otherwise", () => {
  const html = renderAppDetail({ ...relay, icon: "✨", appStoreUrl: "https://apps.apple.com/x" });
  expect(html).toContain('<span class="icon-lg">✨</span>');
  expect(html).toContain('<a class="button" href="https://apps.apple.com/x">View on the App Store</a>');
});

test("renderAppDetail escapes its inputs", () => {
  const html = renderAppDetail({ ...relay, name: "<b>x</b>", platforms: ["<i>"] });
  expect(html).toContain("<h1>&lt;b&gt;x&lt;/b&gt;</h1>");
  expect(html).toContain('<span class="chip">&lt;i&gt;</span>');
});

test("renderNotFound names the slug and escapes it", () => {
  const html = renderNotFound("<nope>");
  expect(html).toContain("Nothing here yet");
  expect(html).toContain("<code>/&lt;nope&gt;</code>");
});
