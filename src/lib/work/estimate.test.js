import { test, expect } from "bun:test";
import { estimate, estimateHours, describeEstimate, timelineNote, EXISTING_APP } from "./estimate.js";

test("there's no estimate until a device is picked", () => {
  expect(estimate({ devices: [], features: ["Widgets"] })).toBeNull();
  expect(estimate()).toBeNull();
});

test("one device is the base app, whichever device it is", () => {
  expect(estimateHours({ devices: ["iPhone"] })).toBe(80);
  expect(estimateHours({ devices: ["Mac"] })).toBe(80);
});

test("the base covers the cheapest device to add and each other one adds its hours", () => {
  expect(estimateHours({ devices: ["iPhone", "Mac"] })).toBe(120);
  expect(estimateHours({ devices: ["iPad", "Mac"] })).toBe(120);
  expect(estimateHours({ devices: ["iPhone", "iPad", "Apple Watch"] })).toBe(126);
});

test("features add their hours", () => {
  expect(estimateHours({ devices: ["iPhone"], features: ["Accounts", "Widgets"] })).toBe(120);
});

test("the range adds the overhead, leans up and rounds to £500", () => {
  // 80h + 20% = 96h at £50 = £4,800, so −15% and +25% around it.
  expect(estimate({ devices: ["iPhone"] })).toEqual({ low: 4000, high: 6000 });
});

test("an existing app has no number", () => {
  expect(estimate({ devices: ["iPhone"], features: [EXISTING_APP] })).toEqual({ existing: true });
});

test("each case reads as a sentence, with British pound formatting", () => {
  expect(describeEstimate(null)).toBe("Pick a device to see a rough estimate.");
  expect(describeEstimate({ low: 4000, high: 12500 })).toBe("Projects like this usually come to about £4,000–£12,500.");
  expect(describeEstimate({ existing: true })).toContain("see its code");
});

test("a tighter timeline costs more and a flexible one a little less", () => {
  // £4,800 for iPhone only, before the timeline.
  expect(estimate({ devices: ["iPhone"], timeline: "3–6 months" })).toEqual({ low: 4000, high: 6000 });
  expect(estimate({ devices: ["iPhone"], timeline: "As soon as possible" })).toEqual({ low: 5000, high: 7500 });
  expect(estimate({ devices: ["iPhone"], timeline: "Flexible" })).toEqual({ low: 4000, high: 5500 });
});

test("a project too big for its timeline is flagged", () => {
  const big = { devices: ["iPhone", "Mac"], features: ["Accounts", "Sync between devices", "Its own server or API"] };
  expect(estimate({ ...big, timeline: "1–3 months" }).tooLong).toBe("3 months");
  expect(estimate({ ...big, timeline: "3–6 months" }).tooLong).toBeUndefined();
  // As soon as possible has no end date, so it's never too long, just dearer.
  expect(estimate({ ...big, timeline: "As soon as possible" }).tooLong).toBeUndefined();
  expect(describeEstimate({ low: 9000, high: 13500, tooLong: "3 months" })).toBe(
    "About £9,000–£13,500. That's likely more than 3 months of work, so the timeline may need to stretch."
  );
});

test("a timeline that changes the price says so, without the percentage", () => {
  expect(timelineNote("As soon as possible")).toBe("Includes a rush premium for putting your project first.");
  expect(timelineNote("Flexible")).toBe("Includes a discount for a flexible timeline.");
  expect(timelineNote("3–6 months")).toBe("");
  expect(timelineNote("")).toBe("");
});

test("an iPhone Duo layout adds its hours to an iPhone app", () => {
  expect(estimateHours({ devices: ["iPhone", "iPhone Duo"] })).toBe(96);
});
