// Renders the shared header/footer into any page that includes this script.
// Keeps nav consistent across pages without needing a build step.

const THEME_KEY = "theme"; // localStorage: "light" | "dark" | absent (follow the system)

function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

function storeTheme(theme) {
  try {
    if (theme) localStorage.setItem(THEME_KEY, theme);
    else localStorage.removeItem(THEME_KEY);
  } catch {
    // Private browsing etc. — the toggle still works for this page load,
    // it just won't be remembered next visit.
  }
}

function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

// What the page is actually rendering right now, whether that's from an
// explicit choice or just from following the system.
function isDarkNow() {
  const stored = getStoredTheme();
  if (stored === "light") return false;
  if (stored === "dark") return true;
  return systemPrefersDark();
}

function applyTheme(theme) {
  if (theme === "light" || theme === "dark") {
    document.documentElement.setAttribute("data-theme", theme);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

const SUN_ICON =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12H5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/></svg>';
const MOON_ICON =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.4 14.7a8.9 8.9 0 0 1-11-11.1.75.75 0 0 0-.97-.95A9.4 9.4 0 1 0 21.4 15.7a.75.75 0 0 0-1-1z"/></svg>';

// The icon shown is the mode a click would switch *to*.
function syncThemeToggle(button) {
  const dark = isDarkNow();
  button.innerHTML = dark ? SUN_ICON : MOON_ICON;
  const label = dark ? "Switch to light mode" : "Switch to dark mode";
  button.setAttribute("aria-label", label);
  button.setAttribute("title", label);
}

function renderChrome() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/home";

  const header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML = `
    <div class="wrap">
      <a class="brand" href="/home">cilippofilia<span class="dim">.co.uk</span></a>
      <div class="nav-group">
        <nav class="site-nav">
          <a href="/home" data-path="/home">Home</a>
          <a href="/app-store" data-path="/app-store">App Store</a>
        </nav>
        <button type="button" class="theme-toggle" id="theme-toggle"></button>
      </div>
    </div>
  `;

  header.querySelectorAll("nav a").forEach((a) => {
    if (a.dataset.path === path) a.classList.add("active");
  });

  const toggle = header.querySelector("#theme-toggle");
  syncThemeToggle(toggle);
  toggle.addEventListener("click", () => {
    const next = isDarkNow() ? "light" : "dark";
    storeTheme(next);
    applyTheme(next);
    syncThemeToggle(toggle);
  });

  // No explicit choice saved yet — keep following the system live so the
  // icon (and the page) update if the visitor changes their OS appearance
  // while this tab is open.
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (!getStoredTheme()) syncThemeToggle(toggle);
  });

  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `
    <div class="wrap">
      cilippofilia.co.uk — local only, running on your machine.
    </div>
  `;

  document.body.prepend(header);
  document.body.appendChild(footer);
}

renderChrome();
