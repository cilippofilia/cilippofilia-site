// Continuous idle drift for the floating app icons, via anime.js.
// Each icon wanders to a fresh random point (with a small rotation)
// every time it finishes a leg, so it keeps roaming around the hero
// background rather than oscillating between two spots.
document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || typeof anime !== "function") return;

  // How far an icon may wander from its resting point. Scaled to the
  // window so the drift stays a gentle nudge on a phone instead of
  // carrying an icon off the edge of a 390px screen.
  const amp = Math.max(16, Math.min(52, Math.round(window.innerWidth * 0.05)));

  document.querySelectorAll(".floating-icon").forEach((el, i) => {
    const wander = () => {
      anime({
        targets: el,
        translateX: () => anime.random(-amp, amp),
        translateY: () => anime.random(-Math.round(amp * 0.85), Math.round(amp * 0.85)),
        rotate: () => anime.random(-14, 14),
        duration: () => anime.random(7000, 12000),
        easing: "easeInOutSine",
        complete: wander,
      });
    };
    setTimeout(wander, i * 300);
  });
});
