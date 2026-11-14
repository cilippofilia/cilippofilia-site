import { SITE_ORIGIN } from "./apps/meta.js";

// schema.org JSON-LD for search engines. It tells Google who the site is
// about and what the apps are, so searches like "iOS developer" or an app's
// name can connect the person, the site and the App Store listings.

const PERSON_ID = `${SITE_ORIGIN}/#person`;

export const PERSON = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": PERSON_ID,
  name: "Filippo Cilia",
  alternateName: "Filippo Carlo Cilia",
  url: `${SITE_ORIGIN}/home`,
  image: `${SITE_ORIGIN}/assets/profile.jpg`,
  jobTitle: "iOS and macOS Developer",
  knowsAbout: ["iOS development", "macOS development", "Swift", "SwiftUI", "SwiftData", "App Store"],
  sameAs: [
    "https://apps.apple.com/us/developer/filippo-carlo-cilia/id1690376038",
    "https://github.com/cilippofilia",
    "https://www.linkedin.com/in/filippocarlocilia",
    "https://x.com/cilippofilia",
    "https://instagram.com/cilippofilia",
  ],
};

// A free app on the App Store, credited to PERSON. category is one of
// schema.org's applicationCategory values Google recognises
// (LifestyleApplication, GameApplication, DeveloperApplication, …).
// downloadUrl defaults to the App Store listing; an app distributed from this
// site passes its own.
export function appSchema({
  name,
  description,
  slug,
  appStoreId,
  category,
  operatingSystem,
  downloadUrl = `https://apps.apple.com/app/id${appStoreId}`,
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    url: `${SITE_ORIGIN}/${slug}/`,
    image: `${SITE_ORIGIN}/${slug}/assets/icon.png`,
    downloadUrl,
    applicationCategory: category,
    operatingSystem,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    author: { "@id": PERSON_ID },
  };
}

// The <script> tag for <svelte:head>. JSON.stringify leaves "<" alone, so a
// value containing "</script>" could close the tag early; escaping it keeps
// the block inert. Data blocks aren't executed, so the hash-based CSP allows it.
export function jsonLdTag(data) {
  const json = JSON.stringify(data).replaceAll("<", "\\u003c");
  return `<script type="application/ld+json">${json}</script>`;
}
