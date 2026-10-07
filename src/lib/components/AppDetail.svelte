<script>
  import { isImageIcon } from "#lib/apps/names.js";
  import { badgeClass } from "#lib/apps/app-status.js";
  import { campaignUrl } from "#lib/apps/campaign.js";

  let { app } = $props();
</script>

<section class="hero app-detail" style="margin-top:0">
  <div class="app-detail-head">
    {#if isImageIcon(app.icon)}
      <img class="icon-lg icon-img" src={app.icon} alt="" width="88" height="88" />
    {:else}
      <span class="icon-lg">{app.icon || "📱"}</span>
    {/if}
    <div class="app-detail-meta">
      <span class="badge {badgeClass(app.status)}">{app.status}</span>
      <h1>{app.name}</h1>
      <p class="lede">{app.tagline}</p>
    </div>
  </div>
  <div class="app-detail-body">
    <p class="app-detail-description">{app.description}</p>
    <div class="app-detail-side">
      <div>
        <h4>Platforms</h4>
        <div class="platforms">
          {#each app.platforms || [] as platform}<span class="chip">{platform}</span>{/each}
        </div>
      </div>
      <div>
        {#if app.appStoreUrl}
          <a class="button" href={campaignUrl(app.appStoreUrl, `site-${app.slug}`)}>View on the App Store</a>
        {:else}
          <button type="button" class="button secondary" disabled>Not yet published</button>
        {/if}
      </div>
      <div>
        <a class="back-link" href="/home#apps"><span class="chevron">‹</span> Go back</a>
      </div>
    </div>
  </div>
</section>
