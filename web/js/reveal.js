// Scroll-reveal for `.reveal` elements (see components.css): fades each one
// up into place the first time it crosses into the viewport, via
// IntersectionObserver so it costs nothing until it actually fires.
//
// App cards and the featured strip are rendered after their fetch resolves
// (apps-feed.js), so they don't exist yet when this module first runs —
// call observeReveal() again after inserting new `.reveal` elements.

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const io =
  !reduceMotion && "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        },
        { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
      )
    : null;

export function observeReveal(root = document) {
  if (!io) return;
  root.querySelectorAll(".reveal:not(.in-view)").forEach((el) => io.observe(el));
}

observeReveal();
