// Local-only static server for cilippofilia.dev.
//
// Binds to 127.0.0.1 only — nothing outside this machine can reach it.
// The routing table lives in src/server/router.js; the file-reading and App
// Store plumbing in the rest of src/server/. This file only listens.
//
// Run with: bun server.js
// Then open: http://localhost:4321/home

const http = require("http");
const { handleRequest } = require("./src/server/router");

const PORT = process.env.PORT ? Number(process.env.PORT) : 4321;
const HOST = "127.0.0.1"; // local only, on purpose

http.createServer(handleRequest).listen(PORT, HOST, () => {
  console.log(`cilippofilia.dev running locally at http://${HOST}:${PORT}/home`);
  console.log("(bound to 127.0.0.1 — not reachable from any other device)");
});
