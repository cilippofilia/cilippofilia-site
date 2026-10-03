// The gesture behind the site's own pull-to-refresh indicator. Safari's
// native one is switched off on these pages (overscroll-behavior-y: none),
// because its rubber-band drags the page out from under the intro's fixed
// hero image; this gives the same "pull down at the top to reload" without
// moving the page at all. Pure, so the feel can be tested.

// How far the indicator can travel, and how far it has to come before
// letting go reloads, both in px of indicator travel (not finger travel).
export const MAX_PULL = 120;
export const PULL_THRESHOLD = 72;

// A pull starts only with one finger on a touch screen, with the page at
// the top, and never inside a game (a swipe there is a move, not a pull).
// Safari before overscroll-behavior support can report a negative scrollY
// mid-bounce, which is still the top.
export function canStartPull({ scrollY, coarse, insideGame, touches }) {
  return coarse && !insideGame && touches === 1 && scrollY <= 0;
}

// Finger travel → indicator travel. Eases towards MAX_PULL so the pull
// feels heavier the further it goes, like the native one.
export function pullDistance(dragY) {
  if (dragY <= 0) return 0;
  return MAX_PULL * (1 - Math.exp(-dragY / MAX_PULL));
}

// "armed" means letting go now reloads the page.
export function pullState(distance) {
  if (distance <= 0) return "idle";
  return distance >= PULL_THRESHOLD ? "armed" : "pulling";
}
