// Shared by the custom app landing pages (web/drinko/, web/iterly/,
// web/itswritten/, web/nine-tiles-puzzle/): fades each <main> section in as
// it scrolls into view. Wrapped in a block so its names don't leak into the
// global scope that a page's own script shares.
{
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const sections = document.querySelectorAll("main section");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    sections.forEach((el) => el.classList.add("in-view"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 }
    );
    sections.forEach((el) => observer.observe(el));
  }
}
