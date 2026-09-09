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
export function request(method, path) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: "127.0.0.1", port, path, method }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on("error", reject);
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

test("assets are cacheable for an hour, pages and feeds are revalidated", async () => {
  const css = await request("GET", "/css/base.css");
  expect(css.headers["cache-control"]).toBe("public, max-age=3600");

  const icon = await request("GET", "/assets/app-icons/thumb/relay-icon.png");
  expect(icon.headers["cache-control"]).toBe("public, max-age=3600");

  const home = await request("GET", "/home");
  expect(home.headers["cache-control"]).toBe("no-cache");

  const feed = await request("GET", "/apps.json");
  expect(feed.headers["cache-control"]).toBe("no-cache");
});
