// The one escaping function every client-side template goes through.
// Both feeds are third-party or hand-edited text; a stray "<" in an App
// Store description must render as a "<", not become markup.
const REPLACEMENTS = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"']/g, (ch) => REPLACEMENTS[ch]);
}
