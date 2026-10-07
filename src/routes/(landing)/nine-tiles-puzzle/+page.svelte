<script>
  import "#lib/styles/landing.css";
  import "#lib/styles/apps/nine-tiles-puzzle.css";
  import Seo from "#lib/components/Seo.svelte";
  import { campaignUrl } from "#lib/apps/campaign.js";
  import { landingReveal } from "#lib/actions/landing-reveal.js";
  import LandingCountdown from "#lib/components/LandingCountdown.svelte";
</script>

<Seo
  title="9 Tiles Puzzle"
  description="A sliding-image puzzle for iOS. Fetch a photo, slice it into a grid, scramble the pieces, and put it back together across seven distinct game modes."
  url="https://cilippofilia.dev/nine-tiles-puzzle/"
  image="https://cilippofilia.dev/nine-tiles-puzzle/assets/icon.png"
/>

<svelte:head>
  <link rel="icon" href="/nine-tiles-puzzle/assets/favicon.png" />
  <link rel="apple-touch-icon" href="/nine-tiles-puzzle/assets/apple-touch-icon.png" />
</svelte:head>

<div class="aurora" aria-hidden="true">
  <div
    class="float"
    style="width:120px; height:120px; top:8%; left:6%; --float-rotate:-18deg; --float-opacity:0.05; --float-duration:19s; --float-delay:-2s;"
  ></div>
  <div
    class="float"
    style="width:90px; height:90px; top:18%; left:82%; --float-rotate:32deg; --float-opacity:0.07; --float-duration:15s; --float-delay:-6s;"
  ></div>
  <div
    class="float"
    style="width:150px; height:150px; top:38%; left:-4%; --float-rotate:12deg; --float-opacity:0.045; --float-duration:22s; --float-delay:-10s; --float-mask:var(--piece-svg-alt);"
  ></div>
  <div
    class="float"
    style="width:70px; height:70px; top:52%; left:70%; --float-rotate:-40deg; --float-opacity:0.08; --float-duration:13s; --float-delay:-1s; --float-mask:var(--piece-svg-alt);"
  ></div>
  <div
    class="float"
    style="width:110px; height:110px; top:70%; left:14%; --float-rotate:22deg; --float-opacity:0.05; --float-duration:18s; --float-delay:-8s; --float-mask:var(--piece-svg-alt);"
  ></div>
  <div
    class="float"
    style="width:100px; height:100px; top:85%; left:88%; --float-rotate:-8deg; --float-opacity:0.06; --float-duration:20s; --float-delay:-4s; --float-mask:var(--piece-svg-alt);"
  ></div>
  <div
    class="float"
    style="width:60px; height:60px; top:4%; left:45%; --float-rotate:55deg; --float-opacity:0.06; --float-duration:14s; --float-delay:-9s;"
  ></div>
</div>

<nav class="site">
  <div class="wrap">
    <img src="/nine-tiles-puzzle/assets/icon.png" alt="" />
    <span>9 Tiles Puzzle</span>
  </div>
</nav>

<div class="wrap">
  <header class="hero">
    <div class="icon-orb">
      <img src="/nine-tiles-puzzle/assets/icon.png" alt="9 Tiles Puzzle app icon" />
    </div>
    <h1 class="title">9 Tiles Puzzle</h1>
    <p class="tagline">
      Slice any photo into a grid, scramble it, and race to put it back together — seven ways to play.
    </p>
    <LandingCountdown release="2026-09-28T00:00:00" />
    <p class="release-live" id="release-live" hidden>🎉 Available now!</p>
    <div class="badge-row" id="badge-pre">
      <a class="btn primary" href={campaignUrl("https://apps.apple.com/app/id6776386637", "site-nine-tiles-puzzle")}>Pre-order on the App Store</a>
      <a class="btn secondary" href="https://testflight.apple.com/join/7FvEWNPR">Test the Beta*</a>
    </div>
    <p class="beta-note" id="beta-note">
      * Joining the beta and flagging anything wrong with the app will give you access to the whole game for free,
      forever.
    </p>
    <div class="badge-row" id="badge-post" hidden>
      <a class="btn primary" href={campaignUrl("https://apps.apple.com/app/id6776386637", "site-nine-tiles-puzzle")}>Download on the App Store</a>
    </div>
  </header>

  <main use:landingReveal>
    <section>
      <span class="eyebrow">Game Modes</span>
      <h2>Seven ways to play</h2>
      <ul class="features">
        <li>
          <span class="glyph">🧩</span><strong>Slide</strong><span class="desc"
            >Classic sliding movement — placed tiles can still be nudged later.</span
          >
        </li>
        <li>
          <span class="glyph">🔀</span><strong>Swap</strong><span class="desc"
            >Swap any two tiles; correct ones lock in place for good.</span
          >
        </li>
        <li>
          <span class="glyph">⏱️</span><strong>Time Trial</strong><span class="desc"
            >Race the clock, with a Gauntlet Ladder climb of ten stages.</span
          >
        </li>
        <li>
          <span class="glyph">🎯</span><strong>Limited Moves</strong><span class="desc"
            >Solve within a move budget set by the grid size.</span
          >
        </li>
        <li>
          <span class="glyph">🍃</span><strong>Zen</strong><span class="desc">Untimed, no streaks to break.</span>
        </li>
        <li>
          <span class="glyph">🌫️</span><strong>Haze</strong><span class="desc"
            >Tiles hide behind drifting fog — shake to peek.</span
          >
        </li>
        <li>
          <span class="glyph">🌀</span><strong>Chaos</strong><span class="desc"
            >The source image may be recolored, mirrored, or flipped.</span
          >
        </li>
      </ul>
    </section>

    <section>
      <span class="eyebrow">And more</span>
      <h2>More to explore</h2>
      <ul class="features">
        <li>
          <span class="glyph">📅</span><strong>Daily Challenge</strong><span class="desc"
            >One seeded puzzle a day, with a calendar to track and replay your streak.</span
          >
        </li>
        <li>
          <span class="glyph">📸</span><strong>Five image sources</strong><span class="desc"
            >Random photos, your own library, Quick Snap with the camera, and more.</span
          >
        </li>
        <li>
          <span class="glyph">🏆</span><strong>Stats &amp; Achievements</strong><span class="desc"
            >Personal bests, 39 unlockable achievements, and a Wall of Fame.</span
          >
        </li>
        <li>
          <span class="glyph">📱</span><strong>Widgets &amp; Live Activity</strong><span class="desc"
            >Track a puzzle in progress right from the Lock Screen and home screen.</span
          >
        </li>
      </ul>
    </section>
  </main>
</div>

<footer class="site">
  <div class="wrap">
    <div class="links">
      <a href="privacy-policy.html">Privacy Policy</a>
      <a href="/home">More apps</a>
      <a href="https://github.com/cilippofilia/NineTilesPuzzle">GitHub</a>
      <a href="mailto:cilia.filippo.dev@gmail.com">Contact</a>
    </div>
    <div>© 2026 Filippo Cilia</div>
  </div>
</footer>
