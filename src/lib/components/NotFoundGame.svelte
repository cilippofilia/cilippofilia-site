<script>
  import { onMount } from "svelte";
  import { initNotFoundGame } from "#lib/games/notfound-game.js";

  let container;

  onMount(() => {
    const controller = new AbortController();
    initNotFoundGame(container, { signal: controller.signal });
    return () => controller.abort();
  });
</script>

<div class="notfound-game" bind:this={container}>
  <p class="notfound-game-score" hidden></p>
  <div class="notfound-game-field">
    <p class="notfound-game-hint">Tap the broken link to play.</p>
    <p class="notfound-game-best" hidden></p>
  </div>
  <div class="notfound-game-result" hidden>
    <p class="notfound-game-result-score"></p>
    <p class="notfound-game-result-text"></p>
    <p class="notfound-game-result-best" hidden></p>
    <button type="button" class="button secondary notfound-game-replay">Play again</button>
  </div>
</div>
