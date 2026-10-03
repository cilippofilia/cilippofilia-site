// The score stores need bun:sqlite, which only exists on Bun. On Netlify
// (Node) there is nowhere to keep them, so the endpoints get null and
// answer 503; both games already play on without a saved score.
export async function loadScoreStore(name) {
  if (typeof Bun === "undefined") return null;
  return name === "maze" ? import("./maze-scores.js") : import("./notfound-scores.js");
}
