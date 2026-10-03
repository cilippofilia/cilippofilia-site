<script>
  import { onMount } from "svelte";

  // Countdown to release. Once the date passes, the page swaps its
  // pre-order buttons and beta note for the "available now" state.
  let { release } = $props();
  let countdown;

  onMount(() => {
    const releaseDate = new Date(release).getTime();
    const el = (id) => document.getElementById(id);
    const [daysEl, hoursEl, minutesEl, secondsEl] = ["cd-days", "cd-hours", "cd-minutes", "cd-seconds"].map(el);
    const pad = (n) => String(n).padStart(2, "0");

    const setValue = (target, value) => {
      const digits = target.querySelectorAll(".digit");
      for (let i = 0; i < digits.length; i++) {
        const digit = digits[i];
        const char = value[i];
        if (digit.textContent === char) continue;
        digit.textContent = char;
        digit.classList.remove("tick");
        void digit.offsetWidth; // restart animation
        digit.classList.add("tick");
      }
    };

    // Declared before the first tick: once the release date has passed, that
    // first tick goes straight to goLive(), which clears this interval.
    let timer;

    const goLive = () => {
      countdown.hidden = true;
      el("release-live").hidden = false;
      el("badge-pre").hidden = true;
      el("beta-note").hidden = true;
      el("badge-post").hidden = false;
      clearInterval(timer);
    };

    const tick = () => {
      const diff = releaseDate - Date.now();
      if (diff <= 0) {
        goLive();
        return;
      }
      const totalSeconds = Math.floor(diff / 1000);
      setValue(daysEl, pad(Math.floor(totalSeconds / 86400)));
      setValue(hoursEl, pad(Math.floor((totalSeconds % 86400) / 3600)));
      setValue(minutesEl, pad(Math.floor((totalSeconds % 3600) / 60)));
      setValue(secondsEl, pad(totalSeconds % 60));
    };

    tick();
    if (releaseDate > Date.now()) timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  });
</script>

<div class="countdown" bind:this={countdown} id="countdown" aria-label="Time until release">
  <div class="countdown-unit">
    <span class="countdown-value" id="cd-days"><span class="digit">0</span><span class="digit">0</span></span><span
      class="countdown-label">Days</span
    >
  </div>
  <div class="countdown-unit">
    <span class="countdown-value" id="cd-hours"><span class="digit">0</span><span class="digit">0</span></span><span
      class="countdown-label">Hours</span
    >
  </div>
  <div class="countdown-unit">
    <span class="countdown-value" id="cd-minutes"><span class="digit">0</span><span class="digit">0</span></span><span
      class="countdown-label">Min</span
    >
  </div>
  <div class="countdown-unit">
    <span class="countdown-value" id="cd-seconds"><span class="digit">0</span><span class="digit">0</span></span><span
      class="countdown-label">Sec</span
    >
  </div>
</div>
