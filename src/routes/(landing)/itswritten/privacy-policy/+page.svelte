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
  <p class="updated">Last updated: 22 October 2026</p>

  <p>
    itsWritten ("the app") is developed by Filippo Cilia. This page explains what happens to your data when you use the
    app. The short version: there is no account, no analytics, no tracking, and no server operated by us that receives
    your writing. Your journal entries and conversations are stored on your device. Text only leaves it in the cases
    described below, and never reaches us.
  </p>

  <h2>Data we collect</h2>
  <p>
    We do not collect, transmit, or have access to any personal data. The app contains no analytics, advertising network
    SDKs, or tracking software of any kind.
  </p>

  <h2>Your writing and reflections</h2>
  <p>
    Everything you write, and every reflection the app produces, is stored in a local database on your device. It is not
    synced to iCloud. Deleting a thread removes it from the app, and deleting the app deletes everything. Reflections
    are generated in one of three ways.
  </p>

  <h3>On your device (the default)</h3>
  <p>
    By default, reflections are generated on your device by Apple Intelligence, using Apple's Foundation Models
    framework. Your text stays on your device.
  </p>

  <h3>Apple Private Cloud Compute</h3>
  <p>
    When the on-device model can't handle a request, the app can use Apple's Private Cloud Compute instead. It asks you
    before sending anything there. Apple designed Private Cloud Compute so that your data is used only to answer your
    request and is not stored or made accessible to Apple; see Apple's
    <a href="https://security.apple.com/documentation/private-cloud-compute" target="_blank" rel="noopener"
      >Private Cloud Compute security overview</a
    >.
  </p>

  <h3>Third-party AI with your own key (optional)</h3>
  <p>
    Since version 1.4, you can add your own API key for OpenAI (ChatGPT), Anthropic (Claude) or Google (Gemini). None of
    what follows happens unless you add a key.
  </p>
  <ul>
    <li>
      Your text goes straight from your device to that company, under your own account. It never passes through us, and
      that company's privacy policy and data retention rules apply:
      <a href="https://openai.com/policies/privacy-policy/" target="_blank" rel="noopener">OpenAI</a>,
      <a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noopener">Anthropic</a>, and Google (<a
        href="https://policies.google.com/privacy"
        target="_blank"
        rel="noopener">privacy policy</a
      >,
      <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener">Gemini API terms</a>).
    </li>
    <li>
      The app asks you before a conversation is first sent to a provider. You can turn on "Always Allow" if you don't
      want to be asked again, and "Keep on Device" is always available.
    </li>
    <li>
      Before anything is sent, the app replaces personal details with placeholders, on your device: names, places,
      organisations, addresses, phone numbers, email addresses, links, @handles, card numbers, IBANs, government and
      medical ID numbers, specific dates, GPS coordinates, IP addresses, passwords and keys. You see exactly what will
      be sent before it goes.
    </li>
    <li>
      This detection is best-effort and not guaranteed to catch everything, so check the preview before sending. When
      names can't be checked automatically, the app asks you about them.
    </li>
  </ul>

  <h2>Data stored on your device</h2>
  <ul>
    <li>Your journal entries, saved chat threads and messages.</li>
    <li>
      Your preferences, such as response style, timer length and the instructions, temperature and sampling settings
      behind each reflection.
    </li>
    <li>
      Any API keys you add, stored in the iOS Keychain. Each key is only ever sent to its own provider, never to us.
    </li>
    <li>Your provider and consent choices, such as "Always Allow".</li>
    <li>Whether onboarding has been completed.</li>
  </ul>

  <h2>Research lookups</h2>
  <p>
    When a health or biomedical question comes up, the app can search public research and drug databases, so that
    answers can cite sources:
  </p>
  <ul>
    <li>
      PubMed and ClinicalTrials.gov, both run by the U.S. National Library of Medicine (NIH), covered by the
      <a href="https://www.nlm.nih.gov/privacy.html" target="_blank" rel="noopener"
        >National Library of Medicine's privacy policy</a
      >.
    </li>
    <li>
      openFDA, run by the U.S. Food and Drug Administration, covered by the
      <a href="https://www.fda.gov/about-fda/about-website/website-policies" target="_blank" rel="noopener"
        >FDA's website and privacy policies</a
      >.
    </li>
  </ul>
  <p>
    Each lookup sends only a short search query, directly to that service. We never see it. The medical calculator runs
    entirely on your device.
  </p>

  <h2>Privacy protections</h2>
  <p>
    Sensitive text is masked in screenshots and screen recordings, and the app covers its content when it moves to the
    background so it is not visible in the app switcher.
  </p>

  <h2>Banner for our other apps</h2>
  <p>
    The app shows a small banner promoting other apps by the same developer. To pick which one to show, it downloads a
    short list of apps from GitHub (raw.githubusercontent.com). The request contains no personal data and no identifier
    from the app, but like any web request it lets GitHub see your IP address; see
    <a
      href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
      target="_blank"
      rel="noopener">GitHub's privacy statement</a
    >. We don't record anything about you. There are no third-party ad networks. You can remove the banner with a
    one-time in-app purchase, which is processed entirely by Apple through the App Store. We do not receive your payment
    details.
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
