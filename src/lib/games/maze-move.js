// Player movement over a maze grid produced by maze-wilson.js. Pure — no
// DOM, no mutation of the maze — so maze-game.js just applies the result.

const STEP = {
  top: { dx: 0, dy: -1 },
  right: { dx: 1, dy: 0 },
  bottom: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
};

// Returns the new { x, y } after stepping from (x, y) in `direction`, or
// null if a wall or the grid edge blocks the move.
export function move(maze, x, y, direction) {
  const cell = maze.cells[y][x];
  if (cell.walls[direction]) return null;

  const { dx, dy } = STEP[direction];
  const nx = x + dx;
  const ny = y + dy;
  if (nx < 0 || nx >= maze.width || ny < 0 || ny >= maze.height) return null;

  return { x: nx, y: ny };
}
