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

test("onStep reports a trace that reconstructs the same maze", () => {
  const width = 4;
  const height = 4;
  const steps = [];
  const maze = generateMaze(width, height, seededRng(11), (step) => steps.push(step));

  expect(steps[0].type).toBe("start");
  expect(steps.at(-1).type).toBe("done");
  expect(steps.some((s) => s.type === "walk-start")).toBe(true);
  expect(steps.some((s) => s.type === "walk-step")).toBe(true);
  expect(steps.some((s) => s.type === "carve")).toBe(true);

  // Replaying every carved path against a blank grid should reproduce
  // exactly the walls the non-traced run carved.
  const replayed = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({
      walls: { top: true, right: true, bottom: true, left: true },
    }))
  );
  const dirByDelta = (dx, dy) =>
    [
      { name: "top", dx: 0, dy: -1, opposite: "bottom" },
      { name: "right", dx: 1, dy: 0, opposite: "left" },
      { name: "bottom", dx: 0, dy: 1, opposite: "top" },
      { name: "left", dx: -1, dy: 0, opposite: "right" },
    ].find((d) => d.dx === dx && d.dy === dy);
  for (const step of steps) {
    if (step.type !== "carve") continue;
    for (let i = 0; i < step.path.length - 1; i++) {
      const a = step.path[i];
      const b = step.path[i + 1];
      const dir = dirByDelta(b.x - a.x, b.y - a.y);
      replayed[a.y][a.x].walls[dir.name] = false;
      replayed[b.y][b.x].walls[dir.opposite] = false;
    }
  }
  expect(replayed).toEqual(maze.cells);
});

test("omitting onStep does not change the generated maze", () => {
  const a = generateMaze(5, 5, seededRng(23));
  const steps = [];
  const b = generateMaze(5, 5, seededRng(23), (step) => steps.push(step));
  expect(a.cells).toEqual(b.cells);
});
