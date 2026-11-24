export function initializeHomepageWarningBanners(window) {
  const { document } = window;

  function classifyBanners() {
    document.querySelectorAll("#latest-warnings > section > .warning-banner").forEach(function (banner) {
      const heading = banner.querySelector("h1, h2, h3, h4, h5, h6");
      banner.classList.toggle(
        "warning-banner--recovery",
        Boolean(heading && heading.textContent.toLowerCase().includes("recovery")),
      );
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", classifyBanners, { once: true });
  } else {
    classifyBanners();
  }
}
