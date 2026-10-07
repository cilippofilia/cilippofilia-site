<script>
  import { onMount } from "svelte";
  import { reveal } from "#lib/actions/reveal.js";
  import { initRunnerGame } from "#lib/games/runner-game.js";

  // Static markup the game module drives directly: no reactive bindings in
  // here, so Svelte never touches the nodes it mutates.
  let game;

  onMount(() => {
    const controller = new AbortController();
    initRunnerGame(game, { signal: controller.signal });
    return () => controller.abort();
  });
</script>

<section class="runner-section reveal" use:reveal>
  <h2>Skate Run</h2>
  <p class="runner-lede">
    Ollie and friends are out skating. Jump the cones, duck the pigeons, and see how far you get before the board goes
    flying.
  </p>
  <div class="runner-game" bind:this={game}>
    <div class="runner-game-stats">
      <p class="runner-game-score">0</p>
      <p class="runner-game-best">Best 0</p>
    </div>
    <div class="runner-game-screen">
      <canvas class="runner-game-canvas" aria-label="Skate Run"></canvas>
      <div class="runner-game-start">
        <p class="runner-game-start-title">Ready to roll?</p>
        <p class="runner-game-start-hint">
          Space or ↑ to jump, ↓ to duck. On touch, tap to jump and drag down to duck.
        </p>
        <button type="button" class="button runner-game-play">Play</button>
      </div>
      <div class="runner-game-result" hidden>
        <p class="runner-game-result-score"></p>
        <p class="runner-game-result-note"></p>
        <ol class="runner-game-leaderboard" hidden></ol>
        <button type="button" class="button secondary runner-game-replay">Play again</button>
      </div>
    </div>
    <div class="runner-game-picker" role="group" aria-label="Pick your skater"></div>
  </div>
</section>
