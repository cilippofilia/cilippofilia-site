<script>
  import "#lib/styles/landing.css";
  import "#lib/styles/apps/itswritten.css";
  import Seo from "#lib/components/Seo.svelte";
</script>

<Seo
  title="Privacy Policy · itsWritten"
  description="Privacy Policy for the itsWritten journaling app."
  url="https://cilippofilia.dev/itswritten/privacy-policy.html"
  image="https://cilippofilia.dev/itswritten/assets/icon.png"
/>

<svelte:head>
  <link rel="icon" href="/itswritten/assets/favicon.png" />
  <link rel="apple-touch-icon" href="/itswritten/assets/apple-touch-icon.png" />
</svelte:head>

<div class="aurora" aria-hidden="true">
  <div
    class="float"
    style="width:130px; height:130px; top:6%; left:6%; --float-rotate:-12deg; --float-opacity:0.05; --float-duration:19s; --float-delay:-2s;"
  ></div>
  <div
    class="float"
    style="width:90px; height:90px; top:22%; left:84%; --float-rotate:26deg; --float-opacity:0.06; --float-duration:16s; --float-delay:-6s; --float-mask:var(--cursor-svg);"
  ></div>
  <div
    class="float"
    style="width:150px; height:150px; top:60%; left:-5%; --float-rotate:12deg; --float-opacity:0.045; --float-duration:21s; --float-delay:-9s; --float-mask:var(--cursor-svg);"
  ></div>
  <div
    class="float"
    style="width:80px; height:80px; top:80%; left:78%; --float-rotate:-30deg; --float-opacity:0.06; --float-duration:14s; --float-delay:-3s;"
  ></div>
</div>

<nav class="site">
  <div class="wrap">
    <img src="/itswritten/assets/icon.png" alt="" />
    <span>itsWritten</span>
  </div>
</nav>

<div class="wrap legal">
  <a class="back-link" href="./">← Back home</a>

  <h1>Privacy Policy</h1>
  <p class="updated">Last updated: September 6, 2026</p>

  <p>
    itsWritten ("the app") is developed by Filippo Cilia. This page explains what happens to your data when you use the
    app. The short version: there is no account, no analytics, no tracking, and no server operated by us that receives
    your writing. Your journal entries and conversations stay on your device.
  </p>

  <h2>Data we collect</h2>
  <p>
    We do not collect, transmit, or have access to any personal data. The app contains no analytics, advertising network
    SDKs, or tracking software of any kind.
  </p>

  <h2>Your writing and reflections</h2>
  <p>
    Everything you write, and every reflection the app produces, is stored in the app's own container on your device.
    Reflections are generated on your device by Apple Intelligence using Apple's Foundation Models framework. Your text
    is not sent to us or to any third-party AI service. Deleting a thread removes it from the app, and deleting the app
    deletes everything.
  </p>

  <h2>Data stored on your device</h2>
  <ul>
    <li>Your journal entries, saved chat threads and messages.</li>
    <li>
      Your preferences, such as response style, timer length and the instructions, temperature and sampling settings
      behind each reflection.
    </li>
    <li>Whether onboarding has been completed.</li>
  </ul>

  <h2>Research lookups (PubMed)</h2>
  <p>
    When a health or biomedical question comes up, the app can search PubMed, a public database run by the U.S. National
    Library of Medicine, so that answers can cite sources. This is the only time the app sends part of a conversation
    off your device: a short search query, and only for that lookup. The request goes directly to PubMed and is subject
    to the
    <a href="https://www.nlm.nih.gov/privacy.html">National Library of Medicine's privacy policy</a>. We never see it.
  </p>

  <h2>Privacy protections</h2>
  <p>
    Sensitive text is masked in screenshots and screen recordings, and the app covers its content when it moves to the
    background so it is not visible in the app switcher.
  </p>

  <h2>Banner for our other apps</h2>
  <p>
    The app shows a small banner promoting other apps by the same developer. To pick which one to show, it downloads a
    short list of apps from our own website. That request contains no personal data and no identifier, and nothing about
    you is recorded. There are no third-party ad networks. You can remove the banner with a one-time in-app purchase,
    which is processed entirely by Apple through the App Store. We do not receive your payment details.
  </p>

  <h2>Contact and feedback</h2>
  <p>
    If you use the "Contact" options in Settings to report a bug or request a feature, the app opens an email draft in
    your mail app. Nothing is sent until you choose to send it, and anything you include is used only to reply to you.
    If you ask to rate the app, Apple's standard review prompt appears and is handled entirely by Apple.
  </p>

  <h2>Not medical advice</h2>
  <p>
    itsWritten is not a doctor, therapist, or emergency service, and it is not a replacement for qualified medical or
    mental health care. If you or someone you know is in distress or needs urgent help, contact local emergency
    services.
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
