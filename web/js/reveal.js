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
            settle(entry.target);
          }
        },
        { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
      )
    : null;

// Once an element has arrived, drop `.reveal` so its own transitions apply
// again. `.reveal` replaces the element's transition list with the slow
// entrance one, staggered delay included — left on, an app card took 0.6s
// to lift under the cursor, snapped its border colour, and the sixth card
// waited 0.3s before reacting at all. At rest `.reveal.in-view` and no
// `.reveal` look identical, so removing it is invisible. The timeout covers
// a transitionend that never fires (a tab hidden mid-reveal).
function settle(el) {
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    el.classList.remove("reveal", "in-view");
  };
  el.addEventListener("transitionend", (e) => e.target === el && e.propertyName === "opacity" && finish());
  setTimeout(finish, 1500);
}

export function observeReveal(root = document) {
  if (!io) return;
  root.querySelectorAll(".reveal:not(.in-view)").forEach((el) => io.observe(el));
}

observeReveal();
