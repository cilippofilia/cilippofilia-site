import { test, expect } from "bun:test";
import { MAX_PULL, PULL_THRESHOLD, canStartPull, pullDistance, pullState } from "./pull-to-refresh.js";

test("a pull only starts from the very top, on touch, outside the games, with one finger", () => {
  const ok = { scrollY: 0, coarse: true, insideGame: false, touches: 1 };
  expect(canStartPull(ok)).toBe(true);
  expect(canStartPull({ ...ok, scrollY: 1 })).toBe(false);
  expect(canStartPull({ ...ok, coarse: false })).toBe(false);
  expect(canStartPull({ ...ok, insideGame: true })).toBe(false);
  expect(canStartPull({ ...ok, touches: 2 })).toBe(false);
});

test("an old Safari's negative scrollY at the top still counts as the top", () => {
  expect(canStartPull({ scrollY: -12, coarse: true, insideGame: false, touches: 1 })).toBe(true);
});

test("dragging up or not at all is no pull", () => {
  expect(pullDistance(0)).toBe(0);
  expect(pullDistance(-40)).toBe(0);
});

test("the pull gets heavier the further it goes and never passes the maximum", () => {
  const a = pullDistance(50);
  const b = pullDistance(100);
  const c = pullDistance(2000);
  expect(a).toBeGreaterThan(0);
  expect(a).toBeLessThan(50);
  expect(b - a).toBeLessThan(a);
  expect(c).toBeLessThanOrEqual(MAX_PULL);
  expect(c).toBeGreaterThan(MAX_PULL - 1);
});

test("a long enough drag reaches the threshold", () => {
  expect(pullDistance(200)).toBeGreaterThanOrEqual(PULL_THRESHOLD);
});

test("pullState arms once the damped distance reaches the threshold", () => {
  expect(pullState(0)).toBe("idle");
  expect(pullState(PULL_THRESHOLD - 0.5)).toBe("pulling");
  expect(pullState(PULL_THRESHOLD)).toBe("armed");
  expect(pullState(MAX_PULL)).toBe("armed");
});
