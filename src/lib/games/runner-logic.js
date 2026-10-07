// The skate runner's rules, kept free of the DOM so they can be tested:
// the skater's jump/duck physics, the speed ramp, obstacle spawning and
// collisions. runner-game.js owns the canvas and input and calls step()
// once per fixed tick.
//
// Units are sprite pixels ("world px"), measured up from the ground, so an
// altitude of 0 is standing on it. Time is in ticks of 1/60 s: the game
// loop runs a fixed number of ticks per second whatever the display's
// refresh rate, so a 120Hz screen doesn't play twice as fast.

import { CHARACTERS, OBSTACLES, bounds } from "./runner-sprites.js";

export const TICK_MS = 1000 / 60;

// Where the skater stands, in world px from the left edge of the screen.
export const SKATER_X = 10;

export const START_SPEED = 2.2;
export const MAX_SPEED = 4.6;
const ACCELERATION = 0.0004;

// A tap reaches about 29px; holding jump through the first HOLD_TICKS
// halves gravity and carries the skater to about 44px.
const JUMP_VELOCITY = 3.4;
const GRAVITY = 0.2;
const HOLD_GRAVITY = 0.1;
const HOLD_TICKS = 12;
// Pressing duck in the air drops the skater fast, like the dino.
const FAST_FALL_GRAVITY = 0.6;

// About ten points a second at the start, rising with speed.
const SCORE_PER_PX = 0.08;

// New kinds of obstacle join as the score climbs, so a run starts with
// small things to tap over and works up to the tall, flying and moving
// ones. Three-in-a-row groups only appear once the skater is fast enough
// to clear them with a tap.
export const WIDE_SCORE = 50;
export const PIGEON_SCORE = 150;
export const TALL_SCORE = 200;
export const MOVING_SCORE = 250;
export const TRIPLE_SPEED = 2.8;

// The gap after an obstacle is at least GAP_TICKS of travel: a tapped jump
// is in the air for about 34 ticks, so this leaves time to land and react
// before the next one. GAP_SPREAD adds up to 70% more at random. A held
// jump stays up for about 45 ticks, so the gap after a tall obstacle is
// stretched to match.
const GAP_TICKS = 48;
const GAP_SPREAD = 0.7;
const HOLD_GAP = 1.3;

// A low bird skims the ground: ducking doesn't help, so it has to be
// jumped. Its height is the bottom edge of the bird's frame.
export const LOW_PIGEON_ALTITUDE = 2;

// Hitboxes are the frame's filled pixels, trimmed a little so a pixel
// graze doesn't end a run. The skater keeps its full bottom edge: the
// board is what lands on things.
const SKATER_INSET = { x: 3, top: 1, bottom: 0 };
const GROUND_INSET = { x: 2, top: 0, bottom: 0 };
const BIRD_INSET = { x: 2, top: 1, bottom: 1 };

// Every obstacle, and how it behaves. The sprites are OBSTACLES in
// runner-sprites.js, under the same names.
//   clear     how the skater gets past: "tap" (a tapped jump), "hold" (a
//             held jump), "duck", or "fly" (a bird at one of two heights,
//             low to be jumped or at head height to be ducked)
//   weight    how often it's picked, against the others unlocked so far
//   minScore  the score it starts turning up at
//   maxCount  how many can come in a row (default 1)
//   inset     hitbox trim (default GROUND_INSET); a big top inset leaves
//             steam or flies out of the hitbox
//   speed     extra px per tick it moves towards the skater
//   frameTicks  ticks per animation frame (default 12)
// runner-logic.test.js checks every skater can clear every kind the way
// `clear` says, at the slowest and fastest speeds it can turn up at.
export const KINDS = {
  cone: { clear: "tap", weight: 3, maxCount: 3 },
  hydrant: { clear: "tap", weight: 1 },
  bollard: { clear: "tap", weight: 1, maxCount: 3 },
  manhole: { clear: "tap", weight: 1, inset: { x: 2, top: 5, bottom: 0 }, frameTicks: 10 },
  bench: { clear: "tap", weight: 1, minScore: WIDE_SCORE },
  barrier: { clear: "tap", weight: 1, minScore: WIDE_SCORE },
  pigeon: { clear: "fly", weight: 2, minScore: PIGEON_SCORE, inset: BIRD_INSET },
  seagull: { clear: "fly", weight: 1.5, minScore: PIGEON_SCORE, inset: BIRD_INSET },
  bin: { clear: "hold", weight: 0.75, minScore: TALL_SCORE, inset: { x: 2, top: 3, bottom: 0 }, frameTicks: 8 },
  newsBox: { clear: "hold", weight: 0.75, minScore: TALL_SCORE },
  postBox: { clear: "tap", weight: 0.75, minScore: TALL_SCORE },
  // An abandoned trolley, rolling slowly downhill at the skater.
  cart: { clear: "tap", weight: 1, minScore: MOVING_SCORE, speed: 0.4, frameTicks: 6 },
  rat: { clear: "tap", weight: 1, minScore: MOVING_SCORE, speed: 1, frameTicks: 5 },
};
const KIND_NAMES = Object.keys(KINDS);

const frameWidth = (kind) => OBSTACLES[kind][0][0].length;

const boundsCache = new WeakMap();
export function frameBounds(frame) {
  let b = boundsCache.get(frame);
  if (!b) {
    b = bounds(frame);
    boundsCache.set(frame, b);
  }
  return b;
}

// Which frame row a skater stands on: its lowest filled row (Ollie's
// second ride frame has a blank last row). Obstacles always stand on, or
// hang from, the bottom edge of their frame instead, so an animated one
// stays put while it moves.
export function anchorRow(frame) {
  const b = frameBounds(frame);
  return b.y + b.h;
}

function box(frame, x, altitude, anchor, inset) {
  const b = frameBounds(frame);
  return {
    left: x + b.x + inset.x,
    right: x + b.x + b.w - inset.x,
    bottom: altitude + (anchor - (b.y + b.h)) + inset.bottom,
    top: altitude + (anchor - b.y) - inset.top,
  };
}

// Boxes that only touch don't count.
export function overlaps(a, b) {
  return a.left < b.right && b.left < a.right && a.bottom < b.top && b.bottom < a.top;
}

export function minGap(speed) {
  return speed * GAP_TICKS;
}

// The height an overhead obstacle hangs at so the skater has to duck:
// low enough to hit them riding or jumping off the ground, high enough to
// clear them ducked. Worked out from each skater's own frames, halfway
// between those two limits, so every skater gets a fair window.
export function headAltitude(skater, kind) {
  const { frames } = CHARACTERS[skater];
  const inset = KINDS[kind].inset ?? GROUND_INSET;
  const skaterTop = (frame) => box(frame, 0, 0, anchorRow(frame), SKATER_INSET).top;
  const duckTop = skaterTop(frames.duck[0]);
  const rideTop = Math.min(...frames.ride.map(skaterTop));
  // The obstacle's bottom edge, relative to its altitude, in each frame.
  const bottoms = OBSTACLES[kind].map((f) => box(f, 0, 0, f.length, inset).bottom);
  // Clear the ducked head in every frame, and still hit the riding skater
  // in every frame.
  const lowest = duckTop - Math.min(...bottoms);
  const highest = rideTop - Math.max(...bottoms) - 1;
  return Math.floor((lowest + highest) / 2);
}

export function createRun(skater, { viewWidth = 300, random = Math.random } = {}) {
  const headAltitudes = {};
  for (const kind of KIND_NAMES) {
    if (KINDS[kind].clear === "duck" || KINDS[kind].clear === "fly") headAltitudes[kind] = headAltitude(skater, kind);
  }
  return {
    skater,
    random,
    viewWidth,
    headAltitudes,
    tick: 0,
    speed: START_SPEED,
    distance: 0,
    score: 0,
    altitude: 0,
    vy: 0,
    airborne: false,
    airTicks: 0,
    ducking: false,
    crashed: false,
    obstacles: [],
    // The first obstacle arrives after a little more than a normal gap.
    untilSpawn: minGap(START_SPEED) * 1.5,
  };
}

// The frame the skater is showing right now.
export function skaterFrame(run) {
  const { frames } = CHARACTERS[run.skater];
  if (run.crashed) return frames.crash[0];
  if (run.airborne) return frames.jump[0];
  if (run.ducking) return frames.duck[0];
  return frames.ride[Math.floor(run.distance / 12) % 2];
}

export function obstacleFrame(run, obstacle) {
  const frames = OBSTACLES[obstacle.kind];
  const frameTicks = KINDS[obstacle.kind].frameTicks ?? 12;
  return frames[Math.floor(run.tick / frameTicks) % frames.length];
}

export function skaterBox(run) {
  const frame = skaterFrame(run);
  return box(frame, SKATER_X, run.altitude, anchorRow(frame), SKATER_INSET);
}

// A group (cones, bollards) is one box spanning every obstacle in it.
export function obstacleBox(run, obstacle) {
  const frame = obstacleFrame(run, obstacle);
  const inset = KINDS[obstacle.kind].inset ?? GROUND_INSET;
  const single = box(frame, obstacle.x, obstacle.altitude, frame.length, inset);
  return { ...single, right: single.right + frame[0].length * (obstacle.count - 1) };
}

// A new obstacle of `kind`, not yet placed.
export function createObstacle(kind, { count = 1, altitude = 0 } = {}) {
  return { kind, count, altitude, width: frameWidth(kind) * count, x: 0 };
}

// Picks a kind at random, by weight, from the ones the score has unlocked.
function pickKind(run) {
  const unlocked = KIND_NAMES.filter((kind) => run.score >= (KINDS[kind].minScore ?? 0));
  const total = unlocked.reduce((sum, kind) => sum + KINDS[kind].weight, 0);
  let roll = run.random() * total;
  for (const kind of unlocked) {
    roll -= KINDS[kind].weight;
    if (roll < 0) return kind;
  }
  return unlocked.at(-1);
}

// Adds the next obstacle just off the right edge and sets how far the
// world travels before the one after it. `overshoot` is how far past zero
// the countdown went this tick, so the gap comes out exact.
export function spawnObstacle(run, overshoot = 0, kind = pickKind(run)) {
  const random = run.random;
  const { clear, maxCount = 1, speed = 0 } = KINDS[kind];
  let count = 1;
  if (maxCount > 1) {
    const most = run.speed >= TRIPLE_SPEED ? maxCount : Math.min(2, maxCount);
    count = 1 + Math.floor(random() * most);
  }
  let altitude = 0;
  if (clear === "duck") altitude = run.headAltitudes[kind];
  if (clear === "fly") altitude = random() < 0.5 ? LOW_PIGEON_ALTITUDE : run.headAltitudes[kind];
  const obstacle = createObstacle(kind, { count, altitude });
  // Something moving at the skater closes on the obstacle ahead of it
  // until it gets there. Starting it further back by that much (plus one
  // tick's worth, as the world moves in whole ticks) keeps the gap between
  // them fair at the moment it counts.
  obstacle.lead = speed ? (speed * (run.viewWidth + 8 - SKATER_X)) / run.speed + speed : 0;
  obstacle.x = run.viewWidth + 8 - overshoot + obstacle.lead;
  run.obstacles.push(obstacle);
  const gap = minGap(run.speed) * (clear === "hold" ? HOLD_GAP : 1) * (1 + random() * GAP_SPREAD);
  run.untilSpawn = obstacle.lead + obstacle.width + gap;
  return obstacle;
}

// Advances the run by one tick. `input` is what's held down right now:
// { jump, duck }. Holding jump on the ground jumps again on landing.
export function step(run, { jump = false, duck = false } = {}) {
  if (run.crashed) return run;

  run.tick += 1;
  run.speed = Math.min(MAX_SPEED, run.speed + ACCELERATION);
  run.distance += run.speed;
  run.score = Math.floor(run.distance * SCORE_PER_PX);

  if (!run.airborne && jump && !duck) {
    run.airborne = true;
    run.vy = JUMP_VELOCITY;
    run.airTicks = 0;
  }
  if (run.airborne) {
    let gravity = GRAVITY;
    if (duck) gravity = FAST_FALL_GRAVITY;
    else if (jump && run.airTicks < HOLD_TICKS) gravity = HOLD_GRAVITY;
    run.altitude += run.vy;
    run.vy -= gravity;
    run.airTicks += 1;
    if (run.altitude <= 0) {
      run.altitude = 0;
      run.vy = 0;
      run.airborne = false;
    }
  }
  run.ducking = !run.airborne && duck;

  for (const obstacle of run.obstacles) obstacle.x -= run.speed + (KINDS[obstacle.kind].speed ?? 0);
  run.obstacles = run.obstacles.filter((obstacle) => obstacle.x + obstacle.width > -8);

  run.untilSpawn -= run.speed;
  if (run.untilSpawn <= 0) spawnObstacle(run, -run.untilSpawn);

  const skater = skaterBox(run);
  if (run.obstacles.some((obstacle) => overlaps(skater, obstacleBox(run, obstacle)))) {
    run.crashed = true;
  }
  return run;
}
