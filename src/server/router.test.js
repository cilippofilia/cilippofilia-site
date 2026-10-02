import { test, expect, beforeAll, afterAll } from "bun:test";
import http from "node:http";
import { handleRequest } from "./router.js";

let server;
let port;

beforeAll(async () => {
  server = http.createServer(handleRequest);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  port = server.address().port;
});

afterAll(() => {
  server.close();
});

// Raw node:http so the path goes out exactly as written (fetch would
// re-encode "%") and redirects are not followed.
export function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: "127.0.0.1", port, path, method }, (res) => {
      let responseBody = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => (responseBody += chunk));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: responseBody }));
    });
    req.on("error", reject);
    if (body !== undefined) req.write(body);
    req.end();
  });
}

test("a malformed percent-escape answers 400 and the server keeps serving", async () => {
  const bad = await request("GET", "/%");
  expect(bad.status).toBe(400);

  const next = await request("GET", "/home");
  expect(next.status).toBe(200);
});

test("/ redirects to /home and /app-store to /home#apps", async () => {
  const root = await request("GET", "/");
  expect(root.status).toBe(302);
  expect(root.headers.location).toBe("/home");

  const old = await request("GET", "/app-store");
  expect(old.status).toBe(301);
  expect(old.headers.location).toBe("/home#apps");
});

test("/privacy and /terms serve the legal pages", async () => {
  const privacy = await request("GET", "/privacy");
  expect(privacy.status).toBe(200);
  expect(privacy.body).toContain("<h1>Privacy Policy</h1>");

  const terms = await request("GET", "/terms");
  expect(terms.status).toBe(200);
  expect(terms.body).toContain("<h1>Terms of Use</h1>");
});

test("shared static files and custom app folders are served", async () => {
  const css = await request("GET", "/css/base.css");
  expect(css.status).toBe(200);
  expect(css.headers["content-type"]).toBe("text/css; charset=utf-8");

  const bare = await request("GET", "/drinko");
  expect(bare.status).toBe(302);
  expect(bare.headers.location).toBe("/drinko/");

  const page = await request("GET", "/drinko/");
  expect(page.status).toBe(200);
  expect(page.body).toContain("<title>Drinko");
});

test("a path that escapes the public folder is refused", async () => {
  const res = await request("GET", "/css/../server.js");
  expect([403, 404]).toContain(res.status);
  expect(res.body).not.toContain("createServer");
});

test("a slug listed in data/apps.json gets the app template", async () => {
  const res = await request("GET", "/the-relay");
  expect(res.status).toBe(200);
  expect(res.body).toContain('id="content"');
});

test("a slug that exists nowhere answers 404 with the not-found page", async () => {
  const res = await request("GET", "/definitely-not-an-app");
  expect(res.status).toBe(404);
  expect(res.headers["content-type"]).toBe("text/html; charset=utf-8");
  expect(res.body).toContain("Nothing here");
});

test("HEAD carries the headers of a GET but no body", async () => {
  const res = await request("HEAD", "/home");
  expect(res.status).toBe(200);
  expect(Number(res.headers["content-length"])).toBeGreaterThan(1000);
  expect(res.body).toBe("");
});

test("posting a maze solve records it in the leaderboard, fastest first", async () => {
  const fast = await request("POST", "/api/maze-score", JSON.stringify({ timeMs: 1, moves: 3 }));
  expect(JSON.parse(fast.body).top[0]).toEqual({ timeMs: 1, moves: 3 });

  const slower = await request(
    "POST",
    "/api/maze-score",
    JSON.stringify({ timeMs: 999999999, moves: 3 })
  );
  expect(JSON.parse(slower.body).top[0]).toEqual({ timeMs: 1, moves: 3 });

  const get = await request("GET", "/api/maze-score");
  expect(JSON.parse(get.body).top[0]).toEqual({ timeMs: 1, moves: 3 });
});

test("assets are cacheable briefly, pages and feeds are revalidated", async () => {
  const css = await request("GET", "/css/base.css");
  expect(css.headers["cache-control"]).toBe("public, max-age=5");

  const icon = await request("GET", "/assets/app-icons/thumb/relay-icon.png");
  expect(icon.headers["cache-control"]).toBe("public, max-age=5");

  const home = await request("GET", "/home");
  expect(home.headers["cache-control"]).toBe("no-cache");

  const feed = await request("GET", "/apps.json");
  expect(feed.headers["cache-control"]).toBe("no-cache");
});

test("landing pages share /js/landing-reveal.js instead of their own copies", async () => {
  const shared = await request("GET", "/js/landing-reveal.js");
  expect(shared.status).toBe(200);
  expect(shared.body).toContain("IntersectionObserver");
  for (const p of ["/drinko/", "/iterly/", "/itswritten/", "/nine-tiles-puzzle/"]) {
    const res = await request("GET", p);
    expect(res.body).toContain('<script src="/js/landing-reveal.js"></script>');
  }
  for (const p of ["/drinko/app.js", "/iterly/app.js", "/itswritten/app.js"]) {
    const res = await request("GET", p);
    expect(res.status).toBe(404);
  }
  const nineTiles = await request("GET", "/nine-tiles-puzzle/app.js");
  expect(nineTiles.status).toBe(200);
  expect(nineTiles.body).toContain("countdown");
  expect(nineTiles.body).not.toContain("IntersectionObserver");
});
