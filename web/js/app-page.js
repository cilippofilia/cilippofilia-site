// Mounts the generic app page: reads the slug from the URL, fetches
// /apps.json, and hands the matching entry to the renderers.
import { appPageMeta, renderAppDetail, renderNotFound } from "./app-detail.js";

const slug = window.location.pathname.replace(/^\/+|\/+$/g, "");
const content = document.getElementById("content");

// Sets the content of a <meta> tag in <head>, creating it if it's missing.
function setMeta(attribute, key, value) {
  let tag = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, key);
    document.head.append(tag);
  }
  tag.setAttribute("content", value);
}

// Points the page's title, description, canonical and Open Graph tags at
// this app instead of the template's generic defaults.
function applyMeta({ title, description, url, image }) {
  document.title = title;
  setMeta("name", "description", description);
  setMeta("property", "og:title", title);
  setMeta("property", "og:description", description);
  setMeta("property", "og:url", url);
  setMeta("property", "og:image", image);
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.append(canonical);
  }
  canonical.href = url;
}

fetch("/apps.json")
  .then((r) => r.json())
  .then((apps) => {
    const app = apps.find((a) => a.slug === slug);
    if (!app) {
      content.innerHTML = renderNotFound(slug);
      document.title = "Not found · cilippofilia.dev";
      return;
    }
    applyMeta(appPageMeta(app));
    content.innerHTML = renderAppDetail(app);
  })
  .catch(() => {
    content.innerHTML = '<p class="empty-state">Couldn\'t load apps.json.</p>';
  });
