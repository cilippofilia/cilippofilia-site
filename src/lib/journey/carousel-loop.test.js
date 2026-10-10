import { test, expect } from "bun:test";
import { photoAt, settleJump } from "./carousel-loop.js";

test("the copies at either end show the photo they copy", () => {
  // Three photos: positions 0…4 are [copy of 3rd, 1st, 2nd, 3rd, copy of 1st].
  expect([0, 1, 2, 3, 4].map((k) => photoAt(k, 3))).toEqual([2, 0, 1, 2, 0]);
});

test("settling on a copy jumps to the real photo; a real photo stays put", () => {
  expect(settleJump(0, 3)).toBe(3);
  expect(settleJump(4, 3)).toBe(1);
  expect(settleJump(1, 3)).toBeNull();
  expect(settleJump(3, 3)).toBeNull();
});

test("two photos loop the same way", () => {
  expect([0, 1, 2, 3].map((k) => photoAt(k, 2))).toEqual([1, 0, 1, 0]);
  expect(settleJump(0, 2)).toBe(2);
  expect(settleJump(3, 2)).toBe(1);
});
