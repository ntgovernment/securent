const landingSelector = ".hero-banner.intro-section.bg-ntg-background-alt";

function normalizeText(element) {
  return element.textContent.replace(/\s+/g, " ").trim();
}

function isTitleOnly(element, heading) {
  if (!element || !element.matches("div.container-xl")) return false;
  const titles = element.querySelectorAll("h1");
  return titles.length === 1 &&
    normalizeText(titles[0]) === normalizeText(heading) &&
    normalizeText(element) === normalizeText(heading) &&
    Array.from(element.querySelectorAll("*")).every((child) =>
      child.matches("div, h1, span, strong, em"),
    );
}

export function initializeHeroBanners(root = document) {
  root.querySelectorAll(landingSelector).forEach((hero) => {
    const container = hero.querySelector(":scope > .container-xl");
    const column = container?.querySelector(":scope > .row > .col-12");
    const heading = column?.querySelector(":scope > h1");
    if (!container || !column || !heading) return;

    const main = hero.parentElement;
    const title = hero.previousElementSibling;
    const matchingTitle = isTitleOnly(title, heading);
    if (matchingTitle) title.hidden = true;

    let breadcrumbs = hero.querySelector(".breadcrumb-container");
    if (!breadcrumbs && main.matches("main") && (!title || matchingTitle)) {
      const preceding = main.previousElementSibling;
      if (preceding?.matches(".breadcrumb-container")) {
        breadcrumbs = preceding;
      } else if (preceding?.id.startsWith("content_container_")) {
        breadcrumbs = preceding.querySelector(":scope > .breadcrumb-container");
      }
    }

    if (breadcrumbs) {
      breadcrumbs.classList.add("hero-banners__breadcrumbs");
      container.prepend(breadcrumbs);
      const current = breadcrumbs.querySelector(".breadcrumb-item.active");
      if (current && !current.querySelector("a")) {
        current.setAttribute("aria-current", "page");
      }
    }

    const copy = column.querySelector(":scope > div");
    const action = copy?.querySelector(":scope > .intro-text-link") ??
      column.querySelector(":scope > .intro-text-link");
    if (action) {
      column.append(action);
      if (!action.querySelector(".hero-banners__cta-icon")) {
        const icon = document.createElement("i");
        icon.className = "fa-solid fa-arrow-up-right-from-square hero-banners__cta-icon";
        icon.setAttribute("aria-hidden", "true");
        action.append(icon);
      }
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initializeHeroBanners(), {
    once: true,
  });
} else {
  initializeHeroBanners();
}