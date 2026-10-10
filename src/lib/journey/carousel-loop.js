// The looping carousel's index arithmetic (actions/carousel.js). The track
// holds n photos with a copy of the last one before them and a copy of the
// first one after them, so track positions run 0…n+1 and photo i sits at
// position i + 1.

/** The photo (0…n-1) shown at track position k, copies included. */
export function photoAt(k, n) {
  return (((k - 1) % n) + n) % n;
}

/**
 * Where to jump, without animating, once a scroll settles on position k: a
 * copy at either end hands over to the photo it copies. Null when k is
 * already a real photo.
 */
export function settleJump(k, n) {
  if (k <= 0) return n;
  if (k >= n + 1) return 1;
  return null;
}
