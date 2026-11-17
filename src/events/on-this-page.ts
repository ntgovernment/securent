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
    const matchedHeadings = new Set<HTMLElement>();
    const sections = [...nav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')].flatMap((link) => {
      const heading = headings.find((heading) =>
        !matchedHeadings.has(heading) && `#${encodeURIComponent(heading.id)}` === link.hash);
      if (heading) {
        matchedHeadings.add(heading);
        // The legacy component gives repeated heading labels the same ID.
        if (window.document.getElementById(heading.id) !== heading) {
          const base = heading.id;
          let suffix = 2;
          while (window.document.getElementById(`${base}-${suffix}`)) suffix++;
          heading.id = `${base}-${suffix}`;
          link.setAttribute("href", `#${encodeURIComponent(heading.id)}`);
        }
      }
      return heading && heading.getClientRects().length > 0 ? [{ link, heading }] : [];
    });
    // Allow subpixel rounding at anchor destinations, not other visible headings.
    const activationLine = 2;
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
      const destination = sections.find(({ link, heading }) => {
        const top = heading.getBoundingClientRect().top;
        return link.hash === window.location.hash && top >= -activationLine && top < window.innerHeight;
      });
      active = destination?.link ?? sections.at(-1)?.link;
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
