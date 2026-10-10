import { test, expect } from "bun:test";
import { activeCard } from "./card-rail.js";

// Four 300px cards with 16px gaps in a row that scrolls up to 632px.
const lefts = [0, 316, 632, 948];

test("the card whose left edge is nearest the scroll position is lit", () => {
  expect(activeCard(lefts, 0, 632)).toBe(0);
  expect(activeCard(lefts, 300, 632)).toBe(1);
});

test("scrolled to the end, the last card is lit even though it can't reach the left edge", () => {
  expect(activeCard(lefts, 632, 632)).toBe(3);
  expect(activeCard(lefts, 631.5, 632)).toBe(3);
});

test("a row that doesn't scroll lights its first card", () => {
  expect(activeCard([0, 316], 0, 0)).toBe(0);
});

test("an empty row has no lit card", () => {
  expect(activeCard([], 0, 0)).toBe(-1);
});
