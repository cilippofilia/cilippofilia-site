// The Work with me page's ballpark estimate: hours for what the brief
// builder's chips describe, times the hourly rate. It's a starting point so
// a visitor knows roughly where they stand, not a quote; the real number
// comes from talking the project through.

const RATE = 50; // £ per hour

// A simple app on one device: a few screens, data kept on the device, and
// the release through App Review.
const BASE_HOURS = 80;

// What each device adds on top of the base. The base covers whichever
// chosen device is cheapest to add, so a Mac-only app costs the same as an
// iPhone-only one.
const DEVICE_HOURS = {
  iPhone: 0,
  // A foldable: the same app has to reflow as the window changes size.
  "iPhone Duo": 16,
  iPad: 16,
  Mac: 40,
  "Apple Watch": 30,
  "Apple TV": 40,
  "Vision Pro": 40,
};

export const EXISTING_APP = "An existing app to update";

const FEATURE_HOURS = {
  Accounts: 24,
  "Sync between devices": 32,
  "In-app purchases": 24,
  Widgets: 16,
  "Its own server or API": 40,
};

export const FEATURES = [...Object.keys(FEATURE_HOURS), EXISTING_APP];

// Design, planning and client communication, which a day job leaves to
// other people but a freelance project doesn't.
const OVERHEAD = 1.2;

// The visitor's timeline. A tight one means evenings and weekends on top of
// the day job, so it costs more; a flexible one fits around other work, so
// a little less. `weeks` is the latest it can finish, for the fit check.
// `note` explains the change on the page without giving the percentage away.
const TIMELINE = {
  "As soon as possible": { multiplier: 1.25, note: "Includes a rush premium for putting your project first." },
  "1–3 months": {
    multiplier: 1.1,
    weeks: 13,
    label: "3 months",
    note: "Includes a small premium for a 1–3 month turnaround.",
  },
  "3–6 months": { multiplier: 1, weeks: 26, label: "6 months" },
  Flexible: { multiplier: 0.95, note: "Includes a discount for a flexible timeline." },
};

export const TIMELINES = Object.keys(TIMELINE);

export const timelineNote = (timeline) => TIMELINE[timeline]?.note ?? "";

// Hours a week that fit alongside the day job.
const WEEKLY_HOURS = 12;

// Projects run over far more often than under, so the range leans up.
const LOW = 0.85;
const HIGH = 1.25;

const roundTo500 = (n) => Math.round(n / 500) * 500;

export function estimateHours({ devices = [], features = [] } = {}) {
  const deviceHours = devices.map((d) => DEVICE_HOURS[d] ?? 0);
  const extraDevices = deviceHours.reduce((a, b) => a + b, 0) - Math.min(...deviceHours);
  const featureHours = features.reduce((sum, f) => sum + (FEATURE_HOURS[f] ?? 0), 0);
  return BASE_HOURS + extraDevices + featureHours;
}

// null until a device is picked, { existing: true } for an app that's
// already written (its code decides the cost, so there's no honest number
// from chips), otherwise a { low, high } range in pounds, plus `tooLong`
// (the timeline's label) when the work won't fit in the chosen window.
export function estimate({ devices = [], features = [], timeline = "" } = {}) {
  if (devices.length === 0) return null;
  if (features.includes(EXISTING_APP)) return { existing: true };
  const hours = estimateHours({ devices, features }) * OVERHEAD;
  const { multiplier = 1, weeks, label } = TIMELINE[timeline] ?? {};
  const cost = hours * RATE * multiplier;
  const result = { low: roundTo500(cost * LOW), high: roundTo500(cost * HIGH) };
  if (weeks && hours / WEEKLY_HOURS > weeks) result.tooLong = label;
  return result;
}

const pounds = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });

export const formatRange = ({ low, high }) => `${pounds.format(low)}–${pounds.format(high)}`;

export function describeEstimate(result) {
  if (!result) return "Pick a device to see a rough estimate.";
  if (result.existing) return "Updating an existing app depends on how it's built, so I'd need to see its code first.";
  if (result.tooLong) {
    return `About ${formatRange(result)}. That's likely more than ${result.tooLong} of work, so the timeline may need to stretch.`;
  }
  return `Projects like this usually come to about ${formatRange(result)}.`;
}
