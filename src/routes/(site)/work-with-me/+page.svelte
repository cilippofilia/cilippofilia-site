<script>
  import "#lib/styles/work.css";
  import Seo from "#lib/components/Seo.svelte";

  // A mailto rather than a form: the site has no forms or accounts (the
  // privacy policy says so), and an email keeps the enquiry in my inbox
  // without a new endpoint. The body is a prompt for the three things I'd
  // ask first anyway.
  const EMAIL = "cilia.filippo.dev@gmail.com";
  const SUBJECT = "Project enquiry";
  const BODY = "Hi Filippo,\n\nWhat I'd like to build:\n\nTimeline:\n\nBudget:\n";

  // URLSearchParams encodes spaces as "+", which mail apps show literally.
  const query = (params) => new URLSearchParams(params).toString().replaceAll("+", "%20");

  const mailto = `mailto:${EMAIL}?${query({ subject: SUBJECT, body: BODY })}`;

  // A mailto does nothing on a device with no mail app set up, which is
  // common for people who only use Gmail in a browser, so Gmail's own
  // compose page sits next to it with the same subject and body.
  const gmail = `https://mail.google.com/mail/?${query({ view: "cm", fs: "1", to: EMAIL, su: SUBJECT, body: BODY })}`;

  const services = [
    {
      title: "iPhone and iPad apps",
      body: "A first version taken all the way to the App Store, written in SwiftUI with the frameworks Apple ships.",
    },
    {
      title: "Mac apps",
      body: "Desktop tools for the work you already do, like the reporting app I built for a Brighton music company.",
    },
    {
      title: "Your existing app",
      body: "New features, a move from UIKit to SwiftUI, or an update so it looks at home on the latest iOS.",
    },
  ];

  // The four shipped apps, linking to their landing pages. Their icons are
  // the same files the landing pages use.
  const shipped = [
    { slug: "drinko", name: "Drinko" },
    { slug: "itswritten", name: "itsWritten" },
    { slug: "iterly", name: "Iterly" },
    { slug: "nine-tiles-puzzle", name: "9 Tiles Puzzle" },
  ];

  const principles = [
    {
      title: "Built with Apple's frameworks",
      body: "Fewer third-party dependencies means an app that's easier to maintain and keeps up with each new iOS release.",
    },
    {
      title: "Private by default",
      body: "Your users' data stays on their device unless there's a good reason for it not to.",
    },
    {
      title: "One person, start to finish",
      body: "You talk directly to the developer writing the code, with regular builds you can try on your own iPhone, Mac or iPad.",
    },
  ];

  // A real sequence, so it's an ordered list and the numbers carry meaning.
  const steps = [
    {
      title: "Tell me about it",
      body: "Send an email with what you'd like to build, when you need it and roughly what your budget is.",
    },
    {
      title: "Plan and quote",
      body: "We talk it through, then I send back a plan with what's in scope, a timeline and a price.",
    },
    {
      title: "Build",
      body: "I build it in stages and send TestFlight builds as I go, so you're trying the real thing early.",
    },
    {
      title: "Launch",
      body: "I prepare the release and take it through App Review and onto the App Store.",
    },
  ];
</script>

<Seo
  title="Work with me · cilippofilia.dev"
  description="Freelance iOS and macOS development: native apps in Swift and SwiftUI, built by the person you talk to."
  url="https://cilippofilia.dev/work-with-me"
/>

<main>
  <div class="wrap">
    <div class="hero work-hero">
      <p class="work-status"><span class="work-status-dot" aria-hidden="true"></span>Taking on new projects</p>
      <h1>Native apps for iPhone, iPad and Mac.</h1>
      <p class="lede">
        Alongside my day job as an iOS engineer, I take on a small number of freelance projects. If you need an app
        for iPhone, iPad, Mac or any other Apple device, I'd like to hear about it.
      </p>
      <div class="work-actions">
        <a class="button" href="#contact">Get in touch</a>
        <a class="button secondary" href="/home#apps">See my apps</a>
      </div>
    </div>

    <section aria-labelledby="work-build">
      <h2 id="work-build">What I build</h2>
      <ul class="work-services">
        {#each services as service (service.title)}
          <li class="work-panel">
            <h3>{service.title}</h3>
            <p>{service.body}</p>
          </li>
        {/each}
      </ul>
    </section>

    <section aria-labelledby="work-recent">
      <h2 id="work-recent">Recent work</h2>
      <div class="work-recent">
        <article class="work-panel work-case">
          <p class="work-tag">Client project</p>
          <h3>A royalties app for a Brighton music company</h3>
          <p>
            A Mac app that helps them process their music royalty and revenue reports, built alongside my day job.
          </p>
        </article>
        <article class="work-panel work-shipped">
          <p class="work-tag">My own apps</p>
          <h3>Four apps on the App Store</h3>
          <ul class="work-icons">
            {#each shipped as app (app.slug)}
              <li>
                <a href="/{app.slug}/">
                  <img src="/{app.slug}/assets/icon.png" alt="" width="56" height="56" loading="lazy" />
                  <span>{app.name}</span>
                </a>
              </li>
            {/each}
          </ul>
        </article>
      </div>
    </section>

    <section aria-labelledby="work-how">
      <h2 id="work-how">How I work</h2>
      <ul class="work-principles">
        {#each principles as principle (principle.title)}
          <li>
            <h3>{principle.title}</h3>
            <p>{principle.body}</p>
          </li>
        {/each}
      </ul>

      <ol class="work-steps">
        {#each steps as step, i (step.title)}
          <li>
            <span class="work-step-number" aria-hidden="true">{i + 1}</span>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </li>
        {/each}
      </ol>
    </section>

    <section class="work-cta" id="contact" aria-labelledby="work-contact">
      <img class="work-cta-photo" src="/assets/profile.jpg" alt="" width="96" height="96" loading="lazy" />
      <div class="work-cta-body">
        <h2 id="work-contact">Got an app in mind?</h2>
        <p>Tell me what you'd like to build, when you need it and roughly what your budget is.</p>
        <div class="work-actions">
          <a class="button" href={mailto}>Email me</a>
          <a class="button secondary" href={gmail} target="_blank" rel="noopener">Open in Gmail</a>
        </div>
      </div>
    </section>
  </div>
</main>
