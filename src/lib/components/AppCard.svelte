<script>
  import { reveal } from "#lib/actions/reveal.js";
  import { splitName, isImageIcon } from "#lib/apps/names.js";

  // Every card carries the same two actions. "Website" is the app's own
  // landing page on this site and "App Store" is Apple's listing; an app
  // that isn't published yet keeps the App Store button but disabled, so the
  // row reads the same across the grid. The card itself is not a link
  // (links can't nest inside links), so the buttons are the only way off it.
  let { websiteUrl, appStoreUrl, icon, name, badge, badgeStyle, tagline } = $props();
  let { title, subtitle } = $derived(splitName(name));
</script>

<article class="card reveal" use:reveal>
  <div class="card-head">
    {#if isImageIcon(icon)}
      <img class="icon-img" src={icon} alt="" width="48" height="48" />
    {:else}
      <span class="icon">{icon || "📱"}</span>
    {/if}
    <div class="card-title">
      <h3>{title}</h3>
      {#if subtitle}<p class="card-subtitle">{subtitle}</p>{/if}
    </div>
  </div>
  <span class="badge {badgeStyle}">{badge}</span>
  <p>{tagline}</p>
  <div class="card-actions">
    {#if websiteUrl}<a class="button secondary" href={websiteUrl}>Website</a>{/if}
    {#if appStoreUrl}
      <a class="button" href={appStoreUrl} target="_blank" rel="noopener">App Store</a>
    {:else}
      <button type="button" class="button" disabled>App Store</button>
    {/if}
  </div>
</article>
