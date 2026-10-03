<script>
  import { onMount } from "svelte";

  // Continuous idle drift for the floating app icons behind the hero. Each
  // icon wanders to a fresh random point (with a small rotation) every time
  // it finishes a leg, so it keeps roaming rather than oscillating between
  // two spots.
  let root;

  onMount(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let stopped = false;
    const animations = [];
    const timers = [];

    // animejs is imported here, not at the top, so it only loads in the
    // browser and only when motion is allowed.
    import("animejs").then(({ animate, utils }) => {
      if (stopped) return;
      // How far an icon may wander from its resting point. Scaled to the
      // window so the drift stays a gentle nudge on a phone instead of
      // carrying an icon off the edge of a 390px screen.
      const amp = Math.max(16, Math.min(52, Math.round(window.innerWidth * 0.05)));
      const ampY = Math.round(amp * 0.85);

      root.querySelectorAll(".floating-icon").forEach((el, i) => {
        const wander = () => {
          if (stopped) return;
          animations.push(
            animate(el, {
              translateX: utils.random(-amp, amp),
              translateY: utils.random(-ampY, ampY),
              rotate: utils.random(-14, 14),
              duration: utils.random(7000, 12000),
              ease: "inOutSine",
              onComplete: wander,
            })
          );
        };
        timers.push(setTimeout(wander, i * 300));
      });
    });

    return () => {
      stopped = true;
      timers.forEach(clearTimeout);
      animations.forEach((a) => a.pause());
    };
  });
</script>

<div class="floating-icons" aria-hidden="true" bind:this={root}>
  <img
    class="floating-icon fi-1"
    src="/assets/app-icons/thumb/9tiles-icon.png"
    alt=""
    title="9 Tiles Puzzle"
    width="96"
    height="96"
  />
  <img
    class="floating-icon fi-2"
    src="/assets/app-icons/thumb/drinko-icon.png"
    alt=""
    title="Drinko"
    width="76"
    height="76"
  />
  <img
    class="floating-icon fi-3"
    src="/assets/app-icons/thumb/iterly-icon.png"
    alt=""
    title="Iterly"
    width="88"
    height="88"
  />
  <img
    class="floating-icon fi-4"
    src="/assets/app-icons/thumb/itsWritten-icon.png"
    alt=""
    title="itsWritten"
    width="80"
    height="80"
  />
  <img
    class="floating-icon fi-5"
    src="/assets/app-icons/thumb/relay-icon.png"
    alt=""
    title="relay"
    width="92"
    height="92"
  />
</div>
