<script>
  import { onMount } from "svelte";
  import { reveal } from "#lib/actions/reveal.js";
  import { initMazeGame } from "#lib/games/maze-game.js";
  import { initMazeExplainer } from "#lib/games/maze-explainer.js";

  // Static markup the two game modules drive directly: no reactive bindings
  // in here, so Svelte never touches the nodes they mutate.
  let game;
  let flip;
  let toggle;

  onMount(() => {
    const controller = new AbortController();
    initMazeGame(game, { signal: controller.signal });
    initMazeExplainer(flip, toggle, { signal: controller.signal });
    return () => controller.abort();
  });
</script>

<section class="maze-section reveal" use:reveal>
  <h2>Escape the Labyrinth</h2>
  <p class="maze-lede">
    A fresh maze, generated with Wilson's algorithm every time. Arrow keys, WASD, or swipe to move.
  </p>
  <button type="button" class="maze-explain-toggle" bind:this={toggle}>How was this maze made?</button>
  <div class="maze-flip" bind:this={flip}>
    <div class="maze-flip-inner">
      <div class="maze-flip-face maze-flip-front">
        <div class="maze-game" bind:this={game}>
          <div class="maze-game-stats">
            <p class="maze-game-timer">0.0s</p>
            <p class="maze-game-moves">0 moves</p>
          </div>
          <div class="maze-game-screen">
            <canvas class="maze-game-canvas" aria-label="Maze"></canvas>
            <div class="maze-game-start">
              <p class="maze-game-start-title">Ready to escape?</p>
              <p class="maze-game-start-hint">Use arrow keys, WASD, or swipe once you're in.</p>
              <button type="button" class="button maze-game-play">Play</button>
            </div>
            <div class="maze-game-result" hidden>
              <p class="maze-game-result-time"></p>
              <p class="maze-game-result-moves"></p>
              <ol class="maze-game-leaderboard"></ol>
              <button type="button" class="button secondary maze-game-replay">Play again</button>
            </div>
          </div>
        </div>
      </div>
      <div class="maze-flip-face maze-flip-back">
        <div class="maze-explainer">
          <p class="maze-explainer-caption"></p>
          <div class="maze-explainer-screen">
            <canvas class="maze-explainer-canvas" aria-label="Wilson's algorithm walkthrough"></canvas>
          </div>
          <div class="maze-explainer-controls">
            <button type="button" class="button secondary maze-explainer-prev">Prev</button>
            <p class="maze-explainer-step"></p>
            <button type="button" class="button secondary maze-explainer-next">Next</button>
          </div>
          <div class="maze-explainer-actions">
            <button type="button" class="button secondary maze-explainer-restart">Restart</button>
            <button type="button" class="button maze-explainer-close">Back to the maze</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
