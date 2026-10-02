// Fills each token label on /style-guide with its current value from
// tokens.css. Lives in its own file rather than an inline <script> because
// the Content-Security-Policy only allows scripts served from this origin.
const rootStyle = getComputedStyle(document.documentElement);
document.querySelectorAll("[data-token]").forEach((el) => {
  el.textContent = rootStyle.getPropertyValue(el.dataset.token).trim();
});
