// The journey's card row (actions/card-rail.js): which card's dot is lit for
// a scroll position. Cards snap to the row's left edge, so the lit card is
// the one whose left edge is nearest the scroll position, except once the
// row is scrolled to its end, where the last cards can't reach the left edge
// any more and the last dot lights instead.

/**
 * @param {number[]} lefts each card's left edge within the row
 * @param {number} scrollLeft the row's scroll position
 * @param {number} maxScroll how far the row can scroll at most
 */
export function activeCard(lefts, scrollLeft, maxScroll) {
  if (lefts.length === 0) return -1;
  if (maxScroll > 0 && scrollLeft >= maxScroll - 1) return lefts.length - 1;
  let best = 0;
  lefts.forEach((left, i) => {
    if (Math.abs(left - scrollLeft) < Math.abs(lefts[best] - scrollLeft)) best = i;
  });
  return best;
}
