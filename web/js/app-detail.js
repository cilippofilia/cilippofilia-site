// Pure renderers for the generic in-development app page (web/app.html).
// No DOM access here so they can be tested with bun test.
import { badgeClass, isImageIcon } from "./app-card.js";
import { escapeHtml as esc } from "./html.js";

export function renderNotFound(slug) {
  return `
    <section class="hero" style="margin-top:0">
      <h1>Nothing here yet</h1>
      <p class="lede">There's no app at <code>/${esc(slug)}</code>. Add an entry with this
      slug to <code>data/apps.json</code> to give it a page.</p>
      <a class="button secondary" href="/home#apps"><span class="chevron">←</span> Back to App Store</a>
    </section>
  `;
}

export function renderAppDetail(app) {
  const icon = esc(app.icon);
  const platforms = (app.platforms || []).map((p) => `<span class="chip">${esc(p)}</span>`).join("");
  return `
    <section class="hero app-detail" style="margin-top:0">
      <div class="app-detail-head">
        ${
          isImageIcon(app.icon)
            ? `<img class="icon-lg icon-img" src="${icon}" alt="" width="88" height="88" />`
            : `<span class="icon-lg">${icon || "📱"}</span>`
        }
        <div class="app-detail-meta">
          <span class="badge ${badgeClass(app.status)}">${esc(app.status)}</span>
          <h1>${esc(app.name)}</h1>
          <p class="lede">${esc(app.tagline)}</p>
        </div>
      </div>
      <div class="app-detail-body">
        <p class="app-detail-description">${esc(app.description)}</p>
        <div class="app-detail-side">
          <div>
            <h4>Platforms</h4>
            <div class="platforms">${platforms}</div>
          </div>
          <div>
            ${
              app.appStoreUrl
                ? `<a class="button" href="${esc(app.appStoreUrl)}">View on the App Store</a>`
                : `<button type="button" class="button secondary" disabled>Not yet published</button>`
            }
          </div>
          <div>
            <a class="back-link" href="/home#apps"><span class="chevron">‹</span> Go back</a>
          </div>
        </div>
      </div>
    </section>
  `;
}
