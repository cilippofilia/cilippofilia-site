<!-- Injected rather than emitted as a stylesheet: the root error page renders
     this too, and anything that page imports loads on every page of the site
     (see css.md). -->
<svelte:options css="injected" />

<script>
  import { onMount } from "svelte";
  import { PULL_THRESHOLD, canStartPull, pullDistance, pullState } from "#lib/pull-to-refresh.js";

  // The site's own pull-to-refresh, for touch screens. Safari's native one
  // drags the whole page down from the top, which leaves the intro's fixed
  // hero image floating while the page slides away under it, so it is
  // switched off while this is mounted and replaced with an indicator that
  // slides out from under the header instead. The page itself never moves.

  // Swipes that start in these are game moves, or drags of the journey map
  // its card row and its photo carousels, not pulls.
  const GAME_AREAS =
    ".maze-game-screen, .runner-game-screen, .notfound-game-screen, .journey-map, .journey-track, .journey-cards";
  const SIZE = 40;
  const GAP = 12;

  let distance = $state(0);
  let refreshing = $state(false);
  let dragging = $state(false);
  let headerBottom = $state(0);
  let reduceMotion = $state(false);

  const state = $derived(refreshing ? "refreshing" : pullState(distance));
  const progress = $derived(Math.min(distance / PULL_THRESHOLD, 1));
  // Parked fully behind the header until pulled. With reduced motion it
  // doesn't travel at all, it just fades in at its resting spot.
  const offset = $derived(
    reduceMotion ? headerBottom + GAP : headerBottom - SIZE + distance * ((SIZE + GAP) / PULL_THRESHOLD)
  );
  // The arrow turns with the pull and points up once letting go will reload.
  const turn = $derived(reduceMotion ? (state === "armed" ? 180 : 0) : progress * 180);

  onMount(() => {
    const root = document.documentElement;
    const previousOverscroll = root.style.overscrollBehaviorY;
    root.style.overscrollBehaviorY = "none";

    reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)");
    const header = document.querySelector("header.site-header");
    const controller = new AbortController();
    const { signal } = controller;
    let startY = null;

    function reset() {
      startY = null;
      dragging = false;
      distance = 0;
    }

    window.addEventListener(
      "touchstart",
      (e) => {
        if (refreshing) return;
        const allowed = canStartPull({
          scrollY: window.scrollY,
          coarse: coarse.matches,
          insideGame: Boolean(e.target.closest?.(GAME_AREAS)),
          touches: e.touches.length,
        });
        startY = allowed ? e.touches[0].clientY : null;
        if (allowed) headerBottom = header ? header.getBoundingClientRect().bottom : 0;
      },
      { passive: true, signal }
    );

    window.addEventListener(
      "touchmove",
      (e) => {
        if (startY === null) return;
        // A second finger, or the page starting to scroll, means this was
        // never a pull.
        if (e.touches.length !== 1 || window.scrollY > 0) return reset();
        dragging = true;
        distance = pullDistance(e.touches[0].clientY - startY);
      },
      { passive: true, signal }
    );

    window.addEventListener(
      "touchend",
      () => {
        if (startY === null) return;
        startY = null;
        dragging = false;
        if (pullState(distance) !== "armed") {
          distance = 0;
          return;
        }
        // Hold at the threshold with the spinner showing for a moment, so
        // the reload reads as the result of the pull rather than a flash.
        refreshing = true;
        distance = PULL_THRESHOLD;
        setTimeout(() => !signal.aborted && location.reload(), 300);
      },
      { passive: true, signal }
    );

    window.addEventListener("touchcancel", reset, { passive: true, signal });

    return () => {
      controller.abort();
      root.style.overscrollBehaviorY = previousOverscroll;
    };
  });
</script>

<div
  class="ptr"
  class:is-dragging={dragging}
  data-state={state}
  aria-hidden="true"
  style:transform="translate(-50%, {offset}px)"
  style:opacity={reduceMotion || state === "refreshing" ? progress : Math.min(progress * 1.5, 1)}
>
  {#if state === "refreshing"}
    <span class="ptr-spinner"></span>
  {:else}
    <svg class="ptr-arrow" viewBox="0 0 24 24" width="20" height="20" style:transform="rotate({turn}deg)">
      <path
        d="M12 5v14M6 13l6 6 6-6"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  {/if}
</div>

<style>
  /* Floating chrome, so it gets the glass material; it sits below the
     header rather than on it, so glass never stacks. */
  .ptr {
    position: fixed;
    top: 0;
    left: 50%;
    z-index: 19; /* just under the header, which it slides out from */
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border-radius: var(--radius-pill);
    color: var(--text);
    background: var(--glass-fill);
    -webkit-backdrop-filter: var(--glass-blur);
    backdrop-filter: var(--glass-blur);
    border: 1px solid var(--glass-border);
    box-shadow:
      var(--glass-shadow),
      inset 0 1px 0 var(--glass-highlight);
    pointer-events: none;
    opacity: 0;
    transition:
      transform 0.35s var(--ease-spring),
      opacity 0.2s ease;
  }

  /* While the finger is down the indicator follows it exactly. */
  .ptr.is-dragging {
    transition: none;
  }

  .ptr[data-state="armed"] {
    color: var(--accent);
  }

  .ptr-arrow {
    transition: transform 0.2s var(--ease-spring);
  }

  .ptr-spinner {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid var(--glass-border);
    border-top-color: var(--accent);
    animation: ptr-spin 0.7s linear infinite;
  }

  @keyframes ptr-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @supports not (backdrop-filter: blur(1px)) {
    .ptr {
      background: var(--glass-fill-strong);
    }
  }

  @media (prefers-reduced-transparency: reduce) {
    .ptr {
      background: var(--glass-fill-strong);
      -webkit-backdrop-filter: none;
      backdrop-filter: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ptr,
    .ptr-arrow {
      transition: opacity 0.2s ease;
    }

    .ptr-spinner {
      animation: none;
    }
  }
</style>
