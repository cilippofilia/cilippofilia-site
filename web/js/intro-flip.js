// The intro's scroll-linked animation: the flip card, and the profile
// card it assembles into. See index.html for the markup it drives.

// Scroll-linked, three-phase "shared element" transition:
//  1. the big intro cutout turns a half-circle about its vertical axis.
//     Backface culling means it vanishes entirely as it passes edge-on at
//     90deg, and what comes round the other side is the same crop with
//     its background intact, cropped to a circle — which then shrinks
//     into the small avatar as the turn finishes.
//  2. a cloned profile-card (parked at that same avatar spot) fades in
//     its background/border/shadow plus the name, role, bio and social
//     row underneath the settled avatar — built in place, nothing
//     travels yet.
//  3. the fully-built clone flies over to the real sidebar slot, tilting
//     slightly away and lifting toward the viewer on the way across, then
//     settling flat before it lands exactly on the real .profile-card,
//     which then swaps in.
//
// Phases 1-2 happen while #intro-pin is pinned on screen via CSS
// `position: sticky` (see .intro.pin-active in styles.css) — the page
// doesn't visually scroll until the card has finished forming, so it
// can't scroll out of view mid-build. All positions are read live via
// getBoundingClientRect() every frame with no scrollY math: while
// pinned, the wrap's viewport rect simply doesn't change, so nothing
// needs correcting for scroll; once the pin releases for phase 3, both
// the parked reference point and the real card move up in lockstep with
// scroll, so the interpolation still lands exactly on the real card at
// p3 = 1 by construction.
document.addEventListener("DOMContentLoaded", () => {
  const flip = document.getElementById("hero-flip");
  const flipInner = document.getElementById("hero-flip-inner");
  const flyerBlur = document.getElementById("hero-flyer-blur");
  const ghost = document.getElementById("intro-photo-ghost");
  const intro = document.getElementById("intro");
  const introPin = document.getElementById("intro-pin");
  const header = document.querySelector("header.site-header");
  const realCard = document.querySelector(".profile-card");
  const realPhoto = document.querySelector(".profile-photo");
  const floatingIcons = document.querySelector(".floating-icons");
  if (!flip || !flipInner || !ghost || !intro || !introPin || !realCard || !realPhoto) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    flip.remove();
    if (flyerBlur) flyerBlur.remove();
    return;
  }

  intro.classList.add("pin-active");
  introPin.style.top = (header ? header.offsetHeight : 0) + "px";
  flip.classList.add("is-fixed");
  // The icons are absolutely positioned at top:0 of the document (so
  // their natural, unpinned viewport top is always just -scrollY) — held
  // fixed at their scroll-Y=pinStart position for the length of the pin,
  // then left fixed permanently with a live top so they keep scrolling
  // away continuously from that frozen point with no jump, rather than
  // snapping back to their "natural" (much further scrolled) position.
  if (floatingIcons) floatingIcons.style.position = "fixed";

  // The clone stands in for the real card during the whole animation —
  // the real one stays invisible (and out of the tab order) until it
  // lands, so there's no duplicate content sitting on the page early.
  const flyingCard = realCard.cloneNode(true);
  flyingCard.classList.add("flying-card");
  flyingCard.setAttribute("aria-hidden", "true");
  flyingCard.querySelectorAll("a").forEach((a) => (a.tabIndex = -1));
  const chrome = document.createElement("div");
  chrome.className = "fc-chrome";
  flyingCard.insertBefore(chrome, flyingCard.firstChild);
  document.body.appendChild(flyingCard);
  const flyingPhoto = flyingCard.querySelector(".profile-photo");
  const flyingRest = Array.from(flyingCard.children).filter(
    (el) => el !== chrome && el !== flyingPhoto
  );

  let phase3Dist = 450; // px of natural scroll, after the pin releases, to fly+spin the card home
  let pinStart = 0; // scrollY at which #intro-pin starts sticking
  let pinBuffer = 1; // extra scroll distance the pin consumes (phases 1-2)
  let flyerBaseW = 1; // the cutout's resting size, set once per measure so
  let flyerBaseH = 1; // update() can scale it instead of re-laying it out
  let ticking = false;
  let flipIdle = null; // whether the flip card's layers are currently parked

  // The flip card is a nested 3D rendering context on its own composited
  // layer, and it is completely finished — and invisible — from the
  // handoff onwards, so it drops its will-change hints rather than
  // holding those layers alive for the rest of the page. Edge-triggered:
  // rewriting will-change every frame would defeat the point of it.
  function setFlipIdle(idle) {
    if (idle === flipIdle) return;
    flipIdle = idle;
    flip.style.willChange = idle ? "auto" : "transform, opacity";
    flipInner.style.willChange = idle ? "auto" : "transform";
  }

  function measure() {
    // #intro is a plain (non-sticky) block, so its rect is always its
    // true document position, even while the child pin is stuck.
    const introRect = intro.getBoundingClientRect();
    const headerHeight = header ? header.offsetHeight : 0;
    pinStart = introRect.top + window.scrollY - headerHeight;
    pinBuffer = Math.max(intro.offsetHeight - introPin.offsetHeight, 1);
    introPin.style.top = headerHeight + "px";
    flyingCard.style.width = realCard.getBoundingClientRect().width + "px";
    // Short viewports would otherwise spend most of the screen mid-flight.
    phase3Dist = Math.min(450, window.innerHeight * 0.6);
    // The flip card is sized once, here, and only ever scaled per frame —
    // width/height are layout properties and animating them every frame
    // is what made the shrink stutter. Both faces are inset:0 inside it,
    // so sizing the box sizes them together and they cannot drift apart.
    const ghostRect = ghost.getBoundingClientRect();
    flyerBaseW = Math.max(ghostRect.width, 1);
    flyerBaseH = Math.max(ghostRect.height, 1);
    flip.style.width = flyerBaseW + "px";
    flip.style.height = flyerBaseH + "px";
    update();
  }

  function lerp(a, b, p) {
    return a + (b - a) * p;
  }

  // Smoothstep, not easeOutCubic: it has zero slope at *both* ends, so
  // applying it per phase stays velocity-continuous across the phase
  // boundaries. easeOutCubic starts at slope 3, which meant every phase
  // lurched on its first few pixels of scroll and then crawled — the
  // main reason the whole thing read as clunky.
  function smoothstep(p) {
    return p * p * (3 - 2 * p);
  }

  // Phase 1 only. smoothstep has zero slope at *both* ends, which is what
  // keeps the later phase boundaries from lurching — but at the very
  // start of the page there is no previous phase to be continuous with,
  // and a flat start means the first ~30px of scroll produce almost no
  // visible change. easeOutQuad leaves at slope 2, so the shrink answers
  // the first pixel of scroll, and still arrives at zero slope for the
  // handover into phase 2.
  function easeOutQuad(p) {
    return 1 - (1 - p) * (1 - p);
  }

  function clamp01(v) {
    return Math.min(1, Math.max(0, v));
  }

  function phaseProgress(raw, start, end) {
    return smoothstep(clamp01((raw - start) / (end - start)));
  }

  function update() {
    ticking = false;
    const scrollY = window.scrollY;
    const raw12 = clamp01((scrollY - pinStart) / pinBuffer);
    const raw3 = clamp01((scrollY - (pinStart + pinBuffer)) / phase3Dist);

    // The turn answers the first pixel of scroll (easeOutQuad leaves at
    // slope 2) and decelerates into face-on, arriving at 180deg at
    // raw12 = 0.5. It passes 90deg — the frame where both faces are
    // edge-on, nothing is drawn, and the cutout becomes the circle — at
    // raw12 ~= 0.146.
    const pFlip = easeOutQuad(clamp01(raw12 / 0.5));
    // The shrink starts just past that swap, so the cutout turns at full
    // size and it is the circle, already swapped in, that travels down
    // into the card. Every stage overlaps the next (swap 0.15, turn ends
    // 0.5, card starts building 0.5, shrink ends 0.6, handoff 0.6-0.7) so
    // nothing is ever momentarily stalled on its own.
    const pShrink = phaseProgress(raw12, 0.15, 0.6);
    const p2 = phaseProgress(raw12, 0.5, 1);
    // Crossfade to the clone's own avatar once the shrink has finished:
    // by then the two are the same image at the same size in the same
    // place, so the swap is invisible.
    const pHand = phaseProgress(raw12, 0.6, 0.7);
    // The flight has to be *finished* before the crossfade starts, not
    // merely nearly finished: the clone and the real card are the same
    // artwork, so any gap between them at the moment both are part-opaque
    // reads as the card duplicating itself. Mapping the travel onto
    // 0..fadeStart lands it exactly on the real card at the first frame
    // of the fade, which makes the two pixel-identical and the handoff
    // invisible. (Ending the travel at raw3 = 1 instead left it ~3% of
    // the way out — around 20px — for the whole crossfade.)
    const fadeStart = 0.9;
    const p3 = smoothstep(clamp01(raw3 / fadeStart));

    if (floatingIcons) {
      floatingIcons.style.top = -(pinStart + Math.max(0, scrollY - (pinStart + pinBuffer))) + "px";
    }

    const wrapRect = ghost.getBoundingClientRect();
    const realCardRect = realCard.getBoundingClientRect();
    const realPhotoRect = realPhoto.getBoundingClientRect();

    const photoW = realPhoto.offsetWidth;
    const photoH = realPhoto.offsetHeight;
    const wrapCenterX = wrapRect.left + wrapRect.width / 2;
    const wrapCenterY = wrapRect.top + wrapRect.height / 2;
    const parkPhoto = {
      top: wrapCenterY - photoH / 2,
      left: wrapCenterX - photoW / 2,
      width: photoW,
      height: photoH,
    };

    // Where the photo sits relative to the card's own top-left corner —
    // used to park/land the *card* so its photo ends up in the right spot.
    const photoOffsetX = realPhotoRect.left - realCardRect.left;
    const photoOffsetY = realPhotoRect.top - realCardRect.top;
    const parkCard = { top: parkPhoto.top - photoOffsetY, left: parkPhoto.left - photoOffsetX };

    // Phase 1 — the card turns a half-circle about its vertical axis and,
    // from the halfway point on, shrinks from its resting size down to the
    // small avatar circle. Both boxes are square (.intro-photo-wrap is
    // aspect-ratio 1/1, .profile-photo equal width and height), so a
    // single uniform scale is exact — and it stays on the compositor instead of relaying out the
    // image every frame. Position/size go on the outer box (top-left
    // origin, matching how everything else here is measured) and the turn
    // on the inner one, which spins about its own centre.
    const top = lerp(wrapRect.top, parkPhoto.top, pShrink);
    const left = lerp(wrapRect.left, parkPhoto.left, pShrink);
    const scale = lerp(1, parkPhoto.width / flyerBaseW, pShrink);
    flip.style.transform = `translate(${left}px, ${top}px) scale(${scale})`;
    flip.style.opacity = String(1 - pHand);
    flipInner.style.transform = `rotateY(${pFlip * 180}deg)`;
    setFlipIdle(pHand >= 1);
    // The blurred ghost belongs to the cutout's resting pose — it stops
    // lining up the moment the card starts turning, so it goes early.
    if (flyerBlur) flyerBlur.style.opacity = String(1 - phaseProgress(raw12, 0, 0.12));

    // Phase 3 — the built card travels from its parked spot to the real
    // sidebar slot, tilting and lifting a little on the way rather than
    // flipping: it starts flat (that is how phase 2 finished building it),
    // leans into the move as it crosses, and is face-on again well before
    // it arrives, so the crossfade happens onto a card sitting in exactly
    // the real one's resting orientation.
    const cardTop = lerp(parkCard.top, realCardRect.top, p3);
    const cardLeft = lerp(parkCard.left, realCardRect.left, p3);
    // A there-and-back bump. sin² rather than plain sin so it eases into
    // and out of the tilt with zero slope at both ends — sin(pi*t) leaves
    // slope pi at t=0, which would kick the card as the flight starts.
    // Compressed to finish at 0.8, comfortably ahead of the landing at
    // fadeStart, so the card is flat and square-on before it settles.
    const bump = Math.pow(Math.sin(Math.PI * clamp01(raw3 / 0.8)), 2);
    const tilt = -9 * bump; // degrees — the leading edge turns to the viewer
    const lift = 1 + 0.03 * bump; // as if picked up and set back down
    flyingCard.style.transform =
      `translate(${cardLeft}px, ${cardTop}px) perspective(900px) ` +
      `rotateY(${tilt}deg) scale(${lift})`;

    // The clone's own photo takes over from the turned card once the
    // shrink has landed, then phase 2 fades in the rest of the card
    // (chrome background + name/role/bio/social) around it in place.
    if (flyingPhoto) flyingPhoto.style.opacity = String(pHand);
    chrome.style.opacity = String(p2);
    flyingRest.forEach((el) => {
      el.style.opacity = String(p2);
    });

    // Final handoff: crossfade the clone out and the real card in over
    // the last stretch, once it has landed exactly on top of it.
    const fade = clamp01((raw3 - fadeStart) / (1 - fadeStart));
    flyingCard.style.opacity = String(1 - fade);
    realCard.style.visibility = fade > 0 ? "visible" : "hidden";
    realCard.style.opacity = String(fade);

    // The "Hello, World!" copy is deliberately left alone — it stays put
    // and fully legible for the whole intro, and scrolls away with the
    // page like any other content. Below 720px .intro-grid collapses to
    // one centred column and the card would assemble straight down over
    // the top of it, so the copy is ordered above the photo at that width
    // instead (see .intro-copy { order: -1 } in styles.css).
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  realCard.style.opacity = "0";
  realCard.style.visibility = "hidden";
  measure();
  window.addEventListener("resize", measure);
  window.addEventListener("load", measure);
  window.addEventListener("scroll", onScroll, { passive: true });
  setTimeout(measure, 300);
});
