// Mounts the generic app page: reads the slug from the URL, fetches
// /apps.json, and hands the matching entry to the renderers.
import { renderAppDetail, renderNotFound } from "./app-detail.js";

const slug = window.location.pathname.replace(/^\/+|\/+$/g, "");
const content = document.getElementById("content");

fetch("/apps.json")
  .then((r) => r.json())
  .then((apps) => {
    const app = apps.find((a) => a.slug === slug);
    if (!app) {
      content.innerHTML = renderNotFound(slug);
      document.title = "Not found · cilippofilia.dev";
      return;
    }
    document.title = `${app.name} · cilippofilia.dev`;
    content.innerHTML = renderAppDetail(app);
  })
  .catch(() => {
    content.innerHTML = '<p class="empty-state">Couldn\'t load apps.json.</p>';
  });
