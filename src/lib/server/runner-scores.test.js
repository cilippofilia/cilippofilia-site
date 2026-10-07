import { test, expect } from "bun:test";
import { getTop, submitEntry, MAX_SCORE } from "./runner-scores.js";

// Scores near the cap and unique to each test, so other rows in the shared
// test db never outrank or mix with the ones a test inserts.
let next = MAX_SCORE - 1000;
const uniqueScore = () => (next -= 10);

test("submitEntry records a run that getTop then reports, highest first", () => {
  const low = uniqueScore();
  const high = low + 5;
  submitEntry(low, "pip");
  submitEntry(high, "kit");
  const mine = getTop(50).filter((entry) => entry.score === low || entry.score === high);
  expect(mine).toEqual([
    { score: high, skater: "kit" },
    { score: low, skater: "pip" },
  ]);
});

test("getTop gives a tie to the earlier run", () => {
  const score = uniqueScore();
  submitEntry(score, "cappy");
  submitEntry(score, "nori");
  expect(getTop(50).filter((entry) => entry.score === score)).toEqual([
    { score, skater: "cappy" },
    { score, skater: "nori" },
  ]);
});

test("submitEntry ignores fractional, non-positive and over-cap scores", () => {
  const before = getTop(1000).length;
  for (const junk of [12.5, 0, -3, NaN, "40", MAX_SCORE + 1]) submitEntry(junk, "ollie");
  expect(getTop(1000).length).toBe(before);
});

test("an unknown skater is saved as Ollie", () => {
  const score = uniqueScore();
  submitEntry(score, "<script>");
  submitEntry(score - 1, "toString");
  const mine = getTop(50).filter((entry) => entry.score === score || entry.score === score - 1);
  expect(mine.map((entry) => entry.skater)).toEqual(["ollie", "ollie"]);
});
