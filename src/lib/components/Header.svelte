<script>
  import { page } from "$app/state";
  import { goto } from "$app/navigation";

  // The shared header. intro-flip.js measures the pin offset against
  // header.site-header, so the class name and markup are load-bearing.
  const path = $derived(page.url.pathname.replace(/\/+$/, "") || "/home");

  let sentinel;
  let condensed = $state(false);

  // Tightens the header's glass once the page has scrolled a little, so it
  // reads as settled chrome rather than sitting exactly as tall as it does
  // over the hero. An IntersectionObserver on a sentinel near the top of the
  // page rather than a scroll listener, so it costs nothing between the two
  // states it actually toggles.
  $effect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([entry]) => (condensed = !entry.isIntersecting));
    io.observe(sentinel);
    return () => io.disconnect();
  });

  // "App Store" points at the app cards further down the home page. On
  // /home the browser would only jump, so scroll there smoothly instead;
  // from any other page the plain /home#apps href does the navigating.
  function scrollToApps(event) {
    const target = document.getElementById("apps");
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    // Shallow: updates the address bar without navigating or resetting the
    // scroll the smooth scroll above has just started.
    goto("/home#apps", { replace: true, shallow: true });
  }
</script>

<div
  bind:this={sentinel}
  aria-hidden="true"
  style="position:absolute; top:0; left:0; width:1px; height:56px; pointer-events:none;"
></div>
<header class="site-header" class:is-condensed={condensed}>
  <div class="wrap">
    <a class="brand" href="/home">cilippofilia<span class="dim">.dev</span></a>
    <div class="nav-group">
      <nav class="site-nav">
        <a href="/home" class:active={path === "/home"}>Home</a>
        <a href="/home#apps" onclick={scrollToApps}>App Store</a>
      </nav>
    </div>
  </div>
</header>
