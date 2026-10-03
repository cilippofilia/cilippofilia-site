// Request handling for /api/maze-score and /api/notfound-score, kept out of
// the +server.js files so it can be tested with plain Request objects and a
// fake store.

// The score APIs take a few dozen bytes of JSON. Anything past this is not
// a real submission, so it's dropped rather than parsed: the handler then
// sees no input, records nothing, and still returns the real scores.
export const MAX_BODY_BYTES = 1024;

async function readJson(request) {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return {};
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

const unavailable = () => Response.json({ error: "Scores aren't saved on this deployment." }, { status: 503 });

export async function mazeScore(request, store) {
  if (!store) return unavailable();
  if (request.method === "POST") {
    const { timeMs = 0, moves = 0 } = await readJson(request);
    return Response.json({ top: store.submitEntry(timeMs, moves) });
  }
  return Response.json({ top: store.getTop() });
}

export async function notfoundScore(request, store) {
  if (!store) return unavailable();
  if (request.method === "POST") {
    const { score = 0 } = await readJson(request);
    return Response.json({ best: store.submitScore(score) });
  }
  return Response.json({ best: store.getBest() });
}
