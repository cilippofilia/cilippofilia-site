<script>
  import "#lib/styles/landing.css";
  import "#lib/styles/apps/notchgames.css";
  import Seo from "#lib/components/Seo.svelte";
</script>

<Seo
  title="Privacy Policy · NotchGames"
  description="Privacy Policy for NotchGames, the arcade games in your Mac's notch."
  url="https://cilippofilia.dev/notchgames/privacy-policy.html"
  image="https://cilippofilia.dev/notchgames/assets/icon.png"
/>

<svelte:head>
  <link rel="icon" href="/notchgames/assets/favicon.png" />
  <link rel="apple-touch-icon" href="/notchgames/assets/apple-touch-icon.png" />
</svelte:head>

<div class="aurora" aria-hidden="true">
  <div
    class="float"
    style="width:130px; height:130px; top:6%; left:6%; --float-rotate:-12deg; --float-opacity:0.05; --float-duration:19s; --float-delay:-2s;"
  ></div>
  <div
    class="float"
    style="width:56px; height:56px; top:22%; left:84%; --float-opacity:0.07; --float-duration:16s; --float-delay:-6s; --float-mask:var(--ball-svg);"
  ></div>
  <div
    class="float"
    style="width:150px; height:150px; top:60%; left:-5%; --float-rotate:12deg; --float-opacity:0.045; --float-duration:21s; --float-delay:-9s;"
  ></div>
  <div
    class="float"
    style="width:44px; height:44px; top:80%; left:78%; --float-opacity:0.06; --float-duration:14s; --float-delay:-3s; --float-mask:var(--ball-svg);"
  ></div>
</div>

<nav class="site">
  <div class="wrap">
    <img src="/notchgames/assets/icon.png" alt="" />
    <span>NotchGames</span>
  </div>
</nav>

<div class="wrap legal">
  <a class="back-link" href="./">← Back home</a>

  <h1>Privacy Policy</h1>
  <p class="updated">Last updated: 14 November 2026</p>

  <p>
    NotchGames ("the app") is developed by Filippo Cilia. This page explains what happens to your data when you use the
    app. The short version: the app never connects to the internet, and nothing you do in it leaves your Mac.
  </p>

  <h2>Data we collect</h2>
  <p>
    We do not collect, transmit, or have access to any personal data. The app contains no analytics, advertising or
    tracking software of any kind, and it makes no network requests.
  </p>

  <h2>Data stored on your Mac</h2>
  <p>The app keeps a few things in its own preferences on your Mac:</p>
  <ul>
    <li>Your settings: the default game, panel size, pause gutter and each game's difficulty.</li>
    <li>Your records and best scores.</li>
  </ul>
  <p>Deleting the app and its preferences removes them.</p>

  <h2>Permissions</h2>
  <p>
    The app does not ask for Accessibility, Input Monitoring or Screen Recording permission. It only reads the pointer
    and keyboard while its own game panel is open. If you turn on launch at login, macOS registers the app as a login
    item, which you can remove at any time in System Settings.
  </p>

  <h2>Downloading the app</h2>
  <p>
    The app is downloaded from this website. Like any website, its host, Netlify, may keep standard server logs, such as
    IP addresses, for security and reliability. We do not use them to track you.
  </p>

  <h2>Children</h2>
  <p>
    We do not knowingly collect any information from children, and, as described above, we do not collect information
    from anyone.
  </p>

  <h2>Changes to this policy</h2>
  <p>
    If the app ever starts handling data differently, this page will be updated and the date at the top will change.
    Continued use of the app after a change means you accept the updated policy.
  </p>

  <h2>Contact</h2>
  <p>Questions about this policy: <a href="mailto:cilia.filippo.dev@gmail.com">cilia.filippo.dev@gmail.com</a>.</p>
</div>

<footer class="site">
  <div class="wrap">
    <div class="links">
      <a href="./">Home</a>
      <a href="/home">More apps</a>
      <a href="mailto:cilia.filippo.dev@gmail.com">Contact</a>
    </div>
    <div>© 2026 Filippo Cilia</div>
  </div>
</footer>
