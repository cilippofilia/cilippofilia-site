import { test, expect } from "bun:test";
import { move } from "./maze-move.js";

function twoCellMaze() {
  return {
    width: 2,
    height: 1,
    cells: [
      [
        { walls: { top: true, right: false, bottom: true, left: true } },
        { walls: { top: true, right: true, bottom: true, left: false } },
      ],
    ],
  };
}

test("moves through an open passage", () => {
  expect(move(twoCellMaze(), 0, 0, "right")).toEqual({ x: 1, y: 0 });
});

test("is blocked by a wall", () => {
  expect(move(twoCellMaze(), 0, 0, "top")).toBeNull();
});

test("is blocked at the grid edge", () => {
  expect(move(twoCellMaze(), 1, 0, "right")).toBeNull();
});
