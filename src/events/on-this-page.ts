export function initializeEventNavigation(window: Window & typeof globalThis) {
  const main = window.document.querySelector<HTMLElement>("main[data-event-page]");
  const nav = main?.querySelector<HTMLElement>('[data-component="ntg-inpage-nav"]');
  if (!main || !nav || nav.classList.contains("ntg-on-this-page")) return;

  nav.classList.add("ntg-on-this-page");
  nav.setAttribute("role", "navigation");
  nav.setAttribute("aria-label", "On this page");
  let frame: number | undefined;

  const update = () => {
    frame = undefined;
    const headings = [...main.querySelectorAll<HTMLElement>("h2:not(.accordion-header)")];
    const sections = [...nav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')].flatMap((link) => {
      const heading = headings.find((heading) => `#${encodeURIComponent(heading.id)}` === link.hash);
      return heading && heading.getClientRects().length > 0 ? [{ link, heading }] : [];
    });
    const activationLine = Math.max(32, window.innerHeight * 0.25);
    let active: HTMLAnchorElement | undefined;
    for (const { link, heading } of sections) {
      const top = heading.getBoundingClientRect().top;
      if (top <= activationLine) active = link;
      else if (!active && top < window.innerHeight) {
        active = link;
        break;
      }
    }

    const document = window.document.documentElement;
    if (window.scrollY + window.innerHeight >= document.scrollHeight - 2) {
      active = sections.at(-1)?.link;
    }
    for (const link of nav.querySelectorAll<HTMLAnchorElement>("a")) {
      const selected = link === active;
      link.classList.toggle("active", selected);
      if (selected) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  };

  function scheduleUpdate() {
    if (frame === undefined) frame = window.requestAnimationFrame(update);
  }

  // The legacy NTG component may populate the list after the theme loads.
  const observer = new window.MutationObserver(scheduleUpdate);
  observer.observe(nav, { childList: true, subtree: true });
  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate);
  window.addEventListener("hashchange", scheduleUpdate);
  main.addEventListener("toggle", scheduleUpdate, true);
  main.addEventListener("shown.bs.collapse", scheduleUpdate);
  main.addEventListener("hidden.bs.collapse", scheduleUpdate);
  scheduleUpdate();
}
