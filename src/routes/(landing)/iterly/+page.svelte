<script>
  import "#lib/styles/landing.css";
  import "#lib/styles/apps/iterly.css";
  import Seo from "#lib/components/Seo.svelte";
  import { landingReveal } from "#lib/actions/landing-reveal.js";
</script>

<Seo
  title="Iterly"
  description="Iterly is a lightweight project tracker for indie developers on iPhone: projects, tasks and subtasks grouped by release, an activity heatmap with streaks, and Home Screen widgets. Local-first, no account."
  url="https://cilippofilia.dev/iterly/"
  image="https://cilippofilia.dev/iterly/assets/icon.png"
/>

<svelte:head>
  <link rel="icon" href="/iterly/assets/favicon.png" />
  <link rel="apple-touch-icon" href="/iterly/assets/apple-touch-icon.png" />
</svelte:head>

<div class="aurora" aria-hidden="true">
  <div
    class="float"
    style="width:150px; height:150px; top:6%; left:4%; --float-rotate:-14deg; --float-opacity:0.05; --float-duration:19s; --float-delay:-2s;"
  ></div>
  <div
    class="float"
    style="width:90px; height:90px; top:16%; left:84%; --float-rotate:24deg; --float-opacity:0.07; --float-duration:15s; --float-delay:-6s; --float-mask:var(--tag-svg);"
  ></div>
  <div
    class="float"
    style="width:170px; height:170px; top:40%; left:-5%; --float-rotate:10deg; --float-opacity:0.045; --float-duration:22s; --float-delay:-10s; --float-mask:var(--tag-svg);"
  ></div>
  <div
    class="float"
    style="width:80px; height:80px; top:54%; left:72%; --float-rotate:-32deg; --float-opacity:0.08; --float-duration:13s; --float-delay:-1s;"
  ></div>
  <div
    class="float"
    style="width:120px; height:120px; top:72%; left:12%; --float-rotate:18deg; --float-opacity:0.05; --float-duration:18s; --float-delay:-8s;"
  ></div>
  <div
    class="float"
    style="width:110px; height:110px; top:84%; left:88%; --float-rotate:-8deg; --float-opacity:0.06; --float-duration:20s; --float-delay:-4s; --float-mask:var(--tag-svg);"
  ></div>
  <div
    class="float"
    style="width:64px; height:64px; top:4%; left:46%; --float-rotate:40deg; --float-opacity:0.06; --float-duration:14s; --float-delay:-9s;"
  ></div>
</div>

<nav class="site">
  <div class="wrap">
    <img src="/iterly/assets/icon.png" alt="" />
    <span>Iterly</span>
  </div>
</nav>

<div class="wrap">
  <header class="hero">
    <div class="icon-orb">
      <img src="/iterly/assets/icon.png" alt="Iterly app icon" />
    </div>
    <h1 class="title">Iterly</h1>
    <p class="tagline">
      A lightweight project tracker for indie developers. Plan by release, track by task, and watch your momentum build.
    </p>
    <div class="badge-row">
      <a class="btn primary" href="https://apps.apple.com/app/id6760037639">Download on the App Store</a>
      <a class="btn secondary" href="https://github.com/cilippofilia/Iterly">View on GitHub</a>
    </div>
    <p class="platforms">Free on iPhone. Local-first, no account, nothing to sign up for.</p>
  </header>

  <main use:landingReveal>
    <section>
      <span class="eyebrow">Three tabs</span>
      <h2>See it, plan it, ship it</h2>
      <ul class="features">
        <li>
          <span class="glyph">🏠</span><strong>Dashboard</strong><span class="desc"
            >Pin up to four projects and see what's due next. Upcoming tasks are ordered by due date and priority, so
            the next thing to do is always at the top.</span
          >
        </li>
        <li>
          <span class="glyph">📦</span><strong>Projects</strong><span class="desc"
            >Every project carries its status, priority, notes and the release you're working towards. Tasks and
            subtasks live underneath, grouped by what's shipping next.</span
          >
        </li>
        <li>
          <span class="glyph">🔥</span><strong>Activity</strong><span class="desc"
            >A GitHub-style heatmap of your progress over the last three, six or twelve months. Tap any day to see
            exactly what moved.</span
          >
        </li>
      </ul>
    </section>

    <section>
      <span class="eyebrow">Also in the box</span>
      <h2>The small things</h2>
      <ul class="features">
        <li>
          <span class="glyph">🏷️</span><strong>Release-centric</strong><span class="desc"
            >Give each project a current version and pull its live version number straight from the App Store by ID.</span
          >
        </li>
        <li>
          <span class="glyph">✅</span><strong>Tasks and subtasks</strong><span class="desc"
            >Status, priority, due date, notes and details on each one. Blocked, not started, in progress, done.</span
          >
        </li>
        <li>
          <span class="glyph">📎</span><strong>Attachments</strong><span class="desc"
            >Add screenshots and screen recordings to a task, so the bug you're fixing is right there next to it.</span
          >
        </li>
        <li>
          <span class="glyph">🔗</span><strong>Useful links</strong><span class="desc"
            >Keep GitHub, GitLab, Figma, TestFlight, website and custom links on each release, one tap away.</span
          >
        </li>
        <li>
          <span class="glyph">💡</span><strong>Brainstorm</strong><span class="desc"
            >A scratchpad on every project for ideas that aren't tasks yet.</span
          >
        </li>
        <li>
          <span class="glyph">📱</span><strong>Widgets</strong><span class="desc"
            >Small, medium and large Home Screen widgets with your heatmap and streak flame. Choose which projects the
            large one shows.</span
          >
        </li>
      </ul>
    </section>

    <section>
      <span class="eyebrow">Momentum</span>
      <h2>Keep the streak alive</h2>
      <p class="note">
        Log progress every day and the streak flame on your widget burns brighter. Skip a day and it cools, gradually,
        as a gentle nudge to get back to it. No notifications, no guilt trips. Just a flame that tells the truth.
      </p>
    </section>
  </main>
</div>

<footer class="site">
  <div class="wrap">
    <div class="links">
      <a href="privacy-policy.html">Privacy Policy</a>
      <a href="/home">More apps</a>
      <a href="https://github.com/cilippofilia/Iterly">GitHub</a>
      <a href="mailto:cilia.filippo.dev@gmail.com">Contact</a>
    </div>
    <div>© 2026 Filippo Cilia</div>
  </div>
</footer>
