import { test, expect } from "bun:test";
import { mazeScore, notfoundScore, runnerScore, MAX_BODY_BYTES } from "./score-api.js";
import { loadScoreStore } from "./score-stores.js";

const post = (body) => new Request("http://localhost/api/x", { method: "POST", body });
const get = () => new Request("http://localhost/api/x");

function fakeMaze() {
  const calls = [];
  return {
    calls,
    getTop: () => [{ timeMs: 1, moves: 1 }],
    submitEntry: (t, m) => (calls.push([t, m]), [{ timeMs: t, moves: m }]),
  };
}
function fakeRunner() {
  const calls = [];
  return {
    calls,
    getTop: () => [{ score: 5, skater: "pip" }],
    submitEntry: (s, k) => (calls.push([s, k]), [{ score: s, skater: k }]),
  };
}
function fakeNotfound() {
  const calls = [];
  return { calls, getBest: () => 7, submitScore: (s) => (calls.push(s), 9) };
}

test("GET returns the current leaderboard and best", async () => {
  expect(await (await mazeScore(get(), fakeMaze())).json()).toEqual({ top: [{ timeMs: 1, moves: 1 }] });
  expect(await (await notfoundScore(get(), fakeNotfound())).json()).toEqual({ best: 7 });
});

test("POST submits the parsed fields", async () => {
  const maze = fakeMaze();
  await mazeScore(post(JSON.stringify({ timeMs: 1234.5, moves: 30 })), maze);
  expect(maze.calls).toEqual([[1234.5, 30]]);
  const nf = fakeNotfound();
  const res = await notfoundScore(post(JSON.stringify({ score: 12 })), nf);
  expect(nf.calls).toEqual([12]);
  expect(await res.json()).toEqual({ best: 9 });
});

test("malformed JSON counts as no input but still answers 200", async () => {
  const maze = fakeMaze();
  const res = await mazeScore(post("{not json"), maze);
  expect(res.status).toBe(200);
  expect(maze.calls).toEqual([[0, 0]]);
  const nf = fakeNotfound();
  expect((await notfoundScore(post("nope"), nf)).status).toBe(200);
  expect(nf.calls).toEqual([0]);
});

test("a body over the cap is dropped, not parsed", async () => {
  const nf = fakeNotfound();
  const huge = JSON.stringify({ score: 5, pad: "x".repeat(MAX_BODY_BYTES) });
  await notfoundScore(post(huge), nf);
  expect(nf.calls).toEqual([0]);
});

test("missing fields count as no input", async () => {
  const maze = fakeMaze();
  await mazeScore(post(JSON.stringify({ moves: 3 })), maze);
  expect(maze.calls).toEqual([[0, 3]]);
});

test("with no store (not on Bun) every endpoint answers 503 JSON", async () => {
  for (const handler of [mazeScore, notfoundScore, runnerScore]) {
    const res = await handler(get(), null);
    expect(res.status).toBe(503);
    expect(res.headers.get("content-type")).toContain("application/json");
  }
});

test("loadScoreStore returns the real store modules on Bun", async () => {
  expect(typeof (await loadScoreStore("maze")).getTop).toBe("function");
  expect(typeof (await loadScoreStore("notfound")).getBest).toBe("function");
  expect(typeof (await loadScoreStore("runner")).submitEntry).toBe("function");
});

test("loadScoreStore has no store for an unknown name", async () => {
  expect(await loadScoreStore("leaderboard")).toBeNull();
  expect(await loadScoreStore("toString")).toBeNull();
});

test("the runner endpoint reports and submits score and skater", async () => {
  expect(await (await runnerScore(get(), fakeRunner())).json()).toEqual({ top: [{ score: 5, skater: "pip" }] });
  const runner = fakeRunner();
  const res = await runnerScore(post(JSON.stringify({ score: 420, skater: "kit" })), runner);
  expect(runner.calls).toEqual([[420, "kit"]]);
  expect(await res.json()).toEqual({ top: [{ score: 420, skater: "kit" }] });
});

test("a malformed runner submission counts as no input", async () => {
  const runner = fakeRunner();
  expect((await runnerScore(post("{oops"), runner)).status).toBe(200);
  expect(runner.calls).toEqual([[0, ""]]);
});
