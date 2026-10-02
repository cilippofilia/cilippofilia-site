// The intro's scroll-linked animation: the flip card, and the profile
// card it assembles into. See index.html for the markup it drives.

// Scroll-linked "shared element" transition, all of it played while
// #intro-pin is pinned on screen via CSS `position: sticky` (see
// .intro.pin-active in intro.css):
//  1. the big intro cutout is picked up and turned a half-circle about its
//     vertical axis, lifting a touch towards the viewer as it goes.
//     Backface culling means it vanishes entirely as it passes edge-on at
//     90deg, and what comes round the other side is the same crop with
//     its background intact, cropped to a circle — a highlight glances
//     across it as it faces front — which then shrinks into the avatar.
//  2. a cloned profile-card, parked with its avatar on that circle, grows
//     out of it: the surface opens from the avatar's circle into the
//     card's rounded rectangle, then the name, role and location, the bio
//     and the social icons rise and come into focus in turn, and a single
//     sheen sweeps across the finished card.
//  3. there is no flight. The hero is pulled up (alignHero) so the real
//     .profile-card lies exactly under the parked clone at the moment the
//     pin releases; the clone crossfades into it in place, and from then
//     on the card is ordinary page content. (A flight used to carry the
//     clone down to the real card, but the two are in the same column at
//     every width, so all it could do was hang back while the page
//     scrolled past and then sink into its slot.)
//
// On wide screens only the photo column is held: the greeting beside it
// is shifted with the scroll (see update) so it reads as a normal page
// scrolling past a sticky visual, and the hero's headline rises into the
// same column to take its place just as the card is finished. Below 720px
// everything is one centred column, the greeting sits above the photo,
// and it stays put for the whole intro instead.
//
// All positions are read live via getBoundingClientRect() every frame:
// while pinned, the wrap's viewport rect simply doesn't change, and once
// the pin releases the clone and the real card move up in lockstep.
//
// Progress is driven by a smoothed copy of scrollY rather than the raw
// value: a wheel click or a trackpad flick moves the page in steps of
// tens of pixels, and driving the turn straight from those made it
// stutter. The smoothed value chases the real one over a few frames, so
// the animation glides between steps but still tracks the finger.
document.addEventListener("DOMContentLoaded", () => {
  const flip = document.getElementById("hero-flip");
  const flipInner = document.getElementById("hero-flip-inner");
  const flyerBack = document.getElementById("hero-flyer-back");
  const flyerBlur = document.getElementById("hero-flyer-blur");
  const ghost = document.getElementById("intro-photo-ghost");
  const intro = document.getElementById("intro");
  const introPin = document.getElementById("intro-pin");
  const header = document.querySelector("header.site-header");
  const realCard = document.querySelector(".profile-card");
  const realPhoto = document.querySelector(".profile-photo");
  const floatingIcons = document.querySelector(".floating-icons");
  const hero = realCard ? realCard.closest(".hero") : null;
  const copy = document.querySelector(".intro-copy");
  if (!flip || !flipInner || !ghost || !intro || !introPin || !realCard || !realPhoto || !hero) return;

  // Below 720px .hero-grid and .intro-grid are single columns (see
  // components.css and intro.css).
  const singleColumn = window.matchMedia("(max-width: 720px)");

  // Reduced motion: no pin, no turn, no build. The cutout simply sits in
  // the intro as a picture (the flip card is absolutely positioned inside
  // .intro-photo-wrap, so left alone it renders in place) and the real
  // profile card is just there in the sidebar further down.
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

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

  // The highlight that glances across the circle as it comes round. It
  // lives on the back face, so it turns with it and is culled with it.
  const flipSheen = document.createElement("div");
  flipSheen.className = "hero-flip-face hero-flip-sheen";
  flipSheen.setAttribute("aria-hidden", "true");
  const flipSheenBand = document.createElement("div");
  flipSheenBand.className = "sheen-band";
  flipSheen.appendChild(flipSheenBand);
  flipInner.appendChild(flipSheen);

  // The clone stands in for the real card during the whole animation —
  // the real one stays invisible (and out of the tab order) until the
  // handoff, so there's no duplicate content sitting on the page early.
  const flyingCard = realCard.cloneNode(true);
  flyingCard.classList.add("flying-card");
  flyingCard.setAttribute("aria-hidden", "true");
  flyingCard.querySelectorAll("a").forEach((a) => (a.tabIndex = -1));
  const chrome = document.createElement("div");
  chrome.className = "fc-chrome";
  const cardSheen = document.createElement("div");
  cardSheen.className = "sheen-band";
  chrome.appendChild(cardSheen);
  flyingCard.insertBefore(chrome, flyingCard.firstChild);
  document.body.appendChild(flyingCard);
  const flyingPhoto = flyingCard.querySelector(".profile-photo");

  // The whole intro on one timeline, in pinned progress (raw, 0..1). Every
  // stage overlaps the next so nothing is ever momentarily stalled on its
  // own; the windows are what to tune.
  const T = {
    turn: [0, 0.4], // the half-circle turn
    shrink: [0.1, 0.44], // circle shrinks into the avatar
    hand: [0.44, 0.5], // flip circle crossfades to the clone's avatar
    surface: [0.5, 0.7], // card surface opens out of the avatar
    sheen: [0.8, 0.97], // light sweeps across the finished card
  };
  // The content, rising and focusing in after the surface has started.
  const groups = [
    {
      els: [".profile-name", ".profile-role", ".profile-location"]
        .map((sel) => flyingCard.querySelector(sel))
        .filter(Boolean),
      start: 0.56,
      end: 0.74,
    },
    { els: [flyingCard.querySelector(".profile-bio")].filter(Boolean), start: 0.62, end: 0.8 },
  ];
  // The social icons pop in one after another across this window.
  const socialIcons = [...flyingCard.querySelectorAll(".profile-social a")];
  const socialWindow = [0.68, 0.88];
  const rise = 12; // px each text stage travels up as it fades in
  const focus = 6; // px of blur each text stage sharpens from
  const handoffDist = 40; // px of scroll after the pin releases to crossfade over

  let pinStart = 0; // scrollY at which #intro-pin starts sticking
  let pinBuffer = 1; // extra scroll distance the pin consumes
  let headerH = 0;
  let cardRadius = 26; // the real card's corner radius, which the surface opens into
  let flyerBaseW = 1; // the cutout's resting size, set once per measure so
  let flyerBaseH = 1; // update() can scale it instead of re-laying it out
  let smoothY = window.scrollY; // eased scroll position the phases read
  let ticking = false;
  let flipIdle = null; // whether the flip card's layers are currently parked
  let stacked = false; // single-column layout, see singleColumn
  let viewH = window.innerHeight; // viewport height the parking spot fits the card into
  let measuredW = window.innerWidth;

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
    headerH = header ? header.offsetHeight : 0;
    // The pin sticks and releases against #intro's content box, so its
    // padding (only set in the single-column layout) is left out — counting
    // it put the release a few pixels early, which showed as the clone
    // drifting off the real card at the handoff.
    const introStyle = getComputedStyle(intro);
    const padTop = parseFloat(introStyle.paddingTop) || 0;
    const padBottom = parseFloat(introStyle.paddingBottom) || 0;
    pinStart = introRect.top + window.scrollY + padTop - headerH;
    pinBuffer = Math.max(intro.offsetHeight - padTop - padBottom - introPin.offsetHeight, 1);
    introPin.style.top = headerH + "px";
    flyingCard.style.width = realCard.getBoundingClientRect().width + "px";
    cardRadius = parseFloat(getComputedStyle(realCard).borderTopLeftRadius) || cardRadius;
    stacked = singleColumn.matches;
    viewH = window.innerHeight;
    measuredW = window.innerWidth;
    // The greeting's scroll shift (wide only) is a transform, so it never
    // affects layout — but clear it anyway before alignHero measures.
    if (copy) copy.style.transform = "";
    alignHero();
    // The flip card is sized once, here, and only ever scaled per frame —
    // width/height are layout properties and animating them every frame
    // is what made the shrink stutter. Both faces are inset:0 inside it,
    // so sizing the box sizes them together and they cannot drift apart.
    const ghostRect = ghost.getBoundingClientRect();
    flyerBaseW = Math.max(ghostRect.width, 1);
    flyerBaseH = Math.max(ghostRect.height, 1);
    flip.style.width = flyerBaseW + "px";
    flip.style.height = flyerBaseH + "px";
    // The circle's ring shrinks with the card, so it is drawn thick enough
    // here that it measures the same as the real avatar's 3px ring once
    // the shrink has landed — otherwise the ring visibly thickened at the
    // crossfade.
    if (flyerBack) {
      const ringPx = parseFloat(getComputedStyle(realPhoto).borderTopWidth) || 3;
      flyerBack.style.borderWidth = (ringPx * flyerBaseW) / Math.max(realPhoto.offsetWidth, 1) + "px";
    }
    smoothY = window.scrollY;
    update();
  }

  function lerp(a, b, p) {
    return a + (b - a) * p;
  }

  // Smoothstep, not easeOutCubic: it has zero slope at *both* ends, so
  // applying it per phase stays velocity-continuous across the phase
  // boundaries. easeOutCubic starts at slope 3, which meant every phase
  // lurched on its first few pixels of scroll and then crawled — the
  // main reason the whole thing read as clunky. No overshooting eases
  // either: this is scroll-linked, so a reader who stops mid-curve would
  // be left looking at the overshoot.
  function smoothstep(p) {
    return p * p * (3 - 2 * p);
  }

  // The turn only. smoothstep has zero slope at *both* ends, which is what
  // keeps the later phase boundaries from lurching — but at the very
  // start of the page there is no previous phase to be continuous with,
  // and a flat start means the first ~30px of scroll produce almost no
  // visible change. easeOutQuad leaves at slope 2, so the turn answers
  // the first pixel of scroll, and still arrives at zero slope.
  function easeOutQuad(p) {
    return 1 - (1 - p) * (1 - p);
  }

  // A there-and-back bump over 0..1 with zero slope at both ends.
  function bump(p) {
    return Math.pow(Math.sin(Math.PI * clamp01(p)), 2);
  }

  function clamp01(v) {
    return Math.min(1, Math.max(0, v));
  }

  function linear(raw, [start, end]) {
    return clamp01((raw - start) / (end - start));
  }

  function phaseProgress(raw, start, end) {
    return smoothstep(clamp01((raw - start) / (end - start)));
  }

  // Where the turn lands the avatar and the card grows, in viewport
  // coordinates, for a given cutout box and greeting bottom.
  function parkingSpot(wrapRect, realCardRect, copyBottom) {
    const realPhotoRect = realPhoto.getBoundingClientRect();
    const photoW = realPhoto.offsetWidth;
    const photoH = realPhoto.offsetHeight;
    // Where the photo sits relative to the card's own top-left corner —
    // used to park the *card* so its photo ends up in the right spot.
    const photoOffsetX = realPhotoRect.left - realCardRect.left;
    const photoOffsetY = realPhotoRect.top - realCardRect.top;

    // Vertically, the avatar parks at the centre of the cutout's box and
    // the card grows downwards from it — lifted just enough for the whole
    // card to fit on screen when it would otherwise run off the bottom,
    // but never up under the header. The circle is travelling anyway
    // during the shrink, so a slightly different landing is not a visible
    // correction.
    const maxPhotoTop = viewH - 16 - realCardRect.height + photoOffsetY;
    let photoTop = Math.min(wrapRect.top + wrapRect.height / 2 - photoH / 2, maxPhotoTop);
    photoTop = Math.max(photoTop, headerH + 16 + photoOffsetY);
    // Stacked, the card never has to be wholly on screen — it scrolls on
    // with the page once built — so on a short phone it is never lifted
    // over the greeting; its bottom just builds below the fold.
    if (stacked && copyBottom !== null) photoTop = Math.max(photoTop, copyBottom + 16 + photoOffsetY);
    // Horizontally it parks in the real card's own column. On wide
    // screens that is a little left of the cutout's centre; the circle
    // covers the difference during the shrink.
    const parkCard = { top: photoTop - photoOffsetY, left: realCardRect.left };
    const parkPhoto = {
      top: photoTop,
      left: parkCard.left + photoOffsetX,
      width: photoW,
      height: photoH,
      offsetX: photoOffsetX,
      offsetY: photoOffsetY,
    };
    return { parkPhoto, parkCard };
  }

  // Shift the hero so that, at the scroll position where the pin releases,
  // the real card's top is exactly the parked clone's top. While pinned
  // the cutout box sits at a fixed viewport spot (its offset inside the
  // pin, below the stuck pin's top), so the parking spot at release can
  // be worked out from any scroll position.
  function alignHero() {
    hero.style.marginTop = "";
    const pinRect = introPin.getBoundingClientRect();
    const wrapRect = ghost.getBoundingClientRect();
    const pinnedWrap = {
      top: headerH + (wrapRect.top - pinRect.top),
      left: wrapRect.left,
      width: wrapRect.width,
      height: wrapRect.height,
    };
    const pinnedCopyBottom = copy ? headerH + (copy.getBoundingClientRect().bottom - pinRect.top) : null;
    const realCardRect = realCard.getBoundingClientRect();
    const { parkCard } = parkingSpot(pinnedWrap, realCardRect, pinnedCopyBottom);
    const realTopAtRelease = realCardRect.top + window.scrollY - (pinStart + pinBuffer);
    const baseMargin = parseFloat(getComputedStyle(hero).marginTop) || 0;
    hero.style.marginTop = baseMargin - (realTopAtRelease - parkCard.top) + "px";
  }

  function update() {
    ticking = false;
    const scrollY = window.scrollY;
    // Chase the real scroll position. ~0.22 per frame settles a wheel
    // step in about a quarter of a second — enough to glide, not enough
    // to feel like the page is dragging behind the finger.
    smoothY += (scrollY - smoothY) * 0.22;
    if (Math.abs(scrollY - smoothY) < 0.5) smoothY = scrollY;
    else onScroll();

    const raw = clamp01((smoothY - pinStart) / pinBuffer);
    const handoff = clamp01((smoothY - (pinStart + pinBuffer)) / handoffDist);

    // Content that belongs to the page follows the real scroll position,
    // not the smoothed value, so it stays glued to everything around it.
    const pinnedScroll = Math.min(Math.max(scrollY - pinStart, 0), pinBuffer);
    if (floatingIcons) {
      floatingIcons.style.top =
        -(Math.min(scrollY, pinStart) + Math.max(0, scrollY - (pinStart + pinBuffer))) + "px";
    }
    // Wide screens: the greeting scrolls on as if it were not in the pin,
    // leaving the photo column as the only thing held. The hero headline
    // comes up the same column behind it and is in place at the release.
    if (copy) copy.style.transform = stacked || pinnedScroll === 0 ? "" : `translateY(${-pinnedScroll}px)`;

    const wrapRect = ghost.getBoundingClientRect();
    const realCardRect = realCard.getBoundingClientRect();
    const copyBottom = copy && stacked ? copy.getBoundingClientRect().bottom : null;
    const { parkPhoto, parkCard } = parkingSpot(wrapRect, realCardRect, copyBottom);

    // Phase 1 — the turn and the shrink. The turn answers the first pixel
    // of scroll and passes 90deg — the frame where both faces are
    // edge-on, nothing is drawn, and the cutout becomes the circle — at
    // raw ~= 0.117, which is also where the lift peaks: the card is
    // highest off the page exactly when it is thinnest. Both boxes are
    // square, so a single uniform scale is exact and stays on the
    // compositor. Position/size go on the outer box (top-left origin) and
    // the turn and lift on the inner one, about its own centre.
    const pFlip = easeOutQuad(linear(raw, T.turn));
    const pShrink = phaseProgress(raw, ...T.shrink);
    const pHand = phaseProgress(raw, ...T.hand);
    const top = lerp(wrapRect.top, parkPhoto.top, pShrink);
    const left = lerp(wrapRect.left, parkPhoto.left, pShrink);
    const scale = lerp(1, parkPhoto.width / flyerBaseW, pShrink);
    const lift = 1 + 0.06 * bump(pFlip);
    flip.style.transform = `translate(${left}px, ${top}px) scale(${scale})`;
    flip.style.opacity = String(1 - pHand);
    flipInner.style.transform = `rotateY(${pFlip * 180}deg) scale(${lift})`;
    setFlipIdle(pHand >= 1);
    // The blurred ghost belongs to the cutout's resting pose — it stops
    // lining up the moment the card starts turning, so it goes early.
    if (flyerBlur) flyerBlur.style.opacity = String(1 - phaseProgress(raw, 0, 0.12));
    // The glint crosses the circle over the back half of the turn, while
    // it swings round to face the viewer.
    const glint = clamp01((pFlip - 0.55) / 0.45);
    flipSheenBand.style.transform = `translateX(${lerp(-100, 260, glint)}%) skewX(-16deg)`;
    flipSheenBand.style.opacity = String(bump(glint));

    // The clone sits on the parked spot through the build and, after the
    // release, on the real card — which alignHero has made the same place,
    // so this only absorbs sub-pixel rounding.
    const pRelease = smoothstep(handoff);
    const cardTop = lerp(parkCard.top, realCardRect.top, pRelease);
    const cardLeft = lerp(parkCard.left, realCardRect.left, pRelease);
    flyingCard.style.transform = `translate(${cardLeft}px, ${cardTop}px)`;

    // The clone's own photo takes over from the turned circle once the
    // shrink has landed: by then the two are the same image at the same
    // size in the same place, so the swap is invisible.
    if (flyingPhoto) flyingPhoto.style.opacity = String(pHand);

    // Phase 2 — the surface opens out of the avatar. It is clipped to the
    // avatar's own circle to begin with (hidden right behind it), and the
    // clip widens into the card's rounded rectangle. The end state
    // overshoots the card's edges so its drop shadow is not clipped off,
    // and then the clip is dropped altogether.
    const pSurface = phaseProgress(raw, ...T.surface);
    const cardW = flyingCard.offsetWidth;
    const cardH = flyingCard.offsetHeight;
    if (pSurface <= 0) {
      chrome.style.opacity = "0";
    } else {
      chrome.style.opacity = "1";
      if (pSurface >= 1) {
        chrome.style.clipPath = "";
      } else {
        const bleed = -60;
        const inT = lerp(parkPhoto.offsetY, bleed, pSurface);
        const inL = lerp(parkPhoto.offsetX, bleed, pSurface);
        const inR = lerp(cardW - parkPhoto.offsetX - parkPhoto.width, bleed, pSurface);
        const inB = lerp(cardH - parkPhoto.offsetY - parkPhoto.height, bleed, pSurface);
        const radius = lerp(parkPhoto.width / 2, cardRadius - bleed, pSurface);
        chrome.style.clipPath = `inset(${inT}px ${inR}px ${inB}px ${inL}px round ${radius}px)`;
      }
    }

    for (const group of groups) {
      const p = phaseProgress(raw, group.start, group.end);
      const dy = rise * (1 - p);
      const blur = focus * (1 - p);
      for (const el of group.els) {
        el.style.opacity = String(p);
        el.style.transform = dy > 0.01 ? `translateY(${dy}px)` : "";
        el.style.filter = blur > 0.05 ? `blur(${blur}px)` : "";
      }
    }

    // Each icon gets its own slice of the window, overlapping its
    // neighbours, and grows up from a little below its spot.
    const [sStart, sEnd] = socialWindow;
    const slice = (sEnd - sStart) / (socialIcons.length + 1);
    socialIcons.forEach((icon, i) => {
      const p = phaseProgress(raw, sStart + i * slice, sStart + (i + 2) * slice);
      icon.style.opacity = String(p);
      icon.style.transform = p < 1 ? `translateY(${8 * (1 - p)}px) scale(${lerp(0.6, 1, p)})` : "";
    });

    // The finishing touch: one band of light across the finished card.
    const pSheen = linear(raw, T.sheen);
    cardSheen.style.transform = `translateX(${lerp(-100, 330, smoothstep(pSheen))}%) skewX(-16deg)`;
    cardSheen.style.opacity = String(bump(pSheen));

    // Handoff, in place: the real card appears fully opaque underneath and
    // the clone fades off the top of it. Not a crossfade — two cards at
    // half opacity each only add up to ~75% cover, so mid-fade the whole
    // card went see-through and the floating icons showed through it.
    flyingCard.style.opacity = String(1 - handoff);
    realCard.style.visibility = handoff > 0 ? "visible" : "hidden";
    realCard.style.opacity = handoff > 0 ? "1" : "0";
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
  // Phone browsers fire resize whenever the toolbar collapses or expands,
  // which changes only the height. Stacked, re-measuring then would move
  // the hero (alignHero) mid-scroll and jolt the page, so height-only
  // resizes are ignored there; a rotation changes the width and still
  // re-measures.
  window.addEventListener("resize", () => {
    if (stacked && singleColumn.matches && window.innerWidth === measuredW) return;
    measure();
  });
  window.addEventListener("load", measure);
  window.addEventListener("scroll", onScroll, { passive: true });
  setTimeout(measure, 300);
});
