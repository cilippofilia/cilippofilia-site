import { test, expect } from "bun:test";
import { handle, isForeignWrite } from "./hooks.server.js";
import { SECURITY_HEADERS } from "./lib/server/security-headers.js";

function event(path, { method = "GET", origin } = {}) {
  const url = new URL(path, "http://localhost:4321");
  const headers = origin === undefined ? {} : { origin };
  return { url, request: new Request(url, { method, headers }) };
}
const resolveOk = async () => new Response("ok", { headers: { "content-type": "text/html" } });

test("/ and /app-store redirect like before", async () => {
  const home = await handle({ event: event("/"), resolve: resolveOk });
  expect(home.status).toBe(302);
  expect(home.headers.get("location")).toBe("/home");
  const store = await handle({ event: event("/app-store"), resolve: resolveOk });
  expect(store.status).toBe(301);
  expect(store.headers.get("location")).toBe("/home#apps");
});

test("/favicon.ico serves the SVG favicon", async () => {
  const res = await handle({ event: event("/favicon.ico"), resolve: resolveOk });
  expect(res.status).toBe(200);
  expect(res.headers.get("content-type")).toBe("image/svg+xml");
  expect(await res.text()).toContain("<svg");
});

test("every response carries the security headers", async () => {
  const res = await handle({ event: event("/home"), resolve: resolveOk });
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    expect(res.headers.get(name)).toContain(value);
  }
});

test("a CSP SvelteKit already set is kept alongside ours", async () => {
  const resolve = async () =>
    new Response("ok", { headers: { "content-security-policy": "script-src 'self' 'sha256-abc'" } });
  const res = await handle({ event: event("/home"), resolve });
  const csp = res.headers.get("content-security-policy");
  expect(csp).toContain("'sha256-abc'");
  expect(csp).toContain("frame-ancestors 'none'");
});

test("isForeignWrite: reads and same-origin or originless writes pass", () => {
  const url = new URL("http://localhost:4321/api/maze-score");
  expect(isForeignWrite(new Request(url, { method: "POST" }), url)).toBe(false);
  expect(isForeignWrite(new Request(url, { method: "POST", headers: { origin: "http://localhost:4321" } }), url)).toBe(
    false
  );
  expect(isForeignWrite(new Request(url, { headers: { origin: "https://evil.example" } }), url)).toBe(false);
});

test("isForeignWrite: foreign, null or garbage origins on a write are foreign", () => {
  const url = new URL("http://localhost:4321/api/maze-score");
  for (const origin of ["https://evil.example", "null", "::::", "http://localhost:5173"]) {
    expect(isForeignWrite(new Request(url, { method: "POST", headers: { origin } }), url)).toBe(true);
  }
});

test("a cross-origin POST to the API is refused before it reaches the route", async () => {
  let reached = false;
  const res = await handle({
    event: event("/api/maze-score", { method: "POST", origin: "https://evil.example" }),
    resolve: async () => ((reached = true), new Response("ok")),
  });
  expect(res.status).toBe(403);
  expect(reached).toBe(false);
  expect(res.headers.get("x-frame-options")).toBe("DENY");
});
