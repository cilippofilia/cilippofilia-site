// Sent on every response (hooks.server.js) and kept identical to the
// [[headers]] block in netlify.toml; src/build-output.test.js fails if the
// two drift apart.
//
// - Scripts: this header allows 'self' and inline, and SvelteKit's
//   <meta http-equiv="Content-Security-Policy"> (csp in vite.config.js)
//   narrows that to 'self' plus the hash of its one bootstrap script.
//   Browsers enforce both policies, so no other inline script, on…=
//   attribute or javascript: URL can run. The header can't carry the hashes
//   itself because they differ per page.
// - Styles allow 'unsafe-inline' because many pages and templates carry
//   style="..." attributes; inline CSS can't run code, so the cost is small.
// - Images: this origin, data: URIs (the SVG masks in the landing pages'
//   stylesheets) and Apple's artwork CDN, which serves App Store icons from
//   numbered hosts (is1-ssl, is2-ssl, ...).
// - frame-ancestors / X-Frame-Options stop the site being framed for
//   clickjacking, and form-action 'none' because there are no forms at all.
export const SECURITY_HEADERS = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://*.mzstatic.com",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join("; "),
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Cross-Origin-Opener-Policy": "same-origin",
};
