// The score stores need bun:sqlite, which only exists on Bun. On Netlify
// (Node) there is nowhere to keep them, so the endpoints get null and
// answer 503; every game already plays on without a saved score.
const STORES = {
  maze: () => import("./maze-scores.js"),
  notfound: () => import("./notfound-scores.js"),
  runner: () => import("./runner-scores.js"),
};

// An unknown name gets no store rather than someone else's.
export async function loadScoreStore(name) {
  if (typeof Bun === "undefined" || !Object.hasOwn(STORES, name)) return null;
  return STORES[name]();
}
