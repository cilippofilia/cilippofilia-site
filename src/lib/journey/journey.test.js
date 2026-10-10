import { test, expect } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { STOPS, placeGroups, groupOfStop, pillRuns, yearSpan, captionText } from "./journey.js";
import { project, cellAt, COLS, ROWS } from "./europe-map.js";

const stop = (id, place, coords, year, photos = []) => ({ id, place, coords, year, title: id, body: id, photos });
const photo = (src, extra = {}) => ({ src, alt: src, width: 1200, height: 800, ...extra });

test("project puts the map's corners on the grid's corners", () => {
  expect(project([61, -12])).toEqual({ x: 0, y: 0 });
  const far = project([35, 32]);
  expect(far.x).toBeCloseTo(COLS);
  expect(far.y).toBeCloseTo(ROWS.length);
});

test("places on the journey land on land, in their own country's colour", () => {
  expect(cellAt(project([45.74, 9.13]))).toBe("i"); // Cantù
  expect(cellAt(project([53.48, -2.24]))).toBe("u"); // Manchester
  expect(cellAt(project([48.41, 8.45]))).toBe("g"); // Black Forest
});

test("stops in the same place share one group, in journey order", () => {
  const groups = placeGroups([
    stop("a", "Brighton", [50.82, -0.14], "2019"),
    stop("b", "Black Forest", [48.41, 8.45], "2022"),
    stop("c", "Brighton", [50.82, -0.14], "2023"),
  ]);
  expect(groups.map((g) => g.label)).toEqual(["Brighton", "Black Forest"]);
  expect(groups[0].entries.map((e) => e.stop.id)).toEqual(["a", "c"]);
});

test("places too close to tap apart share a marker named after both", () => {
  const groups = placeGroups([
    stop("home", "Cantù", [45.74, 9.13], "1994"),
    stop("bar", "Como", [45.81, 9.09], "2020"),
  ]);
  expect(groups).toHaveLength(1);
  expect(groups[0].label).toBe("Cantù · Como");
  expect(groups[0].entries.map((e) => e.place)).toEqual(["Cantù", "Como"]);
});

test("a photo with its own place lists the stop there too, with just that photo", () => {
  const groups = placeGroups([
    stop("trips", "Como", [45.81, 9.09], "2014", [
      photo("home.webp"),
      photo("udine.webp", { place: "Udine", coords: [46.06, 13.24] }),
    ]),
  ]);
  const [como, udine] = groups;
  expect(como.entries[0].photos.map((p) => p.src)).toEqual(["home.webp"]);
  expect(udine.label).toBe("Udine");
  expect(udine.minor).toBe(true);
  expect(udine.entries[0]).toMatchObject({ away: true, place: "Udine" });
  expect(udine.entries[0].photos.map((p) => p.src)).toEqual(["udine.webp"]);
});

test("a stop that's in a marker twice becomes one card, its own photos first", () => {
  const groups = placeGroups([
    stop("trips", "Como", [45.81, 9.09], "2014", [
      photo("nearby.webp", { place: "Lugano", coords: [46.0, 8.95] }),
      photo("home.webp"),
    ]),
  ]);
  expect(groups).toHaveLength(1);
  expect(groups[0].entries).toHaveLength(1);
  expect(groups[0].entries[0].away).toBe(false);
  expect(groups[0].entries[0].photos.map((p) => p.src)).toEqual(["home.webp", "nearby.webp"]);
});

test("groupOfStop finds the stop's own marker, not a trip's", () => {
  const groups = placeGroups([
    stop("trips", "Como", [45.81, 9.09], "2014", [photo("udine.webp", { place: "Udine", coords: [46.06, 13.24] })]),
  ]);
  expect(groups[groupOfStop(groups, 0)].label).toBe("Como");
});

test("yearSpan runs from the first year to the last", () => {
  expect(yearSpan("2019–2020", "2020")).toBe("2019–2020");
  expect(yearSpan("2024–2026", "2026")).toBe("2024–2026");
  expect(yearSpan("2022", "2022")).toBe("2022");
});

test("back-to-back stops in one place share a pill; a return visit gets its own", () => {
  const runs = pillRuns([
    stop("a", "Brighton", [50.82, -0.14], "2019–2020"),
    stop("b", "Brighton", [50.82, -0.14], "2020"),
    stop("c", "Black Forest", [48.41, 8.45], "2022"),
    stop("d", "Brighton", [50.82, -0.14], "2021–2023"),
  ]);
  expect(runs.map((r) => [r.year, r.place, r.stops])).toEqual([
    ["2019–2020", "Brighton", [0, 1]],
    ["2022", "Black Forest", [2]],
    ["2021–2023", "Brighton", [3]],
  ]);
});

test("back-to-back stops under one shared marker share a pill naming both places", () => {
  const runs = pillRuns([
    stop("home", "Cantù", [45.74, 9.13], "1994–2018"),
    stop("trips", "Como", [45.81, 9.09], "2014–2018"),
    stop("gargano", "Gargano, Puglia", [41.86, 16.14], "2015–2017"),
  ]);
  expect(runs.map((r) => [r.year, r.place, r.stops])).toEqual([
    ["1994–2018", "Cantù · Como", [0, 1]],
    ["2015–2017", "Gargano, Puglia", [2]],
  ]);
});

test("a caption leads with the photo's place unless the caption already names it", () => {
  expect(captionText({ place: "Udine" })).toBe("Udine");
  expect(captionText({ place: "Málaga", caption: "Backside tailslide" })).toBe("Málaga · Backside tailslide");
  expect(captionText({ place: "L’Aquila", caption: "Gap to frontside smith, L’Aquila, 2016" })).toBe(
    "Gap to frontside smith, L’Aquila, 2016"
  );
  expect(captionText({})).toBe("");
});

// The real data/journey.json.

const everyPhoto = STOPS.flatMap((s) => s.photos);
const onGrid = ({ x, y }) => x >= 0 && x < COLS && y >= 0 && y < ROWS.length;

test("every stop has an id, a place, a year, a title and a body, with unique ids", () => {
  for (const s of STOPS) {
    for (const key of ["id", "place", "year", "title", "body"]) expect(typeof s[key]).toBe("string");
  }
  expect(new Set(STOPS.map((s) => s.id)).size).toBe(STOPS.length);
});

test("every stop and photo place is on the map", () => {
  for (const s of STOPS) expect(onGrid(project(s.coords))).toBe(true);
  for (const p of everyPhoto.filter((p) => p.coords)) {
    expect(typeof p.place).toBe("string");
    expect(onGrid(project(p.coords))).toBe(true);
  }
});

test("every photo (and any still frame) exists under static/, with alt text and a size", () => {
  for (const p of everyPhoto) {
    const src = p.src ?? p.icon;
    expect(existsSync(join(process.cwd(), "static", src))).toBe(true);
    if (p.still) expect(existsSync(join(process.cwd(), "static", p.still))).toBe(true);
    expect(p.alt.trim().length).toBeGreaterThan(0);
    expect(Number.isInteger(p.width) && p.width > 0).toBe(true);
    expect(Number.isInteger(p.height) && p.height > 0).toBe(true);
  }
});

test("photo credits name someone, and any link is https", () => {
  for (const p of everyPhoto.filter((p) => p.credit)) {
    expect(p.credit.name.trim().length).toBeGreaterThan(0);
    if (p.credit.url) expect(p.credit.url.startsWith("https://")).toBe(true);
  }
});
