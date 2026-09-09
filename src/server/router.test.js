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
