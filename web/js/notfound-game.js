// Whack-a-broken-link: the 404 page's minigame. Idle chips sit in the game
// area doing nothing; tapping one starts a round (see notfound-game-logic.js
// for the scoring/timing rules). Purely additive — the real "Back home" /
// "See the apps" buttons above are untouched and still the fastest way out.

import {
  createGameState,
  startRound,
  registerHit,
  registerMiss,
  chipLifetimeMs,
  randomPath,
  resultFlavor,
  bestLineText,
} from "./notfound-game-logic.js";

const container = document.querySelector(".notfound-game");
if (container) initGame(container);

function initGame(container) {
  const field = container.querySelector(".notfound-game-field");
  const hint = container.querySelector(".notfound-game-hint");
  const result = container.querySelector(".notfound-game-result");
  const idleBest = container.querySelector(".notfound-game-best");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let state = createGameState();
  let spawnTimer = null;
  let best = 0;
  let liveChips = [];

  fetch("/api/notfound-score")
    .then((r) => r.json())
    .then(({ best: fetched }) => {
      best = fetched || 0;
      showIdleBest();
    })
    .catch(() => {});

  function showIdleBest() {
    const text = bestLineText(0, best);
    idleBest.textContent = text;
    idleBest.hidden = !text;
  }

  spawnIdleChip();

  function spawnIdleChip() {
    const chip = makeChip(() => {
      shatter(chip);
      begin();
    });
    chip.classList.add("is-idle");
    field.appendChild(chip);
  }

  function begin() {
    field.querySelectorAll(".notfound-chip").forEach((el) => el.remove());
    liveChips = [];
    result.hidden = true;
    hint.hidden = true;
    idleBest.hidden = true;
    state = startRound(performance.now());
    const score = container.querySelector(".notfound-game-score");
    score.hidden = false;
    updateScore();
    scheduleSpawn();
  }

  function scheduleSpawn() {
    if (state.status !== "playing") return;
    const lifetime = chipLifetimeMs(state, performance.now());
    spawnChip(lifetime);
    spawnTimer = setTimeout(scheduleSpawn, lifetime * 0.95);
  }

  // Chips are placed with an approximate footprint (CHIP_W × CHIP_H — wider
  // than most rendered chips actually get, since real width depends on the
  // random path text) rather than the true measured size, so a new chip's
  // spot can be checked before it's even in the DOM.
  const CHIP_W = 170;
  const CHIP_H = 46;
  const CHIP_MARGIN = 10;
  const SPAWN_ATTEMPTS = 12;

  function rectsOverlap(a, b, margin) {
    return !(
      a.right + margin <= b.left ||
      a.left - margin >= b.right ||
      a.bottom + margin <= b.top ||
      a.top - margin >= b.bottom
    );
  }

  // The score pill's footprint, in field-relative coordinates, so a chip
  // never spawns underneath it. null while the pill is hidden.
  function scoreRect() {
    const scoreEl = container.querySelector(".notfound-game-score");
    if (scoreEl.hidden) return null;
    const scoreBox = scoreEl.getBoundingClientRect();
    const fieldBox = field.getBoundingClientRect();
    return {
      left: scoreBox.left - fieldBox.left,
      top: scoreBox.top - fieldBox.top,
      right: scoreBox.right - fieldBox.left,
      bottom: scoreBox.bottom - fieldBox.top,
    };
  }

  function pickChipSpot() {
    const maxX = Math.max(0, field.clientWidth - CHIP_W);
    const maxY = Math.max(0, field.clientHeight - CHIP_H);
    const reserved = scoreRect();

    let left = Math.round(Math.random() * maxX);
    let top = Math.round(Math.random() * maxY);
    for (let attempt = 0; attempt < SPAWN_ATTEMPTS; attempt++) {
      const candidate = { left, top, right: left + CHIP_W, bottom: top + CHIP_H };
      const collides =
        (reserved && rectsOverlap(candidate, reserved, CHIP_MARGIN)) ||
        liveChips.some((c) => rectsOverlap(candidate, c.rect, CHIP_MARGIN));
      if (!collides) break;
      left = Math.round(Math.random() * maxX);
      top = Math.round(Math.random() * maxY);
    }
    return { left, top };
  }

  function spawnChip(lifetime) {
    const chip = makeChip(() => {
      shatter(chip);
      state = registerHit(state);
      updateScore();
      liveChips = liveChips.filter((c) => c.chip !== chip);
    });

    const { left, top } = pickChipSpot();
    chip.style.position = "absolute";
    chip.style.left = `${left}px`;
    chip.style.top = `${top}px`;
    field.appendChild(chip);
    liveChips.push({ chip, rect: { left, top, right: left + CHIP_W, bottom: top + CHIP_H } });

    const expiry = setTimeout(() => {
      if (!chip.isConnected) return;
      chip.remove();
      liveChips = liveChips.filter((c) => c.chip !== chip);
      state = registerMiss(state);
      updateScore();
      if (state.status === "ended") endRound();
    }, lifetime);

    chip.addEventListener("click", () => clearTimeout(expiry), { once: true });
  }

  // Physics constants for the shard burst below. Velocity approaches
  // TERMINAL_VELOCITY exponentially each frame (dv = (target - v) * rate *
  // dt — the standard solution for fall under drag), which reads as real
  // gravity whether a shard starts by launching upward or already falling.
  // Each floor hit reverses vertical velocity scaled by RESTITUTION (the
  // floor "absorbs" the rest) and damps horizontal speed and spin, so a
  // shard bounces a few times, loses energy, and comes to rest.
  const GRAVITY_RATE = 6;
  const TERMINAL_VELOCITY = 900;
  const RESTITUTION = 0.45;
  const REST_SPEED = 70;
  const MAX_BOUNCES = 3;
  const SHARD_COLORS = ["#ffffff", "#e4e4e7", "#ffb340", "#f5f5f7"];

  // A tapped chip "breaks": it vanishes fast while a handful of pixel-like
  // square shards burst outward from where it sat, fall under gravity,
  // bounce off the field's floor losing energy each time, then fade once
  // they've settled. Purely a hit response; a miss (timed-out chip) just
  // disappears, nothing to break.
  function shatter(chip) {
    chip.classList.add("is-breaking");
    if (reduceMotion) {
      chip.remove();
      return;
    }

    const chipRect = chip.getBoundingClientRect();
    const fieldRect = field.getBoundingClientRect();
    const originX = chipRect.left - fieldRect.left + chipRect.width / 2;
    const originY = chipRect.top - fieldRect.top + chipRect.height / 2;
    const floorY = fieldRect.height - originY; // floor, in origin-relative coords

    const burst = document.createElement("div");
    burst.className = "notfound-shatter";
    burst.style.left = `${originX}px`;
    burst.style.top = `${originY}px`;
    field.appendChild(burst);

    const shardCount = 16;
    const shards = [];
    for (let i = 0; i < shardCount; i++) {
      const angle = (i / shardCount) * 360 + Math.random() * 30 - 15;
      const speed = 160 + Math.random() * 220;
      const size = 4 + Math.random() * 4;

      const el = document.createElement("span");
      el.className = "notfound-shard";
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.marginLeft = `${-size / 2}px`;
      el.style.marginTop = `${-size / 2}px`;
      el.style.setProperty("--shard-color", SHARD_COLORS[i % SHARD_COLORS.length]);
      burst.appendChild(el);

      shards.push({
        el,
        size,
        x: 0,
        y: 0,
        vx: Math.cos((angle * Math.PI) / 180) * speed,
        vy: Math.sin((angle * Math.PI) / 180) * speed,
        rot: 0,
        angularVelocity: Math.random() * 720 - 360,
        bounces: 0,
        resting: false,
      });
    }

    setTimeout(() => chip.remove(), 90);
    // Once settled, shards are left in place — the debris pile builds up on
    // the floor through the round. clearDebris() wipes it for a new round.
    runShardPhysics(shards, floorY, () => {});
  }

  // Clears settled debris from a previous round — called before a replay
  // starts so each round's pile builds up from empty. Not called from
  // begin() itself: the very first round's idle-tap shatter fires right
  // before begin(), and clearing here would delete it before it could run.
  function clearDebris() {
    field.querySelectorAll(".notfound-shatter").forEach((el) => el.remove());
  }

  function runShardPhysics(shards, floorY, onSettled) {
    let last = performance.now();

    function frame(now) {
      const dt = Math.min((now - last) / 1000, 0.032);
      last = now;
      let anyActive = false;

      for (const s of shards) {
        if (s.resting) continue;
        anyActive = true;

        s.vy += (TERMINAL_VELOCITY - s.vy) * (1 - Math.exp(-GRAVITY_RATE * dt));
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.rot += s.angularVelocity * dt;

        const floorLimit = floorY - s.size / 2;
        if (s.y >= floorLimit) {
          s.y = floorLimit;
          s.vy = -s.vy * RESTITUTION;
          s.vx *= 0.7;
          s.angularVelocity *= 0.6;
          s.bounces++;
          if (Math.abs(s.vy) < REST_SPEED || s.bounces >= MAX_BOUNCES) {
            s.resting = true;
            s.vy = 0;
            s.vx = 0;
            s.angularVelocity = 0;
          }
        }

        s.el.style.transform = `translate(${s.x}px, ${s.y}px) rotate(${s.rot}deg)`;
      }

      if (anyActive) requestAnimationFrame(frame);
      else onSettled();
    }

    requestAnimationFrame(frame);
  }

  function updateScore() {
    container.querySelector(".notfound-game-score").textContent = `${state.score} caught`;
  }

  function endRound() {
    clearTimeout(spawnTimer);
    field.querySelectorAll(".notfound-chip").forEach((el) => el.remove());
    container.querySelector(".notfound-game-score").hidden = true;
    result.hidden = false;
    result.querySelector(".notfound-game-result-score").textContent =
      state.score === 1 ? "1 caught" : `${state.score} caught`;
    result.querySelector(".notfound-game-result-text").textContent = resultFlavor(state.score);

    const finalScore = state.score;
    fetch("/api/notfound-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: finalScore }),
    })
      .then((r) => r.json())
      .then(({ best: updated }) => {
        best = updated || 0;
        const text = bestLineText(finalScore, best);
        const resultBest = result.querySelector(".notfound-game-result-best");
        resultBest.textContent = text;
        resultBest.hidden = !text;
        showIdleBest();
      })
      .catch(() => {});
  }

  function makeChip(onActivate) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip notfound-chip";
    chip.textContent = randomPath();
    chip.addEventListener("click", onActivate, { once: true });
    return chip;
  }

  container.querySelector(".notfound-game-replay").addEventListener("click", () => {
    clearDebris();
    begin();
  });
}
