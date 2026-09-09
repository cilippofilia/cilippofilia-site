// Continuous idle drift for the floating app icons on the home page.
// Each icon wanders to a fresh random point (with a small rotation)
// every time it finishes a leg, so it keeps roaming around the hero
// background rather than oscillating between two spots.
//
// Bundled by `bun run build` into web/js/floating-icons.bundle.js so the
// page has no CDN dependency — the site is local-only and must work offline.
import { animate, utils } from "animejs";

document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  // How far an icon may wander from its resting point. Scaled to the
  // window so the drift stays a gentle nudge on a phone instead of
  // carrying an icon off the edge of a 390px screen.
  const amp = Math.max(16, Math.min(52, Math.round(window.innerWidth * 0.05)));
  const ampY = Math.round(amp * 0.85);

  document.querySelectorAll(".floating-icon").forEach((el, i) => {
    const wander = () => {
      animate(el, {
        translateX: utils.random(-amp, amp),
        translateY: utils.random(-ampY, ampY),
        rotate: utils.random(-14, 14),
        duration: utils.random(7000, 12000),
        ease: "inOutSine",
        onComplete: wander,
      });
    };
    setTimeout(wander, i * 300);
  });
});
