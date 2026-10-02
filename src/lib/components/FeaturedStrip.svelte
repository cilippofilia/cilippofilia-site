<script>
  import { reveal } from "#lib/actions/reveal.js";
  import { formatReleaseDate } from "#lib/apps/feed.js";

  let { app } = $props();
</script>

<div class="featured reveal" id="featured-strip" use:reveal>
  {#if app.icon}<img class="featured-icon" src={app.icon} alt="" width="64" height="64" />{/if}
  <div class="featured-body">
    <span class="featured-eyebrow">Preorder</span>
    <h3>{app.name}</h3>
    <p>{app.tagline} Releases {formatReleaseDate(app.releaseDate)}.</p>
  </div>
  <a class="button secondary" href={app.localUrl || app.url}>Preorder <span class="chevron">›</span></a>
</div>
