import { test, expect } from "bun:test";
import { getTop, submitEntry } from "./maze-scores.js";

test("submitEntry records a run that getTop then reports", () => {
  // A moves count unlikely to collide with rows other tests (or other test
  // files sharing this dev db) insert, so filtering by it isolates our row.
  const timeMs = 2;
  const moves = Date.now() % 100000;
  submitEntry(timeMs, moves);
  expect(getTop(50).filter((entry) => entry.moves === moves)).toEqual([{ timeMs, moves }]);
});

test("getTop breaks a time tie by fewer moves", () => {
  // A timeMs unlikely to already exist in the shared dev db, so the two
  // rows we insert here are each other's only tiebreak competition.
  const timeMs = Date.now();
  submitEntry(timeMs, 40);
  submitEntry(timeMs, 12);

  const tied = getTop(50).filter((entry) => entry.timeMs === timeMs);
  expect(tied).toEqual([
    { timeMs, moves: 12 },
    { timeMs, moves: 40 },
  ]);
});

test("submitEntry ignores a non-finite or non-positive time", () => {
  const before = getTop(50).length;
  submitEntry(NaN, 5);
  submitEntry(0, 5);
  submitEntry(-10, 5);
  expect(getTop(50).length).toBe(before);
});
