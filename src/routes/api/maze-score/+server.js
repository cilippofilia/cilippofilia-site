import { loadScoreStore } from "#lib/server/score-stores.js";
import { mazeScore } from "#lib/server/score-api.js";

export const prerender = false;

export async function GET({ request }) {
  return mazeScore(request, await loadScoreStore("maze"));
}

export async function POST({ request }) {
  return mazeScore(request, await loadScoreStore("maze"));
}
