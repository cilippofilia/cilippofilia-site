// Renders the shared header/footer into any page that includes this script.
// Keeps nav consistent across pages without needing a build step.
// Dark mode only — there is no theme toggle.

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
      cilippofilia.co.uk — local only, running on your machine.
    </div>
  `;

  document.body.prepend(header);
  document.body.appendChild(footer);
}

renderChrome();
