import { test, expect } from "bun:test";
import { claimKeys, releaseKeys, keysClaimedByOther } from "./active-game.js";

test("a claim blocks other games until it's released", () => {
  expect(keysClaimedByOther("maze")).toBe(false);
  claimKeys("runner");
  expect(keysClaimedByOther("maze")).toBe(true);
  expect(keysClaimedByOther("runner")).toBe(false);
  releaseKeys("runner");
  expect(keysClaimedByOther("maze")).toBe(false);
});

test("only the claimant can release a claim", () => {
  claimKeys("runner");
  releaseKeys("maze");
  expect(keysClaimedByOther("maze")).toBe(true);
  releaseKeys("runner");
});
