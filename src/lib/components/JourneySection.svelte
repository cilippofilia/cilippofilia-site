<script>
  import { onMount, tick } from "svelte";
  import { reveal } from "#lib/actions/reveal.js";
  import { carousel } from "#lib/actions/carousel.js";
  import { cardRail } from "#lib/actions/card-rail.js";
  import { placeGroups, pillRuns, groupOfStop, captionText } from "#lib/journey/journey.js";
  import { initJourneyMap } from "#lib/journey/journey-map.js";

  // "How I got here" on the home page: a pixel map of Europe with the dated
  // stops beside it, and the selected place's stops as cards below. The pills
  // and the first place's cards are prerendered; the map (journey-map.js)
  // draws itself into static markup once the page loads.
  const groups = placeGroups();
  const runs = pillRuns();

  let selected = $state(groupOfStop(groups, 0));
  let focused = $state([]); // the stops a date pill picked out
  let group = $derived(groups[selected]);
  let count = $derived(new Set(group.entries.map((e) => e.index)).size);

  let mapEl;
  let cardsEl;
  let map = null;

  async function pickRun(run) {
    selected = groupOfStop(groups, run.stops[0]);
    focused = run.stops;
    map?.select(selected);
    // Bring the first picked card into view: below the map on a phone, and
    // along the card row when it scrolls.
    await tick();
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    cardsEl
      ?.querySelector(`[data-stop="${run.stops[0]}"]`)
      ?.scrollIntoView({ block: "nearest", inline: "start", behavior: reduceMotion ? "auto" : "smooth" });
  }

  onMount(() => {
    const controller = new AbortController();
    map = initJourneyMap(mapEl, {
      signal: controller.signal,
      groups,
      selected,
      onSelect: (i) => {
        selected = i;
        focused = [];
      },
    });
    return () => controller.abort();
  });
</script>

{#snippet media(photo)}
  {#if photo.icon}
    <div class="journey-icon-tile">
      <img
        class="journey-icon-glow"
        src={photo.icon}
        alt=""
        aria-hidden="true"
        width={photo.width}
        height={photo.height}
      />
      <img class="journey-icon" src={photo.icon} alt={photo.alt} width={photo.width} height={photo.height} />
    </div>
  {:else if photo.still}
    <!-- An animated photo shows its still first frame when motion is turned down. -->
    <picture>
      <source media="(prefers-reduced-motion: reduce)" srcset={photo.still} />
      <img
        class="journey-img"
        class:natural={photo.natural}
        src={photo.src}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        loading="lazy"
        draggable="false"
      />
    </picture>
  {:else}
    <img
      class="journey-img"
      class:natural={photo.natural}
      src={photo.src}
      alt={photo.alt}
      width={photo.width}
      height={photo.height}
      loading="lazy"
      draggable="false"
    />
  {/if}
{/snippet}

{#snippet caption(photo, hidden)}
  {@const text = captionText(photo)}
  {#if text || photo.credit}
    <figcaption class="journey-caption" {hidden}>
      {text}{#if text && photo.credit}{" · "}{/if}{#if photo.credit}Photo
        {#if photo.credit.url}<a href={photo.credit.url} target="_blank" rel="noopener">{photo.credit.name}</a
          >{:else}{photo.credit.name}{/if}{/if}
    </figcaption>
  {:else}
    <figcaption class="journey-caption" hidden></figcaption>
  {/if}
{/snippet}

<section class="journey-section reveal" use:reveal aria-labelledby="journey-heading">
  <h2 id="journey-heading">How I got here</h2>
  <p class="journey-lede">
    From skateparks around Lake Como to an iOS team in Manchester. Tap a place on the map or a date to see what happened
    there.
  </p>

  <div class="journey">
    <div class="journey-top">
      <div class="journey-map" bind:this={mapEl}>
        <canvas class="journey-canvas" width="800" height="600" aria-hidden="true"></canvas>
        <div class="journey-tools">
          <button type="button" class="journey-tool" data-zoom="out" aria-label="Zoom out">−</button>
          <button type="button" class="journey-tool" data-zoom="in" aria-label="Zoom in">+</button>
          <button type="button" class="journey-tool" data-view="whole">Whole map</button>
        </div>
      </div>
      <div class="journey-pills-col">
        <ol class="journey-pills" aria-label="Stops by date">
          {#each runs as run (run.stops[0])}
            {@const here = run.stops.some((i) => group.entries.some((e) => e.index === i))}
            {@const picked = focused[0] === run.stops[0]}
            <li>
              <button
                type="button"
                class:here
                class:picked
                aria-current={picked ? "true" : undefined}
                onclick={() => pickRun(run)}
              >
                <span class="journey-pill-year">{run.year}</span>
                <span class="journey-pill-place">{run.place}</span>
              </button>
            </li>
          {/each}
        </ol>
      </div>
    </div>

    <div class="journey-detail">
      <div class="journey-place" aria-live="polite">
        <h3>{group.label}</h3>
        <span>{count} {count === 1 ? "stop" : "stops"}</span>
      </div>
      {#key selected}
        <!-- As many cards as fit sit side by side; more than that scroll
             sideways, with dots and buttons the action shows only then. -->
        <div class="journey-rail" use:cardRail>
          <div class="journey-cards" style="--count: {group.entries.length}" bind:this={cardsEl}>
            {#each group.entries as entry (entry.index)}
              <article class="journey-card" class:picked={focused.includes(entry.index)} data-stop={entry.index}>
                <p class="journey-card-meta">
                  <span class="journey-card-year">{entry.stop.year}</span> · <span>{entry.place}</span>
                </p>
                <h4>{entry.stop.title}</h4>
                {#if entry.away}
                  <p class="journey-card-body">One of the trips from {entry.stop.place}.</p>
                {:else}
                  <p class="journey-card-body">{entry.stop.body}</p>
                {/if}
                {#if entry.photos.length === 1}
                  <figure class="journey-photo">
                    {@render media(entry.photos[0])}
                    {@render caption(entry.photos[0], false)}
                  </figure>
                {:else if entry.photos.length > 1}
                  <figure class="journey-photo journey-carousel" use:carousel>
                    <div class="journey-viewport">
                      <div
                        class="journey-track"
                        tabindex="0"
                        role="group"
                        aria-roledescription="carousel"
                        aria-label="{entry.photos.length} photos. Use the arrow keys to move between them."
                      >
                        {#each entry.photos as photo, i (i)}
                          <div class="journey-slide">{@render media(photo)}</div>
                        {/each}
                      </div>
                      <span class="journey-hint prev" aria-hidden="true">‹</span>
                      <span class="journey-hint next" aria-hidden="true">›</span>
                      <div class="journey-dots">
                        {#each entry.photos as _, i (i)}
                          <button
                            type="button"
                            class={i === 0 ? "on" : ""}
                            aria-label="Photo {i + 1} of {entry.photos.length}"
                          ></button>
                        {/each}
                      </div>
                    </div>
                    {#each entry.photos as photo, i (i)}
                      {@render caption(photo, i !== 0)}
                    {/each}
                  </figure>
                {/if}
              </article>
            {/each}
          </div>
          <div class="journey-rail-bar" hidden>
            <button type="button" class="journey-rail-step" data-dir="-1" aria-label="Previous stop">‹</button>
            <div class="journey-rail-dots">
              {#each group.entries as entry, i (entry.index)}
                <button type="button" class={i === 0 ? "on" : ""} aria-label="Stop {i + 1} of {group.entries.length}"
                ></button>
              {/each}
            </div>
            <button type="button" class="journey-rail-step" data-dir="1" aria-label="Next stop">›</button>
          </div>
        </div>
      {/key}
    </div>
  </div>
</section>
