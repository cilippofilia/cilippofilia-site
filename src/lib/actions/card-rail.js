// `use:cardRail` on the journey's card row (JourneySection.svelte). CSS sets
// how many cards fit side by side; when a place has more than that, the row
// scrolls sideways one card at a time and this shows the dots and the ‹ ›
// buttons under it. When everything fits, the controls stay hidden.
//
// Unlike the photo carousel there are no tap zones (cards hold photos and
// links of their own) and no loop: the row stops at its first and last card.

import { activeCard } from "#lib/journey/card-rail.js";

export function cardRail(node) {
  const controller = new AbortController();
  const { signal } = controller;
  const row = node.querySelector(".journey-cards");
  const bar = node.querySelector(".journey-rail-bar");
  const dots = [...bar.querySelectorAll(".journey-rail-dots button")];
  const prev = bar.querySelector("[data-dir='-1']");
  const next = bar.querySelector("[data-dir='1']");
  const cards = [...row.children];
  const smooth = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

  const maxScroll = () => row.scrollWidth - row.clientWidth;
  const current = () =>
    activeCard(
      cards.map((c) => c.offsetLeft),
      row.scrollLeft,
      maxScroll()
    );
  const show = () => {
    const overflowing = maxScroll() > 1;
    bar.hidden = !overflowing;
    if (!overflowing) return;
    const i = current();
    dots.forEach((dot, j) => {
      dot.classList.toggle("on", j === i);
      if (j === i) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
    prev.disabled = row.scrollLeft <= 1;
    next.disabled = row.scrollLeft >= maxScroll() - 1;
  };
  const goTo = (i) => {
    const card = cards[Math.max(0, Math.min(cards.length - 1, i))];
    row.scrollTo({ left: card.offsetLeft, behavior: smooth });
  };

  row.addEventListener("scroll", show, { passive: true, signal });
  prev.addEventListener("click", () => goTo(current() - 1), { signal });
  next.addEventListener("click", () => goTo(current() + 1), { signal });
  dots.forEach((dot, i) => dot.addEventListener("click", () => goTo(i), { signal }));

  // Whether the cards overflow changes with the window, so watch the row.
  const resize = new ResizeObserver(show);
  resize.observe(row);
  show();

  return {
    destroy() {
      controller.abort();
      resize.disconnect();
    },
  };
}
