// The home page journey map: the pixel Europe from europe-map.js on a canvas,
// with a button per place laid over it. Drag to look around, pinch or use
// the + and − buttons to zoom, "Whole map" to see the whole route again.
// Tapping a place calls `onSelect`; `select()` flies the camera there.
//
// JourneySection.svelte renders the root's static markup (the canvas and the
// tool buttons) and calls initJourneyMap from onMount. The canvas only redraws
// while the camera is moving or being dragged.

import { ROWS, COLS } from "./europe-map.js";

const CELL = 4; // canvas pixels per map cell in the base image
const VW = 800; // the canvas's drawing size; CSS scales it to fit
const VH = 600;
const ZOOM_CLOSE = 2.6;

// Pixel-art palette. The countries on the journey are tinted; the rest of
// the land is one dark grey.
const SEA = "#0a1322";
const SEA_SPARKLE = "#12203a";
const SHALLOWS = "#13253f";
const LAND = "#262b36";
const COUNTRIES = { i: "#4f8a5e", u: "#4f6ea8", g: "#a87a4f", e: "#a84f6e" };

// The whole of Europe, drawn once at CELL pixels per cell.
function renderBase() {
  const canvas = document.createElement("canvas");
  canvas.width = COLS * CELL;
  canvas.height = ROWS.length * CELL;
  const g = canvas.getContext("2d");
  g.fillStyle = SEA;
  g.fillRect(0, 0, canvas.width, canvas.height);
  // A sparse sparkle on the sea, seeded so it's the same on every load.
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  g.fillStyle = SEA_SPARKLE;
  for (let k = 0; k < 900; k++) {
    g.fillRect(Math.floor(rand() * COLS) * CELL, Math.floor(rand() * ROWS.length) * CELL, CELL, CELL);
  }
  const at = (r, c) => ROWS[r]?.[c] ?? ".";
  for (let r = 0; r < ROWS.length; r++) {
    for (let c = 0; c < COLS; c++) {
      const ch = at(r, c);
      if (ch === ".") {
        // A one-cell rim of lighter water along every coast.
        if (at(r - 1, c) !== "." || at(r + 1, c) !== "." || at(r, c - 1) !== "." || at(r, c + 1) !== ".") {
          g.fillStyle = SHALLOWS;
          g.fillRect(c * CELL, r * CELL, CELL, CELL);
        }
        continue;
      }
      g.fillStyle = COUNTRIES[ch] ?? LAND;
      g.fillRect(c * CELL, r * CELL, CELL, CELL);
      // A lighter top edge on north-facing coasts gives the land some height.
      if (at(r - 1, c) === ".") {
        g.fillStyle = "rgba(255, 255, 255, 0.12)";
        g.fillRect(c * CELL, r * CELL, CELL, CELL / 2);
      }
    }
  }
  return canvas;
}

export function initJourneyMap(root, { signal, groups, selected = 0, onSelect = () => {} }) {
  const canvas = root.querySelector(".journey-canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = VW;
  canvas.height = VH;
  const base = renderBase();
  const W = base.width;
  const H = base.height;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const ZOOM_MIN = Math.min(VW / W, VH / H);
  const clampZoom = (z) => Math.min(4, Math.max(ZOOM_MIN, z));
  const points = groups.map((g) => ({ x: g.x * CELL, y: g.y * CELL }));

  // The whole route with a margin: the first view and "Whole map".
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const overview = {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
    zoom: clampZoom(
      Math.min(VW / (Math.max(...xs) - Math.min(...xs) + 160), VH / (Math.max(...ys) - Math.min(...ys) + 160))
    ),
  };
  const cam = { ...overview };
  let target = null;

  const toScreen = (p) => ({ x: (p.x - cam.x) * cam.zoom + VW / 2, y: (p.y - cam.y) * cam.zoom + VH / 2 });
  const clampCam = () => {
    const hw = VW / 2 / cam.zoom;
    const hh = VH / 2 / cam.zoom;
    cam.x = hw * 2 >= W ? W / 2 : Math.min(W - hw, Math.max(hw, cam.x));
    cam.y = hh * 2 >= H ? H / 2 : Math.min(H - hh, Math.max(hh, cam.y));
  };

  // One button per place, positioned in percent so CSS can scale the map.
  const markers = groups.map((g, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "journey-marker" + (g.minor ? " minor" : "");
    b.setAttribute("aria-label", `Show ${g.label}`);
    const label = document.createElement("span");
    label.className = "journey-marker-label";
    label.textContent = g.label;
    b.append(label);
    b.addEventListener(
      "click",
      () => {
        select(i);
        onSelect(i);
      },
      { signal }
    );
    root.append(b);
    return b;
  });
  const placeMarkers = () => {
    root.classList.toggle("close", cam.zoom > 1.8);
    points.forEach((p, i) => {
      const s = toScreen(p);
      markers[i].style.left = `${(s.x / VW) * 100}%`;
      markers[i].style.top = `${(s.y / VH) * 100}%`;
      markers[i].hidden = s.x < -40 || s.x > VW + 40 || s.y < -40 || s.y > VH + 40;
    });
  };

  // Drawing happens on demand: a frame is queued when something changes, and
  // the camera's glide keeps queuing frames until it arrives.
  let frame = 0;
  let last = 0;
  const kick = () => {
    if (!frame) frame = requestAnimationFrame(draw);
  };
  function draw(now) {
    frame = 0;
    if (signal.aborted) return;
    const dt = last ? Math.min(100, now - last) : 16;
    last = now;
    if (target) {
      const k = reduceMotion ? 1 : 1 - Math.exp(-dt / 220);
      cam.x += (target.x - cam.x) * k;
      cam.y += (target.y - cam.y) * k;
      cam.zoom *= Math.pow(target.zoom / cam.zoom, k);
      if (Math.abs(target.zoom - cam.zoom) < 0.001 && Math.hypot(target.x - cam.x, target.y - cam.y) < 0.1)
        target = null;
    }
    clampCam();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = SEA;
    ctx.fillRect(0, 0, VW, VH);
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(cam.zoom, 0, 0, cam.zoom, VW / 2 - cam.x * cam.zoom, VH / 2 - cam.y * cam.zoom);
    ctx.drawImage(base, 0, 0);
    placeMarkers();
    if (target) kick();
    else last = 0;
  }
  const flyTo = (to) => {
    target = to;
    kick();
  };

  function select(i) {
    markers.forEach((m, j) => m.classList.toggle("selected", j === i));
    flyTo({ ...points[i], zoom: ZOOM_CLOSE });
  }

  // Drag to look around.
  let drag = null;
  root.addEventListener(
    "pointerdown",
    (e) => {
      if (e.target.closest("button")) return;
      drag = { x: e.clientX, y: e.clientY, moved: false };
      root.setPointerCapture(e.pointerId);
    },
    { signal }
  );
  root.addEventListener(
    "pointermove",
    (e) => {
      if (!drag) return;
      const ratio = VW / root.clientWidth;
      const dx = (e.clientX - drag.x) * ratio;
      const dy = (e.clientY - drag.y) * ratio;
      if (!drag.moved && Math.hypot(dx, dy) < 6) return;
      drag.moved = true;
      target = null;
      cam.x -= dx / cam.zoom;
      cam.y -= dy / cam.zoom;
      drag.x = e.clientX;
      drag.y = e.clientY;
      kick();
    },
    { signal }
  );
  const endDrag = () => (drag = null);
  root.addEventListener("pointerup", endDrag, { signal });
  root.addEventListener("pointercancel", endDrag, { signal });
  // Only a trackpad pinch (sent as ctrl+wheel) zooms; a plain scroll still
  // scrolls the page past the map.
  root.addEventListener(
    "wheel",
    (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      target = null;
      cam.zoom = clampZoom(cam.zoom * Math.exp(-e.deltaY * 0.0015));
      kick();
    },
    { passive: false, signal }
  );
  const zoomBy = (f) => flyTo({ x: cam.x, y: cam.y, zoom: clampZoom(cam.zoom * f) });
  root.querySelector("[data-zoom='in']").addEventListener("click", () => zoomBy(1.4), { signal });
  root.querySelector("[data-zoom='out']").addEventListener("click", () => zoomBy(1 / 1.4), { signal });
  root.querySelector("[data-view='whole']").addEventListener("click", () => flyTo({ ...overview }), { signal });

  signal.addEventListener("abort", () => {
    cancelAnimationFrame(frame);
    markers.forEach((m) => m.remove());
  });

  // Start on the whole route with the first place marked.
  markers.forEach((m, j) => m.classList.toggle("selected", j === selected));
  kick();

  return { select };
}
