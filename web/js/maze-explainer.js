// The "How was this maze made?" walkthrough: flips the maze card to reveal a
// small dedicated grid and step-through controls that replay Wilson's
// algorithm one random walk at a time, using the onStep trace from
// maze-wilson.js. Purely additive — never touches the real game's maze.

import { generateMaze } from "./maze-wilson.js";

const DEMO_SIZE = 5;
const REPEAT_FRAME_MS = 200;

const WALL_COLOR = "#39ff14";
const SETTLED_FILL = "rgba(57, 255, 20, 0.08)";
const WALK_COLOR = "#2997ff";

function times(n) {
  return n === 1 ? "once" : `${n} times`;
}

const CAPTIONS = {
  start: () => "Every maze starts as a single cell, already marked as part of the maze.",
  walk: (step) => {
    if (step.role === "intro-loop") {
      return `Start a random walk from an unvisited cell. It loops back on itself ${times(step.loops)}. Erase the loop, then carve only what's left.`;
    }
    if (step.role === "loop-example") {
      return `This walk loops back on itself ${times(step.loops)}. Erase the loop, then carve what's left. Without this step, cells near the start get picked more often, so not every maze would be equally likely.`;
    }
    return "Start a random walk from an unvisited cell, and keep walking until it reaches the maze. Carve that path into the walls.";
  },
  repeat: () =>
    "Do this over and over, starting a new random walk each time, until every cell is part of the maze.",
  done: () =>
    "The maze is done. Every cell connects by exactly one path, with no loops. Erasing loops along the way is what makes every possible maze equally likely.",
};

// Collapses the fine-grained trace from generateMaze (one event per random-
// walk move) into one entry per random walk — its start cell, how many times
// it crossed itself (and so had a loop erased), and the final loop-erased
// path that gets carved.
function toWalks(fineSteps) {
  const walks = [];
  let walkStart = null;
  let loops = 0;
  for (const step of fineSteps) {
    if (step.type === "walk-start") {
      walkStart = step.cell;
      loops = 0;
    } else if (step.type === "walk-step") {
      if (step.looped) loops += 1;
    } else if (step.type === "carve") {
      walks.push({ type: "walk", start: walkStart, loops, path: step.path });
      walkStart = null;
    }
  }
  return walks;
}

// A full run of Wilson's algorithm on a 5x5 grid takes a dozen-plus random
// walks — showing every one repeats the same idea over and over without
// teaching anything new. Instead, pick out the moments that actually explain
// the mechanism (one ordinary walk, one that demonstrates loop erasure) and
// fold the rest into a single "this repeats" step, animated rather than
// jumped to (see animateRepeat).
function curateSteps(fineSteps) {
  const startStep = fineSteps.find((s) => s.type === "start");
  const walks = toWalks(fineSteps);

  const steps = [startStep];

  const first = walks[0];
  steps.push({ ...first, role: first.loops > 0 ? "intro-loop" : "intro" });

  let loopExampleIndex = -1;
  if (first.loops === 0) {
    loopExampleIndex = walks.findIndex((w, i) => i > 0 && w.loops > 0);
    if (loopExampleIndex > 0) {
      steps.push({ ...walks[loopExampleIndex], role: "loop-example" });
    }
  }

  const shown = new Set([0, loopExampleIndex].filter((i) => i >= 0));
  const remainingWalks = walks.filter((_, i) => !shown.has(i));
  if (remainingWalks.length > 0) {
    steps.push({ type: "repeat", walks: remainingWalks });
  }

  steps.push({ type: "done" });
  return steps;
}

const flip = document.querySelector(".maze-flip");
if (flip) initExplainer(flip);

function initExplainer(flip) {
  const toggle = document.querySelector(".maze-explain-toggle");
  const canvas = flip.querySelector(".maze-explainer-canvas");
  const ctx = canvas.getContext("2d");
  const caption = flip.querySelector(".maze-explainer-caption");
  const stepLabel = flip.querySelector(".maze-explainer-step");
  const prevBtn = flip.querySelector(".maze-explainer-prev");
  const nextBtn = flip.querySelector(".maze-explainer-next");
  const restartBtn = flip.querySelector(".maze-explainer-restart");
  const closeBtn = flip.querySelector(".maze-explainer-close");

  let steps = [];
  let index = 0;
  let started = false;
  let animationToken = 0;

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const size = canvas.clientWidth;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (steps.length) draw(replayTo(index));
  }

  new ResizeObserver(resizeCanvas).observe(canvas);

  function newWalkthrough() {
    const fineSteps = [];
    generateMaze(DEMO_SIZE, DEMO_SIZE, Math.random, (step) => fineSteps.push(step));
    steps = curateSteps(fineSteps);
    started = true;
    resizeCanvas();
    goTo(0, false);
  }

  function applyPath(path, walls, settled) {
    const key = (x, y) => y * DEMO_SIZE + x;
    for (let p = 0; p < path.length - 1; p++) {
      const a = path[p];
      const b = path[p + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      if (dx === 1) {
        walls[a.y][a.x].right = false;
        walls[b.y][b.x].left = false;
      } else if (dx === -1) {
        walls[a.y][a.x].left = false;
        walls[b.y][b.x].right = false;
      } else if (dy === 1) {
        walls[a.y][a.x].bottom = false;
        walls[b.y][b.x].top = false;
      } else if (dy === -1) {
        walls[a.y][a.x].top = false;
        walls[b.y][b.x].bottom = false;
      }
      settled.add(key(a.x, a.y));
      settled.add(key(b.x, b.y));
    }
  }

  function blankWalls() {
    return Array.from({ length: DEMO_SIZE }, () =>
      Array.from({ length: DEMO_SIZE }, () => ({ top: true, right: true, bottom: true, left: true }))
    );
  }

  // Replays steps[0..i] from scratch into a wall grid and the set of
  // committed ("settled") cells. Each "walk" step already carries its own
  // final loop-erased path, so no chain-reconstruction is needed here.
  function replayTo(i) {
    const walls = blankWalls();
    const settled = new Set();
    const key = (x, y) => y * DEMO_SIZE + x;

    for (let s = 0; s <= i; s++) {
      const step = steps[s];
      if (step.type === "start") {
        settled.add(key(step.cell.x, step.cell.y));
      } else if (step.type === "walk") {
        applyPath(step.path, walls, settled);
      } else if (step.type === "repeat") {
        for (const w of step.walks) applyPath(w.path, walls, settled);
      }
    }

    const current = steps[i];
    const walkPath = current.type === "walk" ? current.path : [];

    return { walls, settled, walkPath };
  }

  function draw({ walls, settled, walkPath }) {
    const size = canvas.clientWidth;
    const cell = size / DEMO_SIZE;
    const key = (x, y) => y * DEMO_SIZE + x;

    ctx.clearRect(0, 0, size, size);

    for (let y = 0; y < DEMO_SIZE; y++) {
      for (let x = 0; x < DEMO_SIZE; x++) {
        if (!settled.has(key(x, y))) continue;
        ctx.fillStyle = SETTLED_FILL;
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }

    ctx.strokeStyle = WALL_COLOR;
    ctx.shadowColor = WALL_COLOR;
    ctx.shadowBlur = 6;
    ctx.lineWidth = 2;
    ctx.lineCap = "square";
    ctx.beginPath();
    for (let y = 0; y < DEMO_SIZE; y++) {
      for (let x = 0; x < DEMO_SIZE; x++) {
        const w = walls[y][x];
        const px = x * cell;
        const py = y * cell;
        if (w.top) line(px, py, px + cell, py);
        if (w.left) line(px, py, px, py + cell);
        if (w.bottom) line(px, py + cell, px + cell, py + cell);
        if (w.right) line(px + cell, py, px + cell, py + cell);
      }
    }
    ctx.stroke();

    if (walkPath.length > 0) {
      ctx.strokeStyle = WALK_COLOR;
      ctx.shadowColor = WALK_COLOR;
      ctx.shadowBlur = 8;
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      ctx.beginPath();
      walkPath.forEach((p, i) => {
        const cx = p.x * cell + cell / 2;
        const cy = p.y * cell + cell / 2;
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.stroke();

      const head = walkPath[walkPath.length - 1];
      const pad = cell * 0.3;
      ctx.shadowColor = WALK_COLOR;
      ctx.fillStyle = WALK_COLOR;
      ctx.fillRect(head.x * cell + pad, head.y * cell + pad, cell - pad * 2, cell - pad * 2);
    }

    ctx.shadowBlur = 0;

    function line(x1, y1, x2, y2) {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
  }

  function updateChrome() {
    const step = steps[index];
    caption.textContent = (CAPTIONS[step.type] ?? (() => ""))(step);
    stepLabel.textContent = `Step ${index + 1} of ${steps.length}`;
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === steps.length - 1;
  }

  // Carves each remaining walk into the walls one at a time rather than
  // jumping straight to the finished grid — this is the "repeat until done"
  // idea made visible, not just described.
  function animateRepeat(step) {
    const token = ++animationToken;
    const { walls, settled } = replayTo(index - 1);
    let i = 0;

    function frame() {
      if (token !== animationToken) return;
      if (i >= step.walks.length) return;
      applyPath(step.walks[i].path, walls, settled);
      draw({ walls, settled, walkPath: step.walks[i].path });
      i += 1;
      setTimeout(frame, REPEAT_FRAME_MS);
    }
    frame();
  }

  function goTo(newIndex, animate) {
    index = newIndex;
    animationToken += 1; // cancel any in-flight repeat animation
    updateChrome();
    const step = steps[index];
    if (animate && step.type === "repeat") {
      animateRepeat(step);
    } else {
      draw(replayTo(index));
    }
  }

  prevBtn.addEventListener("click", () => {
    if (index === 0) return;
    goTo(index - 1, false);
  });

  nextBtn.addEventListener("click", () => {
    if (index === steps.length - 1) return;
    goTo(index + 1, true);
  });

  restartBtn.addEventListener("click", newWalkthrough);

  toggle.addEventListener("click", () => {
    flip.classList.add("is-flipped");
    if (!started) newWalkthrough();
  });

  closeBtn.addEventListener("click", () => {
    flip.classList.remove("is-flipped");
  });
}
