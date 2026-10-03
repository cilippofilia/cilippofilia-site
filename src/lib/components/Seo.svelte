<script>
  // The head tags every page carries (see .claude/rules/html-pages.md):
  // title, description, canonical and the Open Graph set. Pages without a
  // fixed public URL (the 404) pass no url and get no canonical or og:url.
  let {
    title,
    description,
    url = null,
    image = "https://cilippofilia.dev/assets/profile.jpg",
    noindex = false,
  } = $props();
</script>

<svelte:head>
  <title>{title}</title>
  {#if noindex}<meta name="robots" content="noindex" />{/if}
  <meta name="description" content={description} />
  {#if url}<link rel="canonical" href={url} />{/if}
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="cilippofilia.dev" />
  {#if url}<meta property="og:url" content={url} />{/if}
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={image} />
</svelte:head>
