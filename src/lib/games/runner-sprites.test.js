import { test, expect } from "bun:test";
import { CHARACTERS, OBSTACLES, PALETTE } from "./runner-sprites.js";

// The sprites are hand-edited strings, so these catch the two easy slips:
// a row one character short (which skews everything under it) and a letter
// with no colour (which draws as magenta).

const letters = (frame) => new Set(frame.join("").replaceAll(".", ""));

test("every frame's rows are all the same width", () => {
  const frames = [
    ...Object.values(CHARACTERS).flatMap((c) => Object.values(c.frames).flat()),
    ...Object.values(OBSTACLES).flat(),
  ];
  for (const frame of frames) {
    expect(new Set(frame.map((row) => row.length)).size).toBe(1);
  }
});

test("every letter a skater uses has a colour in its palette", () => {
  for (const [key, character] of Object.entries(CHARACTERS)) {
    for (const frame of Object.values(character.frames).flat()) {
      for (const letter of letters(frame)) {
        expect(`${key}:${letter}:${character.palette[letter] ? "ok" : "missing"}`).toBe(`${key}:${letter}:ok`);
      }
    }
  }
});

test("every letter an obstacle uses has a colour in the shared palette", () => {
  for (const frame of Object.values(OBSTACLES).flat()) {
    for (const letter of letters(frame)) expect(PALETTE[letter]).toBeString();
  }
});

test("every skater has two ride frames and a jump, duck and crash frame", () => {
  for (const character of Object.values(CHARACTERS)) {
    expect(character.frames.ride).toHaveLength(2);
    expect(character.frames.jump).toHaveLength(1);
    expect(character.frames.duck).toHaveLength(1);
    expect(character.frames.crash).toHaveLength(1);
  }
});
