// `use:carousel` on a journey card's photo carousel (JourneySection.svelte).
// The markup is just the real photos, so the prerendered page and anyone
// without JavaScript see the first photo and can scroll through the rest.
// On mount this adds a copy of the last photo before the first and of the
// first after the last, so swiping or tapping past either end loops: once
// the scroll settles on a copy, it jumps to the photo it copies.
//
// Native horizontal scrolling with snapping does the swiping. A tap on the
// left or right half of the photo, the dots and the arrow keys drive it.

import { photoAt, settleJump } from "#lib/journey/carousel-loop.js";

export function carousel(node) {
  const controller = new AbortController();
  const { signal } = controller;
  const track = node.querySelector(".journey-track");
  const real = [...track.children];
  const n = real.length;
  const dots = [...node.querySelectorAll(".journey-dots button")];
  const captions = [...node.querySelectorAll(".journey-caption")];
  const smooth = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

  const copy = (slide) => {
    const c = slide.cloneNode(true);
    c.setAttribute("aria-hidden", "true");
    c.inert = true;
    return c;
  };
  const head = copy(real[n - 1]);
  const tail = copy(real[0]);
  track.prepend(head);
  track.append(tail);
  const slides = [head, ...real, tail];

  // The slide whose left edge is nearest the scroll position. Card widths
  // are fractional, so this beats dividing by a rounded clientWidth.
  const nearest = () => {
    let best = 0;
    slides.forEach((slide, k) => {
      if (Math.abs(slide.offsetLeft - track.scrollLeft) < Math.abs(slides[best].offsetLeft - track.scrollLeft))
        best = k;
    });
    return best;
  };
  const show = (k) => {
    const i = photoAt(k, n);
    dots.forEach((dot, j) => {
      dot.classList.toggle("on", j === i);
      if (j === i) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
    captions.forEach((caption, j) => (caption.hidden = j !== i));
  };
  const goTo = (k, behavior = smooth) => {
    track.scrollTo({ left: slides[k].offsetLeft, behavior });
    show(k);
  };
  const settle = () => {
    const k = nearest();
    const jump = settleJump(k, n);
    if (jump === null) show(k);
    else goTo(jump, "auto");
  };

  // scrollend isn't everywhere yet, so a short quiet spell after the last
  // scroll event counts as settled too.
  let timer;
  track.addEventListener(
    "scroll",
    () => {
      clearTimeout(timer);
      timer = setTimeout(settle, 140);
      show(nearest());
    },
    { passive: true, signal }
  );
  track.addEventListener("scrollend", settle, { signal });
  track.addEventListener(
    "click",
    (e) => {
      if (e.target.closest("a")) return;
      const rect = track.getBoundingClientRect();
      goTo(nearest() + (e.clientX - rect.left < rect.width / 2 ? -1 : 1));
    },
    { signal }
  );
  track.addEventListener(
    "keydown",
    (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      goTo(nearest() + (e.key === "ArrowLeft" ? -1 : 1));
    },
    { signal }
  );
  dots.forEach((dot, i) => dot.addEventListener("click", () => goTo(i + 1), { signal }));
  goTo(1, "auto");

  return {
    destroy() {
      controller.abort();
      clearTimeout(timer);
      head.remove();
      tail.remove();
    },
  };
}
