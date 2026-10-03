import { loadScoreStore } from "#lib/server/score-stores.js";
import { notfoundScore } from "#lib/server/score-api.js";

export const prerender = false;

export async function GET({ request }) {
  return notfoundScore(request, await loadScoreStore("notfound"));
}

export async function POST({ request }) {
  return notfoundScore(request, await loadScoreStore("notfound"));
}
