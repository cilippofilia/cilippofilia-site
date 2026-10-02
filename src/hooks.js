// App Store listings link to each landing page's privacy policy at its old
// .html URL. The page itself lives at /<app>/privacy-policy (prerendered to
// <app>/privacy-policy.html on Netlify); this maps the .html path onto it
// so the same URL also resolves under vite dev.
const PRIVACY_HTML = /^\/(drinko|iterly|itswritten|nine-tiles-puzzle)\/privacy-policy\.html$/;

/** @type {import('@sveltejs/kit').Reroute} */
export function reroute({ url }) {
  const match = url.pathname.match(PRIVACY_HTML);
  if (match) return `/${match[1]}/privacy-policy`;
}
