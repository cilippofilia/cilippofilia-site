<script>
  // Load order matters: tokens → base → layout → components, then each
  // page imports its own stylesheet. Landing pages (the (landing) group)
  // never load these.
  import "#lib/styles/tokens.css";
  import "#lib/styles/base.css";
  import "#lib/styles/layout.css";
  import "#lib/styles/components.css";
  import Header from "#lib/components/Header.svelte";
  import Footer from "#lib/components/Footer.svelte";

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />
</svelte:head>

<Header />
{@render children()}
<Footer />
