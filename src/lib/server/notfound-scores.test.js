import { test, expect } from "bun:test";
import { getBest, submitScore } from "./notfound-scores.js";

test("submitScore only ever raises the best", () => {
  const start = getBest();
  expect(submitScore(start + 5)).toBe(start + 5);
  expect(submitScore(start + 1)).toBe(start + 5);
  expect(getBest()).toBe(start + 5);
});

test("submitScore ignores junk and floors fractions", () => {
  const start = getBest();
  expect(submitScore(NaN)).toBe(start);
  expect(submitScore(-3)).toBe(start);
  expect(submitScore(start + 2.9)).toBe(start + 2);
});
