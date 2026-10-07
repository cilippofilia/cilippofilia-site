<script>
  import { reveal } from "#lib/actions/reveal.js";
  import { formatReleaseDate, HOME_CAMPAIGN } from "#lib/apps/feed.js";
  import { campaignUrl } from "#lib/apps/campaign.js";

  let { app } = $props();
</script>

<div class="featured reveal" id="featured-strip" use:reveal>
  {#if app.icon}<img class="featured-icon" src={app.icon} alt="" width="64" height="64" />{/if}
  <div class="featured-body">
    <span class="featured-eyebrow">Preorder</span>
    <h3>{app.name}</h3>
    <p>{app.tagline} Releases {formatReleaseDate(app.releaseDate)}.</p>
  </div>
  <a class="button secondary" href={app.localUrl || campaignUrl(app.url, HOME_CAMPAIGN)}>Preorder <span class="chevron">›</span></a>
</div>
