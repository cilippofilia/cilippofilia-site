import { sveltekit } from "@sveltejs/kit/vite";
import adapter from "@sveltejs/adapter-netlify";
import { defineConfig } from "vite";

// SvelteKit 3 takes its config here rather than in svelte.config.js.
//
// Only script-src goes in csp. With style-src here too, SvelteKit would
// add hashes to it, which switches off 'unsafe-inline' and breaks every
// style="..." attribute the pages carry. The rest of the policy is sent as
// a header (src/lib/server/security-headers.js and netlify.toml); the
// browser enforces both, so the header's 'unsafe-inline' for scripts is
// narrowed by this meta policy to SvelteKit's one hashed bootstrap script.
//
// The dev server binds to 127.0.0.1 like the old server.js: it is a local
// dev server, not something to expose on the network.
export default defineConfig({
  plugins: [
    sveltekit({
      adapter: adapter(),
      csp: {
        mode: "hash",
        directives: { "script-src": ["self"] },
      },
    }),
  ],
  server: { host: "127.0.0.1", port: 4321, strictPort: true },
  preview: { host: "127.0.0.1", port: 4321, strictPort: true },
});
