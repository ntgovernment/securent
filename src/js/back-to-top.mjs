const SCROLL_THRESHOLD = 500;

export function initializeBackToTop(window) {
  const { document } = window;
  if (!document.body) return;

  let button = document.getElementById("back-to-top");
  if (!button) {
    button = document.createElement("button");
    button.id = "back-to-top";
    document.body.append(button);
  }
  if (button.dataset.backToTopReady === "true") return;

  button.type = "button";
  button.classList.add("back-to-top");
  button.setAttribute("aria-label", "Back to top");
  button.innerHTML = '<span class="fa-light fa-chevron-up" aria-hidden="true"></span>';
  button.hidden = true;
  button.dataset.backToTopReady = "true";

  function updateVisibility() {
    button.hidden = window.scrollY <= SCROLL_THRESHOLD;
  }

  window.addEventListener("scroll", updateVisibility, { passive: true });
  button.addEventListener("click", function () {
    const reducedMotion = typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  });
  updateVisibility();
}
