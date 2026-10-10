// The home page journey (data/journey.json), shaped for the map, the date
// pills and the cards. Pure data work, no DOM: JourneySection.svelte renders
// it and journey-map.js draws the map.

import stops from "../../../data/journey.json";
import { project } from "./europe-map.js";

export const STOPS = stops;

// Places closer than this many map cells share one marker, so a tap can't
// land on the wrong one (Cantù and Como are under a cell apart).
export const NEAR = 2.5;

/**
 * Groups the stops into map markers. A stop belongs to its own place, and a
 * photo that names another place (a trip) also lists the stop there, with
 * just that photo. Places within `near` cells of each other share a marker,
 * and a stop that lands in one marker twice becomes one card with all its
 * photos. Each group's entries are in journey order.
 */
export function placeGroups(list = stops, near = NEAR) {
  const places = [];
  const placeFor = (name, coords) => {
    let place = places.find((p) => p.name === name);
    if (!place) {
      place = { name, ...project(coords), entries: [] };
      places.push(place);
    }
    return place;
  };
  list.forEach((stop, index) => {
    const photos = stop.photos ?? [];
    placeFor(stop.place, stop.coords).entries.push({
      stop,
      index,
      photos: photos.filter((p) => !p.coords),
      away: false,
    });
    for (const photo of photos.filter((p) => p.coords)) {
      placeFor(photo.place, photo.coords).entries.push({ stop, index, photos: [photo], away: true });
    }
  });

  const groups = [];
  for (const place of places) {
    const group = groups.find((g) => g.places.some((p) => Math.hypot(p.x - place.x, p.y - place.y) < near));
    if (group) group.places.push(place);
    else groups.push({ places: [place] });
  }

  return groups.map(({ places: members }) => {
    const byStop = new Map();
    for (const place of members) {
      for (const entry of place.entries) {
        const had = byStop.get(entry.index);
        const mine = { ...entry, place: place.name };
        if (!had) {
          byStop.set(entry.index, mine);
          continue;
        }
        // The stop's own place leads; a trip's photo joins after its photos.
        const [home, trip] = had.away ? [mine, had] : [had, mine];
        byStop.set(entry.index, { ...home, photos: [...home.photos, ...trip.photos], away: home.away && trip.away });
      }
    }
    const entries = [...byStop.values()].sort((a, b) => a.index - b.index);
    return {
      label: members.map((p) => p.name).join(" · "),
      x: members.reduce((sum, p) => sum + p.x, 0) / members.length,
      y: members.reduce((sum, p) => sum + p.y, 0) / members.length,
      // A marker with only trip photos in it is drawn smaller.
      minor: entries.every((e) => e.away),
      entries,
    };
  });
}

/** The index of the group holding stop `index` as a stop, not as a trip. */
export function groupOfStop(groups, index) {
  return groups.findIndex((g) => g.entries.some((e) => e.index === index && !e.away));
}

/** "2019–2020" and "2020" span "2019–2020"; a single year stays as it is. */
export function yearSpan(first, last) {
  const from = first.match(/\d{4}/g)?.[0] ?? first;
  const to = last.match(/\d{4}/g)?.at(-1) ?? last;
  return from === to ? from : `${from}–${to}`;
}

/**
 * The date pills: one per run of back-to-back stops under the same map
 * marker, spanning their years and naming their places. A marker returned to
 * with somewhere in between gets another pill.
 */
export function pillRuns(list = stops, groups = placeGroups(list)) {
  const runs = [];
  list.forEach((stop, index) => {
    const group = groupOfStop(groups, index);
    const last = runs.at(-1);
    if (last && last.group === group) last.stops.push(index);
    else runs.push({ group, stops: [index] });
  });
  return runs.map(({ stops: run }) => ({
    place: [...new Set(run.map((i) => list[i].place))].join(" · "),
    stops: run,
    year: yearSpan(list[run[0]].year, list[run.at(-1)].year),
  }));
}

/** A photo's caption line before any credit: its place (unless the caption already names it), then the caption. */
export function captionText(photo) {
  const place = photo.place && !(photo.caption ?? "").includes(photo.place) ? photo.place : "";
  return [place, photo.caption].filter(Boolean).join(" · ");
}
