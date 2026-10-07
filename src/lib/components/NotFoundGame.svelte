<script>
  import { onMount } from "svelte";
  import { initNotFoundGame } from "#lib/games/notfound-game.js";

  // Static markup the game module drives directly: no reactive bindings in
  // here, so Svelte never touches the nodes it mutates.
  let container;

  onMount(() => {
    const controller = new AbortController();
    initNotFoundGame(container, { signal: controller.signal });
    return () => controller.abort();
  });
</script>

<div class="notfound-game" bind:this={container}>
  <div class="notfound-game-stats">
    <p class="notfound-game-score">0 caught</p>
    <p class="notfound-game-misses">0/4 missed</p>
    <p class="notfound-game-best" hidden></p>
  </div>
  <div class="notfound-game-screen">
    <div class="notfound-game-field"></div>
    <div class="notfound-game-start">
      <p class="notfound-game-start-title">Ready to whack?</p>
      <p class="notfound-game-start-hint">
        Broken links flash up on the screen. Tap or click each one before it fades. Four misses and you're out.
      </p>
      <button type="button" class="button notfound-game-play">Play</button>
    </div>
    <div class="notfound-game-result" hidden>
      <p class="notfound-game-result-score"></p>
      <p class="notfound-game-result-text"></p>
      <p class="notfound-game-result-best" hidden></p>
      <button type="button" class="button secondary notfound-game-replay">Play again</button>
    </div>
  </div>
</div>
