// Shared by the app landing pages: fades each <main> section in as it
// scrolls into view. Used as `use:landingReveal` on <main>.
export function landingReveal(main) {
  const sections = main.querySelectorAll("section");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || !("IntersectionObserver" in window)) {
    sections.forEach((el) => el.classList.add("in-view"));
    return {};
  }
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
  return { destroy: () => observer.disconnect() };
}
