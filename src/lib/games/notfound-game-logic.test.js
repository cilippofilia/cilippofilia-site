import { test, expect } from "bun:test";
import {
  DIFFICULTY_RAMP_MS,
  MISS_LIMIT,
  CHIP_LIFETIME_START_MS,
  CHIP_LIFETIME_END_MS,
  createGameState,
  startRound,
  registerHit,
  registerMiss,
  chipLifetimeMs,
  randomPath,
  resultFlavor,
  bestLineText,
} from "./notfound-game-logic.js";

test("a fresh game starts idle with no score", () => {
  expect(createGameState()).toEqual({ status: "idle", score: 0, misses: 0, startedAt: null });
});

test("starting a round resets score/misses and records the start time", () => {
  expect(startRound(1000)).toEqual({ status: "playing", score: 0, misses: 0, startedAt: 1000 });
});

test("a hit only counts while the round is playing", () => {
  const playing = startRound(0);
  expect(registerHit(playing).score).toBe(1);

  const idle = createGameState();
  expect(registerHit(idle)).toEqual(idle);
});

test("misses accumulate and end the round once the limit is reached", () => {
  let state = startRound(0);
  for (let i = 0; i < MISS_LIMIT - 1; i++) {
    state = registerMiss(state);
    expect(state.status).toBe("playing");
  }
  state = registerMiss(state);
  expect(state.status).toBe("ended");
  expect(state.misses).toBe(MISS_LIMIT);
});

test("a miss after the round has ended is a no-op", () => {
  const ended = { status: "ended", score: 3, misses: MISS_LIMIT, startedAt: 0 };
  expect(registerMiss(ended)).toEqual(ended);
});

test("chip lifetime ramps down from start to end, then holds at the floor", () => {
  const playing = startRound(0);
  expect(chipLifetimeMs(playing, 0)).toBe(CHIP_LIFETIME_START_MS);
  expect(chipLifetimeMs(playing, DIFFICULTY_RAMP_MS)).toBe(CHIP_LIFETIME_END_MS);
  const mid = chipLifetimeMs(playing, DIFFICULTY_RAMP_MS / 2);
  expect(mid).toBeLessThan(CHIP_LIFETIME_START_MS);
  expect(mid).toBeGreaterThan(CHIP_LIFETIME_END_MS);
  // Play continues indefinitely past the ramp — lifetime just stays at the floor.
  expect(chipLifetimeMs(playing, DIFFICULTY_RAMP_MS * 5)).toBe(CHIP_LIFETIME_END_MS);
});

test("randomPath picks from its fake-path list via the injected rng", () => {
  expect(randomPath(() => 0)).toBe("/blog/2019/old-post");
  expect(randomPath(() => 0.999)).toBe("/api/deprecated");
});

test("bestLineText is blank when there's no best on record", () => {
  expect(bestLineText(0, 0)).toBe("");
  expect(bestLineText(3, 0)).toBe("");
});

test("bestLineText announces a new best when this round matched it", () => {
  expect(bestLineText(5, 5)).toBe("New best!");
});

test("bestLineText otherwise reports the standing best", () => {
  expect(bestLineText(2, 8)).toBe("Best: 8");
  expect(bestLineText(0, 8)).toBe("Best: 8");
});

test("resultFlavor returns a line for every score tier", () => {
  expect(resultFlavor(0)).toBe("Even the void didn't want these.");
  expect(resultFlavor(2)).toBe("A start. Barely.");
  expect(resultFlavor(5)).toBe("Not bad for a page that doesn't exist.");
  expect(resultFlavor(9)).toBe("You've got a nose for broken links.");
  expect(resultFlavor(20)).toBe("At this point, you're the broken one.");
});
