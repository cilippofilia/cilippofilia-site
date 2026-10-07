import { test, expect } from "bun:test";
import { CHARACTERS, OBSTACLES } from "./runner-sprites.js";
import {
  createRun,
  step,
  spawnObstacle,
  createObstacle,
  overlaps,
  minGap,
  skaterBox,
  obstacleBox,
  KINDS,
  SKATER_X,
  START_SPEED,
  MAX_SPEED,
  TRIPLE_SPEED,
  LOW_PIGEON_ALTITUDE,
} from "./runner-logic.js";

const SKATERS = Object.keys(CHARACTERS);

// A run with nothing coming, so a test can place its own obstacle.
function quietRun(skater = "ollie", speed = START_SPEED) {
  const run = createRun(skater, { random: () => 0 });
  run.speed = speed;
  run.untilSpawn = Infinity;
  return run;
}

// Seeded so a long simulated run is the same every time.
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 2 ** 32;
    return s / 2 ** 32;
  };
}

// Plays one obstacle placed `lead` px ahead of the skater, holding `input`
// for the first `holdTicks` ticks, and reports whether it got past.
function survives(run, obstacle, { lead, input = {}, holdTicks = Infinity }) {
  run.obstacles = [{ ...obstacle, x: SKATER_X + lead }];
  for (let tick = 0; tick < 400 && !run.crashed; tick++) {
    step(run, tick < holdTicks ? input : {});
    if (run.obstacles.length === 0) break;
  }
  return !run.crashed;
}

// True if some moment to press jump gets the skater past the obstacle.
// The obstacle starts clear of the skater's 24px frame: one already level
// with them would slip past a narrow post before it could hit anything.
function jumpable(skater, obstacle, speed, holdTicks) {
  for (let lead = 24; lead <= 200; lead++) {
    if (survives(quietRun(skater, speed), obstacle, { lead, input: { jump: true }, holdTicks })) return true;
  }
  return false;
}

// A tap lets go of jump straight away; a held jump keeps it down through
// the whole boost but lets go before landing, so it doesn't jump twice.
const TAP = 1;
const HOLD = 30;

const kindsThat = (clear) => Object.keys(KINDS).filter((kind) => KINDS[kind].clear === clear);
// The biggest group a kind comes in at `speed`, as spawnObstacle decides it.
const biggest = (kind, speed) => {
  const most = KINDS[kind].maxCount ?? 1;
  return createObstacle(kind, { count: speed >= TRIPLE_SPEED ? most : Math.min(2, most) });
};

test("a jump leaves the ground and lands back on it", () => {
  const run = quietRun();
  step(run, { jump: true });
  expect(run.airborne).toBe(true);
  for (let tick = 0; tick < 60; tick++) step(run);
  expect(run.airborne).toBe(false);
  expect(run.altitude).toBe(0);
});

test("holding jump goes higher than tapping it", () => {
  const peak = (holdTicks) => {
    const run = quietRun();
    let highest = 0;
    for (let tick = 0; tick < 80; tick++) {
      step(run, { jump: tick < holdTicks });
      highest = Math.max(highest, run.altitude);
    }
    return highest;
  };
  expect(peak(30)).toBeGreaterThan(peak(1) + 10);
  // Holding past the boost window doesn't keep raising the jump.
  expect(peak(30)).toBe(peak(25));
});

test("holding duck on the ground ducks, and in the air lands sooner", () => {
  const run = quietRun();
  step(run, { duck: true });
  expect(run.ducking).toBe(true);

  const landing = (duckFrom) => {
    const r = quietRun();
    step(r, { jump: true });
    let ticks = 1;
    while (r.airborne) {
      step(r, { duck: ticks >= duckFrom });
      ticks += 1;
    }
    return ticks;
  };
  expect(landing(5)).toBeLessThan(landing(Infinity));
});

test("speed rises over time and stops at the cap", () => {
  const run = quietRun();
  step(run);
  expect(run.speed).toBeGreaterThan(START_SPEED);
  for (let tick = 0; tick < 20000; tick++) step(run);
  expect(run.speed).toBe(MAX_SPEED);
});

test("the score rises with distance", () => {
  const run = quietRun();
  for (let tick = 0; tick < 120; tick++) step(run);
  const early = run.score;
  for (let tick = 0; tick < 120; tick++) step(run);
  expect(early).toBeGreaterThan(0);
  expect(run.score).toBeGreaterThan(early);
});

test("overlapping boxes collide, touching ones don't", () => {
  const a = { left: 0, right: 10, bottom: 0, top: 10 };
  expect(overlaps(a, { left: 9, right: 20, bottom: 9, top: 20 })).toBe(true);
  expect(overlaps(a, { left: 10, right: 20, bottom: 0, top: 10 })).toBe(false);
  expect(overlaps(a, { left: 0, right: 10, bottom: 10, top: 20 })).toBe(false);
});

test("riding into a cone ends the run", () => {
  expect(survives(quietRun(), createObstacle("cone"), { lead: 40 })).toBe(false);
});

test("every obstacle kind has a sprite, and every sprite a kind", () => {
  expect(Object.keys(KINDS).sort()).toEqual(Object.keys(OBSTACLES).sort());
});

test("every gap between obstacles is at least the minimum for its speed", () => {
  const run = createRun("ollie", { random: seeded(7) });
  run.score = Infinity;
  for (let i = 0; i < 500; i++) {
    run.speed = START_SPEED + (i / 500) * (MAX_SPEED - START_SPEED);
    const obstacle = spawnObstacle(run);
    const gap = run.untilSpawn - obstacle.lead - obstacle.width;
    expect(gap).toBeGreaterThanOrEqual(minGap(run.speed));
    // Scroll the world on to the next spawn: the new obstacle then starts
    // exactly that gap behind this one.
    for (const o of run.obstacles) o.x -= run.untilSpawn;
    const next = spawnObstacle(run, 0, "cone");
    expect(next.x - (obstacle.x + obstacle.width)).toBeCloseTo(gap);
    run.obstacles = [];
  }
});

test("a moving obstacle hasn't closed the gap behind the one ahead by the time it reaches the skater", () => {
  for (const kind of Object.keys(KINDS).filter((k) => KINDS[k].speed)) {
    for (const speed of [START_SPEED, MAX_SPEED]) {
      const run = createRun("ollie", { random: () => 0 });
      run.speed = speed;
      const ahead = spawnObstacle(run, 0, "cone");
      ahead.x -= run.untilSpawn;
      const mover = spawnObstacle(run, 0, kind);
      while (mover.x > SKATER_X) {
        ahead.x -= speed;
        mover.x -= speed + KINDS[kind].speed;
      }
      const gap = mover.x - (ahead.x + ahead.width);
      expect(`${kind}@${speed}:${gap >= minGap(speed) - 1e-9}`).toBe(`${kind}@${speed}:true`);
    }
  }
});

test("no kind turns up before its score, and they all turn up eventually", () => {
  const seen = new Set();
  const run = createRun("ollie", { random: seeded(3) });
  const thresholds = new Set(Object.values(KINDS).map((k) => k.minScore ?? 0));
  const scores = [...thresholds].flatMap((score) => [score - 1, score]).filter((score) => score >= 0);
  for (const score of [...scores, 5000]) {
    run.score = score;
    for (let i = 0; i < 400; i++) {
      const { kind } = spawnObstacle(run);
      expect(`${kind}@${score}:${score >= (KINDS[kind].minScore ?? 0)}`).toBe(`${kind}@${score}:true`);
      seen.add(kind);
    }
  }
  expect([...seen].sort()).toEqual(Object.keys(KINDS).sort());
});

test("groups of three only appear once the skater is fast enough", () => {
  const counts = (speed) => {
    const run = createRun("ollie", { random: seeded(5) });
    run.speed = speed;
    return new Set(Array.from({ length: 400 }, () => spawnObstacle(run).count));
  };
  expect(counts(TRIPLE_SPEED - 0.01).has(3)).toBe(false);
  expect(counts(TRIPLE_SPEED).has(3)).toBe(true);
});

test("every skater can tap-jump every low obstacle at the slowest and fastest speeds", () => {
  for (const kind of kindsThat("tap")) {
    for (const speed of [START_SPEED, TRIPLE_SPEED, MAX_SPEED]) {
      for (const skater of SKATERS) {
        const ok = jumpable(skater, biggest(kind, speed), speed, TAP);
        expect(`${kind}@${speed}:${skater}:${ok}`).toBe(`${kind}@${speed}:${skater}:true`);
      }
    }
  }
});

test("every skater can clear every tall obstacle with a held jump, but not a tap", () => {
  for (const kind of kindsThat("hold")) {
    for (const speed of [START_SPEED, MAX_SPEED]) {
      for (const skater of SKATERS) {
        const held = jumpable(skater, createObstacle(kind), speed, HOLD);
        const tapped = jumpable(skater, createObstacle(kind), speed, TAP);
        expect(`${kind}@${speed}:${skater}:${held}:${tapped}`).toBe(`${kind}@${speed}:${skater}:true:false`);
      }
    }
  }
});

test("every skater ducks under every overhead obstacle but hits it riding", () => {
  for (const kind of [...kindsThat("duck"), ...kindsThat("fly")]) {
    for (const skater of SKATERS) {
      const run = createRun(skater);
      const overhead = createObstacle(kind, { altitude: run.headAltitudes[kind] });
      for (const speed of [START_SPEED, MAX_SPEED]) {
        const ducked = survives(quietRun(skater, speed), overhead, { lead: 60, input: { duck: true } });
        const riding = survives(quietRun(skater, speed), overhead, { lead: 60 });
        expect(`${kind}@${speed}:${skater}:${ducked}:${riding}`).toBe(`${kind}@${speed}:${skater}:true:false`);
      }
    }
  }
});

test("an overhead obstacle clears a ducked skater in every animation frame", () => {
  for (const kind of [...kindsThat("duck"), ...kindsThat("fly")]) {
    for (const skater of SKATERS) {
      const run = quietRun(skater);
      run.ducking = true;
      const frameTicks = KINDS[kind].frameTicks ?? 12;
      for (let frame = 0; frame < OBSTACLES[kind].length; frame++) {
        run.tick = frame * frameTicks;
        const overhead = { ...createObstacle(kind, { altitude: run.headAltitudes[kind] }), x: SKATER_X };
        expect(`${kind}:${skater}:${overlaps(skaterBox(run), obstacleBox(run, overhead))}`).toBe(
          `${kind}:${skater}:false`
        );
      }
    }
  }
});

test("every skater can jump a low bird but not duck under it", () => {
  for (const kind of kindsThat("fly")) {
    for (const skater of SKATERS) {
      const bird = createObstacle(kind, { altitude: LOW_PIGEON_ALTITUDE });
      const ducked = survives(quietRun(skater, MAX_SPEED), bird, { lead: 60, input: { duck: true } });
      expect(`${kind}:${skater}:${ducked}`).toBe(`${kind}:${skater}:false`);
      for (const speed of [START_SPEED, MAX_SPEED]) {
        expect(`${kind}@${speed}:${skater}:${jumpable(skater, bird, speed, TAP)}`).toBe(
          `${kind}@${speed}:${skater}:true`
        );
      }
    }
  }
});
