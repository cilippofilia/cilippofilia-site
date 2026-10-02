// The fixed set of app statuses, in the order the home page grid lists
// them. "Live" only ever comes from Apple's feed; the rest are the values
// data/apps.json's "status" field may take. Pure — no DOM — so it can be
// tested with bun test.

export const STATUSES = [
  { label: "Live", badge: "live" },
  { label: "Beta", badge: "beta" },
  { label: "In development", badge: "dev" },
  { label: "Planning", badge: "planning" },
  { label: "Discovery", badge: "discovery" },
];

function findStatus(status) {
  const s = (status || "").trim().toLowerCase();
  return STATUSES.findIndex((entry) => entry.label.toLowerCase() === s);
}

// Position in the grid order. Anything that isn't one of STATUSES sorts
// with Discovery, at the end, rather than jumping the queue.
export function statusRank(status) {
  const index = findStatus(status);
  return index === -1 ? STATUSES.length - 1 : index;
}

// Badge colour class. An unrecognized status keeps a neutral badge so a
// typo in apps.json is visible instead of borrowing another status's colour.
export function badgeClass(status) {
  const index = findStatus(status);
  return index === -1 ? "example" : STATUSES[index].badge;
}

// Stable sort by status, so apps within one status keep their feed order
// (Apple's order for Live, apps.json's order for the rest).
export function sortByStatus(apps) {
  return apps
    .map((app, index) => ({ app, index }))
    .sort((a, b) => statusRank(a.app.status) - statusRank(b.app.status) || a.index - b.index)
    .map(({ app }) => app);
}
