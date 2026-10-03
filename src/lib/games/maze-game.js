// Escape the Labyrinth: a maze generated fresh with Wilson's algorithm
// (maze-wilson.js) on every "Play"/"Play again" tap. Rendered to a canvas;
// the player moves one cell at a time via arrow keys/WASD or a swipe, with
// movement rules in maze-move.js. Purely additive to the home page.

import { generateMaze } from "./maze-wilson.js";
import { move } from "./maze-move.js";

// Row count is fixed; the screen's height is fixed in CSS so cell height
// never changes. Column count is derived from the available width each
// round, so the maze is squarish on a narrow (mobile) screen and a wide
// rectangle on a roomy (desktop) one, rather than a fixed square.
const ROWS = 15;
const MIN_COLS = 8;

// Arcade-CRT palette — matches the phosphor green defined in maze-game.css
// for the screen border/overlay text, plus the site's accent and orange
// tokens for the player and exit so the glow ties back into the brand.
const WALL_COLOR = "#39ff14";
const PLAYER_COLOR = "#2997ff";
const EXIT_COLOR = "#ffb340";

const KEY_DIRECTIONS = {
  ArrowUp: "top",
  ArrowDown: "bottom",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "top",
  s: "bottom",
  a: "left",
  d: "right",
};

export function initMazeGame(container, { signal }) {
  const canvas = container.querySelector(".maze-game-canvas");
  const ctx = canvas.getContext("2d");
  const timerEl = container.querySelector(".maze-game-timer");
  const movesEl = container.querySelector(".maze-game-moves");
  const start = container.querySelector(".maze-game-start");
  const result = container.querySelector(".maze-game-result");
  const resultMoves = container.querySelector(".maze-game-result-moves");
  const leaderboardEl = container.querySelector(".maze-game-leaderboard");

  // idle: start overlay showing, nothing to play yet.
  // ready: a maze is drawn and waiting for the player's first move — the
  //        clock isn't running yet.
  // playing: the clock is running.
  // won: the exit was reached; the clock is stopped.
  let phase = "idle";
  let maze;
  let player;
  let startedAt = null;
  let timerFrame = null;
  let moveCount = 0;
  let top = [];

  // The canvas's width is responsive but its height is fixed (see CSS), so
  // only cellW needs recomputing on resize — cellH is constant. Column
  // count itself is only recomputed at the start of a round (see
  // startNewRound); resizing mid-round just rescales the existing grid's
  // cells rather than regenerating the maze under the player.
  let cols = ROWS;
  let canvasWidth = canvas.clientWidth;
  let canvasHeight = canvas.clientHeight;
  let cellW = canvasWidth / cols;
  let cellH = canvasHeight / ROWS;
  const dpr = window.devicePixelRatio || 1;

  function resizeCanvas() {
    canvasWidth = canvas.clientWidth;
    canvasHeight = canvas.clientHeight;
    cellW = canvasWidth / cols;
    cellH = canvasHeight / ROWS;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    if (maze) draw();
  }

  new ResizeObserver(resizeCanvas).observe(canvas);
  resizeCanvas();

  function renderLeaderboard(justSubmitted) {
    leaderboardEl.innerHTML = "";
    for (const entry of top) {
      const li = document.createElement("li");
      const mine = justSubmitted && entry.timeMs === justSubmitted.timeMs && entry.moves === justSubmitted.moves;
      if (mine) li.classList.add("maze-game-leaderboard-mine");
      li.innerHTML = `<span>${(entry.timeMs / 1000).toFixed(1)}s</span><span>${entry.moves} moves</span>`;
      leaderboardEl.append(li);
    }
  }

  // Generates a fresh maze and puts the game in "ready" state: drawn and
  // waiting for the player's first move, clock not running yet.
  function startNewRound() {
    cols = Math.max(MIN_COLS, Math.round(canvas.clientWidth / cellH));
    canvasWidth = canvas.clientWidth;
    cellW = canvasWidth / cols;
    maze = generateMaze(cols, ROWS);
    player = { x: 0, y: 0 };
    phase = "ready";
    startedAt = null;
    moveCount = 0;
    stopTimer();
    timerEl.textContent = "0.0s";
    movesEl.textContent = "0 moves";
    start.hidden = true;
    result.hidden = true;
    draw();
  }

  function tickTimer() {
    if (signal.aborted) return;
    timerEl.textContent = `${((performance.now() - startedAt) / 1000).toFixed(1)}s`;
    timerFrame = requestAnimationFrame(tickTimer);
  }

  function stopTimer() {
    if (timerFrame !== null) cancelAnimationFrame(timerFrame);
    timerFrame = null;
  }

  function draw() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Walls: a blocky phosphor glow — square line caps and a shadow blur
    // read as a CRT tube lighting up, not an anti-aliased vector line.
    ctx.strokeStyle = WALL_COLOR;
    ctx.shadowColor = WALL_COLOR;
    ctx.shadowBlur = 6;
    ctx.lineWidth = 3;
    ctx.lineCap = "square";
    ctx.beginPath();
    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        const px = x * cellW;
        const py = y * cellH;
        const walls = maze.cells[y][x].walls;
        if (walls.top) line(px, py, px + cellW, py);
        if (walls.left) line(px, py, px, py + cellH);
        if (walls.bottom) line(px, py + cellH, px + cellW, py + cellH);
        if (walls.right) line(px + cellW, py, px + cellW, py + cellH);
      }
    }
    ctx.stroke();

    // Exit and player are drawn as flat squares, not circles — pixel-sprite
    // blocks rather than smooth shapes.
    const exitPadX = cellW * 0.24;
    const exitPadY = cellH * 0.24;
    ctx.shadowColor = EXIT_COLOR;
    ctx.fillStyle = EXIT_COLOR;
    ctx.fillRect(
      (maze.width - 1) * cellW + exitPadX,
      (maze.height - 1) * cellH + exitPadY,
      cellW - exitPadX * 2,
      cellH - exitPadY * 2
    );

    const playerPadX = cellW * 0.28;
    const playerPadY = cellH * 0.28;
    ctx.shadowColor = PLAYER_COLOR;
    ctx.fillStyle = PLAYER_COLOR;
    ctx.fillRect(
      player.x * cellW + playerPadX,
      player.y * cellH + playerPadY,
      cellW - playerPadX * 2,
      cellH - playerPadY * 2
    );

    ctx.shadowBlur = 0;
  }

  function line(x1, y1, x2, y2) {
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  }

  function attemptMove(direction) {
    if (phase !== "ready" && phase !== "playing") return;
    const next = move(maze, player.x, player.y, direction);
    if (!next) return;

    if (phase === "ready") {
      phase = "playing";
      startedAt = performance.now();
      tickTimer();
    }

    player = next;
    moveCount += 1;
    movesEl.textContent = `${moveCount} move${moveCount === 1 ? "" : "s"}`;
    draw();
    if (player.x === maze.width - 1 && player.y === maze.height - 1) win();
  }

  function win() {
    const elapsedMs = performance.now() - startedAt;
    const moves = moveCount;
    phase = "won";
    stopTimer();
    startedAt = null;

    result.hidden = false;
    result.querySelector(".maze-game-result-time").textContent = `${(elapsedMs / 1000).toFixed(1)}s`;
    resultMoves.textContent = `${moves} move${moves === 1 ? "" : "s"}`;

    fetch("/api/maze-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timeMs: elapsedMs, moves }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(({ top: updated }) => {
        top = updated;
        renderLeaderboard({ timeMs: Math.floor(elapsedMs), moves });
      })
      .catch(() => {});
  }

  signal.addEventListener("abort", stopTimer);

  window.addEventListener(
    "keydown",
    (e) => {
      if (phase !== "ready" && phase !== "playing") return;
      const direction = KEY_DIRECTIONS[e.key];
      if (!direction) return;
      e.preventDefault();
      attemptMove(direction);
    },
    { signal }
  );

  let touchStart = null;
  const SWIPE_THRESHOLD = 24;
  canvas.addEventListener(
    "touchstart",
    (e) => {
      const t = e.touches[0];
      touchStart = { x: t.clientX, y: t.clientY };
    },
    { signal }
  );
  // While a round is on, a swipe on the maze steers the player instead of
  // scrolling the page; the page still scrolls from anywhere outside the
  // canvas. Only single-finger drags are claimed, so pinch-zoom keeps
  // working. The listener has to be non-passive for preventDefault to count.
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (phase !== "ready" && phase !== "playing") return;
      if (e.touches.length !== 1) return;
      e.preventDefault();
    },
    { signal, passive: false }
  );
  canvas.addEventListener(
    "touchend",
    (e) => {
      if (!touchStart) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStart.x;
      const dy = t.clientY - touchStart.y;
      touchStart = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return;
      if (Math.abs(dx) > Math.abs(dy)) attemptMove(dx > 0 ? "right" : "left");
      else attemptMove(dy > 0 ? "bottom" : "top");
    },
    { signal }
  );

  container.querySelector(".maze-game-play").addEventListener("click", startNewRound, { signal });
  container.querySelector(".maze-game-replay").addEventListener("click", startNewRound, { signal });
}
