import { loadScoreStore } from "#lib/server/score-stores.js";
import { runnerScore } from "#lib/server/score-api.js";

export const prerender = false;

export async function GET({ request }) {
  return runnerScore(request, await loadScoreStore("runner"));
}

export async function POST({ request }) {
  return runnerScore(request, await loadScoreStore("runner"));
}
