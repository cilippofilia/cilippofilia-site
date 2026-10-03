<script>
  // The root error page renders inside only the root layout, so it brings
  // the site chrome and stylesheets itself. The stylesheets are linked as
  // URLs rather than imported: SvelteKit loads the root error component on
  // every page as its fallback, and an imported stylesheet would be injected
  // wherever that happens, landing pages included.
  import tokensCss from "#lib/styles/tokens.css?url";
  import baseCss from "#lib/styles/base.css?url";
  import layoutCss from "#lib/styles/layout.css?url";
  import componentsCss from "#lib/styles/components.css?url";
  import notfoundGameCss from "#lib/styles/notfound-game.css?url";
  import { page } from "$app/state";
  import Seo from "#lib/components/Seo.svelte";
  import Header from "#lib/components/Header.svelte";
  import Footer from "#lib/components/Footer.svelte";
  import NotFoundGame from "#lib/components/NotFoundGame.svelte";
</script>

<svelte:head>
  {#each [tokensCss, baseCss, layoutCss, componentsCss, notfoundGameCss] as href}
    <link rel="stylesheet" {href} />
  {/each}
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />
</svelte:head>

<Header />
{#if page.status === 404}
  <Seo
    title="Not found · cilippofilia.dev"
    description="This page doesn't exist on cilippofilia.dev. Whack a few broken links, then head back to Filippo Cilia's apps."
    noindex
  />
  <main>
    <div class="wrap">
      <section class="hero" style="margin-top:0">
        <p class="notfound-code" aria-hidden="true">404</p>
        <h1><span class="visually-hidden">404: </span>Page not found.</h1>
        <p class="lede">Nothing here — that address doesn't match a page or an app on this site.</p>
        <div class="button-row">
          <a class="button" href="/home">Back home</a>
          <a class="button secondary" href="/home#apps">See the apps</a>
        </div>
      </section>

      <NotFoundGame />
    </div>
  </main>
{:else}
  <Seo
    title="Something went wrong · cilippofilia.dev"
    description="Something went wrong on cilippofilia.dev."
    noindex
  />
  <main>
    <div class="wrap">
      <section class="hero" style="margin-top:0">
        <h1>Something went wrong.</h1>
        <p class="lede">That one's on me. Try again in a moment.</p>
        <div class="button-row"><a class="button" href="/home">Back home</a></div>
      </section>
    </div>
  </main>
{/if}
<Footer />
