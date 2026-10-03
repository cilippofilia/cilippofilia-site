<script>
  import Seo from "#lib/components/Seo.svelte";
  import AppDetail from "#lib/components/AppDetail.svelte";
  import { appPageMeta } from "#lib/apps/meta.js";

  let { data } = $props();
  const meta = $derived(appPageMeta(data.app));
</script>

<Seo title={meta.title} description={meta.description} url={meta.url} image={meta.image} />

<main>
  <div class="wrap" id="content">
    <AppDetail app={data.app} />
  </div>
</main>
