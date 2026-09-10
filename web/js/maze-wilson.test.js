import { test, expect } from "bun:test";
import { generateMaze } from "./maze-wilson.js";

// A tiny seeded PRNG so tests are deterministic regardless of Math.random.
function seededRng(seed) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

test("returns a grid with the requested dimensions", () => {
  const maze = generateMaze(5, 3, seededRng(1));
  expect(maze.width).toBe(5);
  expect(maze.height).toBe(3);
  expect(maze.cells.length).toBe(3);
  expect(maze.cells[0].length).toBe(5);
});

test("every cell is reachable from the entrance", () => {
  const maze = generateMaze(6, 6, seededRng(42));
  const { width, height, cells } = maze;
  const visited = new Set();
  const stack = [[0, 0]];
  visited.add("0,0");
  while (stack.length) {
    const [x, y] = stack.pop();
    const cell = cells[y][x];
    const neighbors = [
      !cell.walls.top && [x, y - 1],
      !cell.walls.right && [x + 1, y],
      !cell.walls.bottom && [x, y + 1],
      !cell.walls.left && [x - 1, y],
    ].filter(Boolean);
    for (const [nx, ny] of neighbors) {
      const k = `${nx},${ny}`;
      if (!visited.has(k)) {
        visited.add(k);
        stack.push([nx, ny]);
      }
    }
  }
  expect(visited.size).toBe(width * height);
});

test("carves exactly width*height - 1 passages, forming a tree with no loops", () => {
  const width = 5;
  const height = 4;
  const maze = generateMaze(width, height, seededRng(7));
  let passages = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = maze.cells[y][x];
      if (!cell.walls.right && x < width - 1) passages++;
      if (!cell.walls.bottom && y < height - 1) passages++;
    }
  }
  expect(passages).toBe(width * height - 1);
});

test("is deterministic for a given rng sequence", () => {
  const a = generateMaze(4, 4, seededRng(99));
  const b = generateMaze(4, 4, seededRng(99));
  expect(a.cells).toEqual(b.cells);
});

test("handles a single cell maze without crashing", () => {
  const maze = generateMaze(1, 1, seededRng(3));
  expect(maze.cells[0][0].walls).toEqual({ top: true, right: true, bottom: true, left: true });
});
