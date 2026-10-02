// Pure state transitions for the "whack-a-broken-link" 404 minigame.
// Kept free of DOM/timer APIs so it can be unit tested directly; the DOM
// wiring (spawning/removing chip elements, timers) lives in notfound-game.js.

// The round has no time limit — it runs until MISS_LIMIT is reached.
// DIFFICULTY_RAMP_MS is unrelated to round length: it's just how long the
// chip-lifetime ramp below takes to reach its floor, after which every
// chip stays at CHIP_LIFETIME_END_MS for as long as the round continues.
export const DIFFICULTY_RAMP_MS = 20000;
export const MISS_LIMIT = 4;

// A chip's onscreen lifetime shrinks as the round goes on, so hits get
// slightly harder to land the longer a round runs.
export const CHIP_LIFETIME_START_MS = 1700;
export const CHIP_LIFETIME_END_MS = 950;

const FAKE_PATHS = [
  "/blog/2019/old-post",
  "/legacy/api/v1",
  "/docs/v0/getting-started",
  "/archive/photos/2016",
  "/beta/signup",
  "/old-portfolio",
  "/wp-content/uploads",
  "/api/deprecated",
];

export function randomPath(rand = Math.random) {
  return FAKE_PATHS[Math.floor(rand() * FAKE_PATHS.length)];
}

export function createGameState() {
  return { status: "idle", score: 0, misses: 0, startedAt: null };
}

export function startRound(now) {
  return { status: "playing", score: 0, misses: 0, startedAt: now };
}

export function registerHit(state) {
  if (state.status !== "playing") return state;
  return { ...state, score: state.score + 1 };
}

export function registerMiss(state) {
  if (state.status !== "playing") return state;
  const misses = state.misses + 1;
  if (misses >= MISS_LIMIT) return { ...state, misses, status: "ended" };
  return { ...state, misses };
}

export function chipLifetimeMs(state, now) {
  if (state.startedAt == null) return CHIP_LIFETIME_START_MS;
  const fraction = Math.min(1, Math.max(0, (now - state.startedAt) / DIFFICULTY_RAMP_MS));
  return CHIP_LIFETIME_START_MS - (CHIP_LIFETIME_START_MS - CHIP_LIFETIME_END_MS) * fraction;
}

// The best-score line shown on the idle hint and the result panel. Blank
// when there's no best on record yet (server unreachable, or nobody has
// scored above 0), so callers can just hide the element on an empty string.
export function bestLineText(score, best) {
  if (!best) return "";
  if (score > 0 && score === best) return "New best!";
  return `Best: ${best}`;
}

// A short line of flavor text for the end-of-round result panel, keyed to
// score so a round always closes with some personality rather than a flat
// "you scored N" readout.
export function resultFlavor(score) {
  if (score === 0) return "Even the void didn't want these.";
  if (score <= 2) return "A start. Barely.";
  if (score <= 5) return "Not bad for a page that doesn't exist.";
  if (score <= 9) return "You've got a nose for broken links.";
  return "At this point, you're the broken one.";
}
