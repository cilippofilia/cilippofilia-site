// Maze generation via Wilson's algorithm (loop-erased random walk), which
// produces a uniformly random spanning tree over the grid — every possible
// maze is equally likely, unlike biased generators such as recursive
// backtracking. See https://medium.com/@batu.senturk/the-ultimate-unbiased-maze-generation-technique-you-need-to-see-46123d5fec76
//
// `rng` is injectable so tests can seed it; defaults to Math.random.
// `onStep` is an optional callback invoked at each semantic checkpoint of
// the algorithm (see the `type` values below) — used by maze-explainer.js to
// build a step-through walkthrough. It costs nothing when omitted, so the
// real game's generation is unaffected.

const DIRECTIONS = [
  { name: "top", dx: 0, dy: -1, opposite: "bottom" },
  { name: "right", dx: 1, dy: 0, opposite: "left" },
  { name: "bottom", dx: 0, dy: 1, opposite: "top" },
  { name: "left", dx: -1, dy: 0, opposite: "right" },
];

function inBounds(x, y, width, height) {
  return x >= 0 && x < width && y >= 0 && y < height;
}

function pickRandomDirection(x, y, width, height, rng) {
  let dir;
  do {
    dir = DIRECTIONS[Math.floor(rng() * DIRECTIONS.length)];
  } while (!inBounds(x + dir.dx, y + dir.dy, width, height));
  return dir;
}

export function generateMaze(width, height, rng = Math.random, onStep) {
  const cells = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({
      walls: { top: true, right: true, bottom: true, left: true },
    }))
  );

  const key = (x, y) => y * width + x;
  const inMaze = new Set();

  const startX = Math.floor(rng() * width);
  const startY = Math.floor(rng() * height);
  inMaze.add(key(startX, startY));
  onStep?.({ type: "start", cell: { x: startX, y: startY } });

  const totalCells = width * height;
  while (inMaze.size < totalCells) {
    let x, y;
    do {
      x = Math.floor(rng() * width);
      y = Math.floor(rng() * height);
    } while (inMaze.has(key(x, y)));

    const walkStartX = x;
    const walkStartY = y;
    onStep?.({ type: "walk-start", cell: { x, y } });

    // Random walk with loop erasure: record the exit direction taken from
    // each visited cell, overwriting it if the walk crosses itself again.
    const nextDir = new Map();
    while (!inMaze.has(key(x, y))) {
      const dir = pickRandomDirection(x, y, width, height, rng);
      nextDir.set(key(x, y), dir);
      const from = { x, y };
      x += dir.dx;
      y += dir.dy;
      const looped = nextDir.has(key(x, y));
      onStep?.({ type: "walk-step", from, to: { x, y }, looped });
    }

    // Carve the loop-erased path into the maze.
    x = walkStartX;
    y = walkStartY;
    const path = [{ x, y }];
    while (!inMaze.has(key(x, y))) {
      const dir = nextDir.get(key(x, y));
      cells[y][x].walls[dir.name] = false;
      const nx = x + dir.dx;
      const ny = y + dir.dy;
      cells[ny][nx].walls[dir.opposite] = false;
      inMaze.add(key(x, y));
      x = nx;
      y = ny;
      path.push({ x, y });
    }
    onStep?.({ type: "carve", path });
  }

  onStep?.({ type: "done" });
  return { width, height, cells };
}
