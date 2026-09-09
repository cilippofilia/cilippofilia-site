import { test, expect } from "bun:test";
import { escapeHtml } from "./html.js";

test("escapeHtml neutralises the five HTML metacharacters", () => {
  expect(escapeHtml(`<a href="x">Tom & Jerry's</a>`)).toBe(
    "&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;"
  );
});

test("escapeHtml turns null and undefined into an empty string and numbers into text", () => {
  expect(escapeHtml(null)).toBe("");
  expect(escapeHtml(undefined)).toBe("");
  expect(escapeHtml(42)).toBe("42");
});
