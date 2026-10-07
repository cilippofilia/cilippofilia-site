<script>
  import "#lib/styles/maze-game.css";
  import "#lib/styles/runner-game.css";
  import "#lib/styles/notfound-game.css";
  import Seo from "#lib/components/Seo.svelte";
  import MazeSection from "#lib/components/MazeSection.svelte";
  import RunnerSection from "#lib/components/RunnerSection.svelte";
  import NotFoundGame from "#lib/components/NotFoundGame.svelte";
  import { reveal } from "#lib/actions/reveal.js";
</script>

<Seo
  title="Games · cilippofilia.dev"
  description="Three small browser games: escape a freshly generated maze, skate as far as you can in Skate Run, and whack broken links."
  url="https://cilippofilia.dev/games"
/>

<main>
  <div class="wrap">
    <section class="hero" style="margin-top:0">
      <h1>Games</h1>
      <p class="lede">A few small things to play between builds. Everything runs right here in the browser.</p>
    </section>

    <MazeSection />

    <RunnerSection />

    <!-- The 404 page's game, also kept here so it can be played without
         hunting for a broken link. -->
    <section class="reveal" use:reveal>
      <h2>Whack a Broken Link</h2>
      <p class="notfound-lede">Broken links pop up all over the field. Tap them before they vanish.</p>
      <NotFoundGame />
    </section>
  </div>
</main>

<style>
  .notfound-lede {
    color: var(--text-dim);
    max-width: 80ch;
  }

  /* On the 404 page the game sits under a big hero and gets extra room;
     here it sits under a lede, as the maze and Skate Run cards do, so it
     takes their gap. */
  section :global(.notfound-game) {
    margin-top: var(--space-24);
  }
</style>
