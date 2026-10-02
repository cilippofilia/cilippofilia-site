<script>
  import { onMount } from "svelte";
  import { buildAppsBlock } from "#lib/apps/feed.js";
  import AppCard from "./AppCard.svelte";
  import FeaturedStrip from "./FeaturedStrip.svelte";

  // The home page's App Store block. The unreleased apps arrive with the
  // prerendered page (data/apps.json at build time); the published ones are
  // fetched live from Apple after load. Nothing renders until that fetch
  // settles: a heading over nothing is worse than no heading, and a failed
  // fetch just contributes no cards rather than showing an error.
  let { devApps } = $props();
  let block = $state(null);

  onMount(() => {
    fetch("/api/appstore-apps")
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then((published) => (block = buildAppsBlock(published, devApps)));
  });
</script>

<!-- Scroll target for the header's "App Store" link, just above the first
     app content on the page. -->
<div id="apps" aria-hidden="true"></div>

{#if block && (block.upcoming || block.cards.length)}
  <h2 class="apps-heading" id="apps-heading">What's on the App Store</h2>
  {#if block.upcoming}<FeaturedStrip app={block.upcoming} />{/if}
  {#if block.cards.length}
    <section id="apps-section">
      <div class="grid" id="apps-grid">
        {#each block.cards as card (card.name)}
          <AppCard {...card} />
        {/each}
      </div>
    </section>
  {/if}
{/if}
