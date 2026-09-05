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
          <a href="/app-store" data-path="/app-store">App Store</a>
        </nav>
      </div>
    </div>
  `;

  header.querySelectorAll("nav a").forEach((a) => {
    if (a.dataset.path === path) a.classList.add("active");
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
