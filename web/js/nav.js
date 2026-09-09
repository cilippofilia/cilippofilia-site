// Renders the shared header/footer into any page that includes this script.
// Keeps nav consistent across pages without needing a build step.
// Dark mode only — there is no theme toggle.

function renderChrome() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/home";

  const header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML = `
    <div class="wrap">
      <a class="brand" href="/home">cilippofilia<span class="dim">.dev</span></a>
      <div class="nav-group">
        <nav class="site-nav">
          <a href="/home" data-path="/home">Home</a>
          <a href="/home#apps">App Store</a>
        </nav>
      </div>
    </div>
  `;

  header.querySelectorAll("nav a").forEach((a) => {
    if (a.dataset.path === path) a.classList.add("active");
  });

  // "App Store" points at the app cards further down the home page. When we
  // are already on /home the browser would only jump, so scroll there
  // smoothly instead; from any other page the plain /home#apps href does the
  // navigating and the browser lands on the anchor by itself.
  const appsLink = header.querySelector('a[href="/home#apps"]');
  if (appsLink) {
    appsLink.addEventListener("click", (e) => {
      const target = document.getElementById("apps");
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", "/home#apps");
    });
  }

  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `
    <div class="wrap">
      © 2026 Filippo Cilia · Manchester, UK
    </div>
  `;

  document.body.prepend(header);
  document.body.appendChild(footer);
  initHeaderCondense(header);
}

// Tightens the header's glass once the page has scrolled a little, so it
// reads as settled chrome rather than sitting exactly as tall as it does
// over the hero. Driven by an IntersectionObserver on a sentinel near the
// top of the page rather than a scroll listener, so it costs nothing
// between the two states it actually toggles.
function initHeaderCondense(header) {
  if (!("IntersectionObserver" in window)) return;

  const sentinel = document.createElement("div");
  sentinel.setAttribute("aria-hidden", "true");
  sentinel.style.cssText = "position:absolute; top:0; left:0; width:1px; height:56px; pointer-events:none;";
  document.body.prepend(sentinel);

  const io = new IntersectionObserver(
    ([entry]) => header.classList.toggle("is-condensed", !entry.isIntersecting)
  );
  io.observe(sentinel);
}

renderChrome();
