<script>
  import "#lib/styles/landing.css";
  import "#lib/styles/apps/notchgames.css";
  import Seo from "#lib/components/Seo.svelte";
  import { landingReveal } from "#lib/actions/landing-reveal.js";
  import { appSchema } from "#lib/structured-data.js";

  // Not on the App Store: the notarised beta is downloaded straight from this site.
  const DMG = "/downloads/NotchGames-1.0.dmg";

  const jsonLd = appSchema({
    name: "NotchGames",
    description:
      "NotchGames is a free macOS menu bar app with six neon arcade games you pull out of your MacBook's notch: pong, air hockey, brick breaker, snake, a runner and a shooting gallery. No Dock icon, no special permissions.",
    slug: "notchgames",
    category: "GameApplication",
    operatingSystem: "macOS",
    downloadUrl: `https://cilippofilia.dev${DMG}`,
  });
</script>

<Seo
  title="NotchGames"
  description={jsonLd.description}
  url="https://cilippofilia.dev/notchgames/"
  image="https://cilippofilia.dev/notchgames/assets/banner.png"
  {jsonLd}
/>

<svelte:head>
  <link rel="icon" href="/notchgames/assets/favicon.png" />
  <link rel="apple-touch-icon" href="/notchgames/assets/apple-touch-icon.png" />
</svelte:head>

<div class="aurora" aria-hidden="true">
  <div
    class="float"
    style="width:150px; height:150px; top:6%; left:4%; --float-rotate:-14deg; --float-opacity:0.05; --float-duration:19s; --float-delay:-2s;"
  ></div>
  <div
    class="float"
    style="width:60px; height:60px; top:16%; left:86%; --float-opacity:0.08; --float-duration:15s; --float-delay:-6s; --float-mask:var(--ball-svg);"
  ></div>
  <div
    class="float"
    style="width:170px; height:170px; top:40%; left:-5%; --float-rotate:10deg; --float-opacity:0.045; --float-duration:22s; --float-delay:-10s;"
  ></div>
  <div
    class="float"
    style="width:44px; height:44px; top:56%; left:74%; --float-opacity:0.08; --float-duration:13s; --float-delay:-1s; --float-mask:var(--ball-svg);"
  ></div>
  <div
    class="float"
    style="width:120px; height:120px; top:72%; left:12%; --float-rotate:18deg; --float-opacity:0.05; --float-duration:18s; --float-delay:-8s;"
  ></div>
  <div
    class="float"
    style="width:110px; height:110px; top:84%; left:88%; --float-rotate:-8deg; --float-opacity:0.06; --float-duration:20s; --float-delay:-4s;"
  ></div>
</div>

<nav class="site">
  <div class="wrap">
    <img src="/notchgames/assets/icon.png" alt="" />
    <span>NotchGames</span>
  </div>
</nav>

<div class="wrap">
  <header class="hero">
    <div class="icon-orb">
      <img src="/notchgames/assets/icon.png" alt="NotchGames app icon" />
    </div>
    <h1 class="title">NotchGames</h1>
    <p class="tagline">Six neon arcade games hiding in your MacBook's notch.</p>
    <p class="arcade">move the pointer up · play a round · back to work</p>
    <div class="badge-row">
      <a class="btn primary" href={DMG} download>Download the beta for macOS</a>
      <a class="btn secondary" href="https://github.com/cilippofilia/NotchGames">View on GitHub</a>
    </div>
    <p class="platforms">Free public beta · macOS 26 or later · notarised by Apple</p>
  </header>

  <main use:landingReveal>
    <section>
      <figure class="demo">
        <img
          src="/notchgames/assets/demo.gif"
          alt="A neon pong court drops out of the notch and the player rallies against the computer"
          width="800"
          height="500"
        />
        <figcaption>Pull the drop down and a game panel grows out of the notch.</figcaption>
      </figure>
    </section>

    <section>
      <span class="eyebrow">Six games</span>
      <h2>A quick round, whenever you like</h2>
      <ul class="features">
        <li>
          <span class="glyph">🏓</span><strong>Pong</strong><span class="desc"
            >First to 5 against the computer. Steer with the pointer, or ↑/↓ and W/S.</span
          >
        </li>
        <li>
          <span class="glyph">🏒</span><strong>Air hockey</strong><span class="desc"
            >Against the computer, with the pointer or the arrows and W/A/S/D.</span
          >
        </li>
        <li>
          <span class="glyph">🧱</span><strong>Brick breaker</strong><span class="desc"
            >Endless, with power-ups and a best score to beat.</span
          >
        </li>
        <li>
          <span class="glyph">🐍</span><strong>Snake</strong><span class="desc"
            >Endless, on the arrows or W/A/S/D. Space pauses.</span
          >
        </li>
        <li>
          <span class="glyph">🛹</span><strong>Runner</strong><span class="desc"
            >An endless skater. Hold to jump higher, duck under the rest.</span
          >
        </li>
        <li>
          <span class="glyph">🎯</span><strong>Shooting gallery</strong><span class="desc"
            >Rounds with a hit quota and three shots for every pair of birds.</span
          >
        </li>
      </ul>
    </section>

    <section>
      <span class="eyebrow">How it works</span>
      <h2>Out of the notch and back again</h2>
      <figure class="demo">
        <img
          src="/notchgames/assets/screenshot.jpg"
          alt="A pong panel open under the MacBook notch, over the desktop"
          width="1600"
          height="1000"
          loading="lazy"
        />
      </figure>
      <ul class="features">
        <li>
          <span class="glyph">👇</span><strong>Open</strong><span class="desc"
            >Move towards the notch and a black drop stretches down to meet you. Grab it and pull. How far you pull sets
            the panel size.</span
          >
        </li>
        <li>
          <span class="glyph">👆</span><strong>Close</strong><span class="desc"
            >Drag the panel back up into the notch, or flick it upwards.</span
          >
        </li>
        <li>
          <span class="glyph">⏸️</span><strong>Always on top</strong><span class="desc"
            >While it's open, the panel floats above your other windows. Games pause when the pointer leaves the court
            or the panel closes, and pick up where you left off.</span
          >
        </li>
        <li>
          <span class="glyph">🖥️</span><strong>No notch?</strong><span class="desc"
            >On other Macs and external displays, choose Play from the menu bar icon and the panel drops from the top of
            the screen.</span
          >
        </li>
      </ul>
    </section>

    <section>
      <span class="eyebrow">Light by design</span>
      <h2>Nothing to set up</h2>
      <p class="note">
        NotchGames lives in the menu bar. There's no Dock icon and no window to switch to, and it never asks for
        Accessibility, Input Monitoring or Screen Recording permission. Settings let you pick the default game, the panel
        size and each game's difficulty, and keep your best scores. It's a beta, so expect rough edges, and please
        <a href="https://github.com/cilippofilia/NotchGames/issues">report anything odd</a>.
      </p>
    </section>
  </main>
</div>

<footer class="site">
  <div class="wrap">
    <div class="links">
      <a href="privacy-policy.html">Privacy Policy</a>
      <a href="/home">More apps</a>
      <a href="https://github.com/cilippofilia/NotchGames">GitHub</a>
      <a href="mailto:cilia.filippo.dev@gmail.com">Contact</a>
    </div>
    <div>© 2026 Filippo Cilia</div>
  </div>
</footer>
