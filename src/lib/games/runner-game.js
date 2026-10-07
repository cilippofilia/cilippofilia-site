// Skate Run: a dino-style endless runner on /games, starring the
// skaters in runner-sprites.js. The rules live in runner-logic.js; this
// module owns the canvas, the fixed-tick loop, input, the skater picker,
// the overlays and the leaderboard. Purely additive to the page, and
// fully playable when the score API isn't there (Netlify answers 503).

import { CHARACTERS, PALETTE, drawSprite } from "./runner-sprites.js";
import { TICK_MS, SKATER_X, createRun, step, skaterFrame, obstacleFrame, anchorRow } from "./runner-logic.js";
import { claimKeys, releaseKeys } from "./active-game.js";

// Same phosphor green as the maze's CRT screen (maze-game.css), so the two
// games read as a pair.
const PHOSPHOR = "#39ff14";
const PHOSPHOR_DIM = "rgba(57, 255, 20, 0.45)";

// World px between the ground line and the bottom of the screen.
const GROUND_MARGIN = 12;
// A stalled tab or a slow frame is capped to this, so coming back never
// fast-forwards the run into an obstacle.
const MAX_FRAME_MS = 250;
const CRASH_FREEZE_MS = 600;
const SHAKE_MS = 250;
const COUNTDOWN_MS = 1200;
// How far a finger drags down before a press turns from a jump into a duck.
const DUCK_DRAG_PX = 16;
const PREVIEW_SCALE = 2;

const JUMP_KEYS = new Set([" ", "ArrowUp", "w"]);
const DUCK_KEYS = new Set(["ArrowDown", "s"]);
const SKATER_KEY = "runner-skater";
const BEST_KEY = "runner-best";

// Repeating ground specks: [offset, depth below the line, width], every
// SPECK_SPAN world px, scrolled with the distance travelled.
const SPECK_SPAN = 240;
const SPECKS = [
  [0, 3, 2],
  [37, 5, 1],
  [81, 4, 3],
  [120, 6, 1],
  [166, 3, 2],
  [203, 5, 1],
];

// Scores are plain numbers: no leading zeros or thousands separators.
const formatScore = (score) => String(score);

// localStorage can throw (private windows, blocked site data); the game
// just forgets the choice then.
function load(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Nothing to do: the value simply isn't remembered.
  }
}

export function initRunnerGame(container, { signal }) {
  const screen = container.querySelector(".runner-game-screen");
  const canvas = container.querySelector(".runner-game-canvas");
  const ctx = canvas.getContext("2d");
  const scoreEl = container.querySelector(".runner-game-score");
  const bestEl = container.querySelector(".runner-game-best");
  const start = container.querySelector(".runner-game-start");
  const result = container.querySelector(".runner-game-result");
  const resultScore = container.querySelector(".runner-game-result-score");
  const resultNote = container.querySelector(".runner-game-result-note");
  const leaderboardEl = container.querySelector(".runner-game-leaderboard");
  const picker = container.querySelector(".runner-game-picker");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dpr = window.devicePixelRatio || 1;

  // idle: start overlay, nothing played yet.
  // playing: the run is ticking.
  // paused: the tab is hidden or the screen scrolled away mid-run.
  // countdown: 3-2-1 on the way back from a pause.
  // crashing: the crash frame holds for a moment before the result.
  // over: result overlay showing.
  let phase = "idle";
  let selected = Object.hasOwn(CHARACTERS, load(SKATER_KEY)) ? load(SKATER_KEY) : "ollie";
  let best = Math.max(0, Math.floor(Number(load(BEST_KEY)) || 0));
  let run = createRun(selected);
  let top = [];
  let lastShown = -1;
  let inView = true;

  let rafId = null;
  let lastTime = null;
  let accumulator = 0;
  let countdownLeft = 0;
  let crashedAt = 0;

  const jumpKeys = new Set();
  const duckKeys = new Set();
  let pointer = null;
  let pointerJump = false;
  let pointerDuck = false;

  // Sizes in CSS px; the canvas backing store is scaled by dpr. The world
  // is drawn at a whole-number scale (×3 on a tall screen, ×2 on the
  // shorter mobile one) so sprite pixels stay crisp squares.
  let cssWidth = 0;
  let cssHeight = 0;
  let scale = 3;
  let groundY = 0;

  function resize() {
    cssWidth = canvas.clientWidth;
    cssHeight = canvas.clientHeight;
    scale = cssHeight >= 280 ? 3 : 2;
    groundY = Math.floor(cssHeight / scale) - GROUND_MARGIN;
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    run.viewWidth = cssWidth / scale;
    draw(performance.now());
  }

  // Each sprite frame is drawn once per palette and scale into its own
  // canvas, outline included, then blitted: drawSprite fills one rect per
  // pixel, which is fine once but not for every sprite on every frame.
  const spriteCache = new WeakMap();
  function sprite(frame, palette) {
    let byPalette = spriteCache.get(frame);
    if (!byPalette) spriteCache.set(frame, (byPalette = new WeakMap()));
    let byScale = byPalette.get(palette);
    if (!byScale) byPalette.set(palette, (byScale = new Map()));
    let image = byScale.get(scale);
    if (!image) {
      image = document.createElement("canvas");
      image.width = (frame[0].length + 2) * scale * dpr;
      image.height = (frame.length + 2) * scale * dpr;
      const imageCtx = image.getContext("2d");
      imageCtx.scale(dpr, dpr);
      drawSprite(imageCtx, frame, scale, scale, scale, palette);
      byScale.set(scale, image);
    }
    return image;
  }

  // Draws a frame with its top-left at world (x, top), allowing for the
  // one-pixel outline drawn around it.
  function blit(frame, palette, x, top) {
    const image = sprite(frame, palette);
    ctx.drawImage(
      image,
      (Math.round(x) - 1) * scale,
      (Math.round(top) - 1) * scale,
      (frame[0].length + 2) * scale,
      (frame.length + 2) * scale
    );
  }

  function draw(now) {
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    ctx.save();
    if (phase === "crashing" && !reduceMotion && now - crashedAt < SHAKE_MS) {
      ctx.translate(Math.round(Math.random() * 4 - 2), Math.round(Math.random() * 4 - 2));
    }

    ctx.fillStyle = PHOSPHOR;
    ctx.shadowColor = PHOSPHOR;
    ctx.shadowBlur = 6;
    ctx.fillRect(0, groundY * scale, cssWidth, scale);
    ctx.shadowBlur = 0;

    ctx.fillStyle = PHOSPHOR_DIM;
    const worldWidth = cssWidth / scale;
    for (const [offset, depth, width] of SPECKS) {
      let x = (((offset - run.distance) % SPECK_SPAN) + SPECK_SPAN) % SPECK_SPAN;
      for (; x < worldWidth; x += SPECK_SPAN) {
        ctx.fillRect(Math.round(x) * scale, (groundY + depth) * scale, width * scale, scale);
      }
    }

    for (const obstacle of run.obstacles) {
      const frame = obstacleFrame(run, obstacle);
      // Obstacles stand on, or hang from, the bottom edge of their frame.
      const top = groundY - obstacle.altitude - frame.length;
      const width = frame[0].length;
      for (let i = 0; i < obstacle.count; i++) blit(frame, PALETTE, obstacle.x + i * width, top);
    }

    const frame = skaterFrame(run);
    blit(frame, CHARACTERS[run.skater].palette, SKATER_X, groundY - run.altitude - anchorRow(frame));
    ctx.restore();

    if (phase === "countdown" || phase === "paused") {
      const label = phase === "paused" ? "PAUSED" : String(Math.max(1, Math.ceil((countdownLeft / COUNTDOWN_MS) * 3)));
      ctx.fillStyle = PHOSPHOR;
      ctx.shadowColor = PHOSPHOR;
      ctx.shadowBlur = 10;
      ctx.font = `600 ${8 * scale}px ui-monospace, "SF Mono", Menlo, Consolas, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, cssWidth / 2, cssHeight / 2 - 8 * scale);
      ctx.shadowBlur = 0;
    }
  }

  function updateStats() {
    if (run.score === lastShown) return;
    lastShown = run.score;
    scoreEl.textContent = formatScore(run.score);
  }

  function showBest() {
    bestEl.textContent = `Best ${formatScore(best)}`;
  }

  function input() {
    return { jump: jumpKeys.size > 0 || pointerJump, duck: duckKeys.size > 0 || pointerDuck };
  }

  function clearInput() {
    jumpKeys.clear();
    duckKeys.clear();
    pointer = null;
    pointerJump = false;
    pointerDuck = false;
  }

  function schedule() {
    if (rafId === null) rafId = requestAnimationFrame(tick);
  }

  function tick(now) {
    rafId = null;
    if (signal.aborted) return;
    const elapsed = lastTime === null ? 0 : Math.min(MAX_FRAME_MS, now - lastTime);
    lastTime = now;

    if (phase === "countdown") {
      countdownLeft -= elapsed;
      if (countdownLeft <= 0) phase = "playing";
    } else if (phase === "playing") {
      // Fixed ticks: the same number of steps per second at any refresh
      // rate, with any remainder carried into the next frame.
      accumulator += elapsed;
      while (accumulator >= TICK_MS) {
        accumulator -= TICK_MS;
        step(run, input());
        if (run.crashed) {
          crash(now);
          break;
        }
      }
      updateStats();
    } else if (phase === "crashing" && now - crashedAt >= CRASH_FREEZE_MS) {
      showResult();
    }

    draw(now);
    if (phase === "playing" || phase === "countdown" || phase === "crashing") schedule();
    else lastTime = null;
  }

  function setPickerDisabled(disabled) {
    for (const button of picker.querySelectorAll("button")) button.disabled = disabled;
  }

  function play() {
    run = createRun(selected, { viewWidth: cssWidth / scale });
    phase = "playing";
    accumulator = 0;
    lastTime = null;
    lastShown = -1;
    clearInput();
    claimKeys("runner");
    start.hidden = true;
    result.hidden = true;
    screen.classList.add("is-playing");
    setPickerDisabled(true);
    updateStats();
    schedule();
  }

  function crash(now) {
    phase = "crashing";
    crashedAt = now;
    clearInput();
    releaseKeys("runner");
    screen.classList.remove("is-playing");

    const score = run.score;
    const skater = run.skater;
    const newBest = score > best;
    if (newBest) {
      best = score;
      save(BEST_KEY, String(best));
      showBest();
    }
    resultScore.textContent = formatScore(score);
    resultNote.textContent = newBest ? "New best!" : `Best ${formatScore(best)}`;

    fetch("/api/runner-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score, skater }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(({ top: updated }) => {
        top = updated;
        renderLeaderboard({ score, skater });
      })
      .catch(() => {});
  }

  function showResult() {
    phase = "over";
    result.hidden = false;
    setPickerDisabled(false);
    renderLeaderboard({ score: run.score, skater: run.skater });
  }

  function renderLeaderboard(mine) {
    leaderboardEl.replaceChildren();
    let marked = false;
    for (const entry of top) {
      const li = document.createElement("li");
      if (!marked && entry.score === mine.score && entry.skater === mine.skater) {
        li.classList.add("runner-game-leaderboard-mine");
        marked = true;
      }
      const score = document.createElement("span");
      score.textContent = formatScore(entry.score);
      const who = document.createElement("span");
      who.textContent = CHARACTERS[entry.skater]?.name ?? "";
      li.append(score, who);
      leaderboardEl.append(li);
    }
    leaderboardEl.hidden = top.length === 0;
  }

  function pause() {
    if (phase !== "playing" && phase !== "countdown") return;
    phase = "paused";
    clearInput();
    releaseKeys("runner");
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
    lastTime = null;
    accumulator = 0;
    draw(performance.now());
  }

  function resume() {
    if (phase !== "paused" || !inView || document.hidden) return;
    phase = "countdown";
    countdownLeft = COUNTDOWN_MS;
    claimKeys("runner");
    lastTime = null;
    schedule();
  }

  // The picker: one button per skater with a still of its first ride frame.
  function choose(key) {
    selected = key;
    save(SKATER_KEY, key);
    for (const button of picker.querySelectorAll("button")) {
      button.setAttribute("aria-pressed", String(button.dataset.skater === key));
    }
    if (phase === "idle" || phase === "over") {
      run = createRun(selected, { viewWidth: cssWidth / scale });
      draw(performance.now());
    }
  }

  for (const [key, character] of Object.entries(CHARACTERS)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "runner-game-skater";
    button.dataset.skater = key;
    button.setAttribute("aria-pressed", String(key === selected));
    const preview = document.createElement("canvas");
    preview.className = "runner-game-skater-preview";
    preview.setAttribute("aria-hidden", "true");
    const frame = character.frames.ride[0];
    preview.width = (frame[0].length + 2) * PREVIEW_SCALE * dpr;
    preview.height = (frame.length + 2) * PREVIEW_SCALE * dpr;
    const previewCtx = preview.getContext("2d");
    previewCtx.scale(dpr, dpr);
    drawSprite(previewCtx, frame, PREVIEW_SCALE, PREVIEW_SCALE, PREVIEW_SCALE, character.palette);
    const name = document.createElement("span");
    name.textContent = character.name;
    button.append(preview, name);
    button.addEventListener("click", () => choose(key), { signal });
    picker.append(button);
  }

  signal.addEventListener("abort", () => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
    releaseKeys("runner");
  });

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  signal.addEventListener("abort", () => resizeObserver.disconnect());

  // A run pauses rather than carrying on unseen: when the tab is hidden, or
  // when most of the screen has scrolled out of view.
  const viewObserver = new IntersectionObserver(
    ([entry]) => {
      inView = entry.intersectionRatio >= 0.5;
      if (inView) resume();
      else pause();
    },
    { threshold: 0.5 }
  );
  viewObserver.observe(screen);
  signal.addEventListener("abort", () => viewObserver.disconnect());

  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) pause();
      else resume();
    },
    { signal }
  );
  window.addEventListener("blur", clearInput, { signal });

  const keyName = (e) => (e.key.length === 1 ? e.key.toLowerCase() : e.key);

  window.addEventListener(
    "keydown",
    (e) => {
      const key = keyName(e);
      if (phase === "over") {
        // Space or Enter plays again while the screen is in view, unless
        // it's aimed at a focused control, which should get its own click
        // instead. The maze never uses either key.
        const onControl = e.target instanceof Element && e.target.closest("button, a, input, textarea, select");
        if ((key === " " || key === "Enter") && !e.repeat && inView && !onControl) {
          e.preventDefault();
          play();
        }
        return;
      }
      if (phase !== "playing" && phase !== "countdown") return;
      if (JUMP_KEYS.has(key)) {
        jumpKeys.add(key);
        e.preventDefault();
      } else if (DUCK_KEYS.has(key)) {
        duckKeys.add(key);
        e.preventDefault();
      }
    },
    { signal }
  );
  window.addEventListener(
    "keyup",
    (e) => {
      const key = keyName(e);
      jumpKeys.delete(key);
      duckKeys.delete(key);
    },
    { signal }
  );

  // Touch and mouse: press to jump (holding it jumps higher), drag down to
  // duck for as long as the press lasts.
  canvas.addEventListener(
    "pointerdown",
    (e) => {
      if (phase !== "playing" && phase !== "countdown") return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      pointer = { id: e.pointerId, y: e.clientY };
      pointerJump = true;
      pointerDuck = false;
      canvas.setPointerCapture?.(e.pointerId);
    },
    { signal }
  );
  canvas.addEventListener(
    "pointermove",
    (e) => {
      if (!pointer || e.pointerId !== pointer.id) return;
      if (e.clientY - pointer.y > DUCK_DRAG_PX) {
        pointerJump = false;
        pointerDuck = true;
      }
    },
    { signal }
  );
  const release = (e) => {
    if (!pointer || e.pointerId !== pointer.id) return;
    pointer = null;
    pointerJump = false;
    pointerDuck = false;
  };
  canvas.addEventListener("pointerup", release, { signal });
  canvas.addEventListener("pointercancel", release, { signal });
  // While a run is on, a drag on the screen steers the skater instead of
  // scrolling the page, the same as the maze. Only single-finger drags are
  // claimed, so pinch-zoom keeps working.
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (phase !== "playing" && phase !== "countdown") return;
      if (e.touches.length !== 1) return;
      e.preventDefault();
    },
    { signal, passive: false }
  );

  container.querySelector(".runner-game-play").addEventListener("click", play, { signal });
  container.querySelector(".runner-game-replay").addEventListener("click", play, { signal });

  scoreEl.textContent = formatScore(0);
  showBest();
  resize();

  fetch("/api/runner-score")
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then(({ top: current }) => {
      top = current;
    })
    .catch(() => {});
}
