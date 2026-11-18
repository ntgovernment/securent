export function initializeEventNavigation(window: Window & typeof globalThis) {
  const main = window.document.querySelector<HTMLElement>("main[data-event-page]");
  const nav = main?.querySelector<HTMLElement>('[data-component="ntg-inpage-nav"]');
  if (!main || !nav || nav.classList.contains("ntg-on-this-page")) return;

  nav.classList.add("ntg-on-this-page");
  nav.setAttribute("role", "navigation");
  nav.setAttribute("aria-label", "On this page");
  let frame: number | undefined;
  let followHash = true;
  let accordions: { heading: HTMLElement; button: HTMLButtonElement; panel: HTMLElement; label: string }[] = [];

  const hashAccordion = () => accordions.find(({ heading }) =>
    `#${encodeURIComponent(heading.id)}` === window.location.hash);

  const openAccordion = ({ button, panel }: typeof accordions[number]) => {
    if (!panel.classList.contains("show") && !panel.classList.contains("collapsing")) button.click();
  };

  const update = () => {
    frame = undefined;
    const headings = [...main.querySelectorAll<HTMLElement>(
      "h2:not(.accordion-header), .ntg-accordion .accordion-header",
    )];
    accordions = headings.flatMap((heading) => {
      if (!heading.matches(".ntg-accordion .accordion-header")) return [];
      const button = heading.querySelector<HTMLButtonElement>('.accordion-button[data-bs-toggle="collapse"]');
      const label = button?.textContent?.trim();
      const panel = window.document.getElementById(button?.getAttribute("aria-controls") ?? "");
      if (!button || !label || !panel || !heading.closest(".accordion-item")?.contains(panel)) return [];
      if (!heading.id) {
        const base = `heading-${panel.id}`;
        let id = base;
        let suffix = 2;
        while (window.document.getElementById(id)) id = `${base}-${suffix++}`;
        heading.id = id;
      }
      return [{ heading, button, panel, label }];
    });
    const matchedHeadings = new Set<HTMLElement>();
    let sections = [...nav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')].flatMap((link) => {
      const heading = headings.find((heading) =>
        !matchedHeadings.has(heading) && `#${encodeURIComponent(heading.id)}` === link.hash);
      if (heading) {
        matchedHeadings.add(heading);
        // The legacy component gives repeated heading labels the same ID.
        if (!heading.classList.contains("accordion-header") && window.document.getElementById(heading.id) !== heading) {
          const base = heading.id;
          let suffix = 2;
          while (window.document.getElementById(`${base}-${suffix}`)) suffix++;
          heading.id = `${base}-${suffix}`;
          link.setAttribute("href", `#${encodeURIComponent(heading.id)}`);
        }
      }
      return heading ? [{ link, heading }] : [];
    });
    const list = nav.querySelector("ul.ntg-inpage-nav, ul");
    let nextItem: HTMLLIElement | null = null;
    for (const heading of [...headings].reverse()) {
      let section = sections.find((section) => section.heading === heading);
      const accordion = accordions.find((accordion) => accordion.heading === heading);
      if (list && accordion) {
        if (!section) {
          const item = window.document.createElement("li");
          item.className = "nav-item";
          const link = window.document.createElement("a");
          link.className = "nav-link";
          link.setAttribute("href", `#${encodeURIComponent(heading.id)}`);
          link.textContent = accordion.label;
          item.append(link);
          section = { link, heading };
          sections.push(section);
        }
        const item = section.link.closest("li");
        if (item && (item.parentElement !== list || item.nextElementSibling !== nextItem)) {
          list.insertBefore(item, nextItem);
        }
      }
      if (section) nextItem = section.link.closest("li");
    }
    sections = sections
      .filter(({ heading }) => heading.getClientRects().length > 0)
      .sort((a, b) => headings.indexOf(a.heading) - headings.indexOf(b.heading));
    if (followHash) {
      followHash = false;
      const accordion = hashAccordion();
      if (accordion) openAccordion(accordion);
    }
    // Allow subpixel rounding at anchor destinations, not other visible headings.
    const activationLine = 2;
    const viewportTop = window.visualViewport?.offsetTop ?? 0;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    let active: HTMLAnchorElement | undefined;
    for (const { link, heading } of sections) {
      const top = heading.getBoundingClientRect().top - viewportTop;
      if (top <= activationLine) active = link;
      else if (!active && top < viewportHeight) {
        active = link;
        break;
      }
    }

    const document = window.document.documentElement;
    if (window.scrollY + viewportTop + viewportHeight >= document.scrollHeight - 2) {
      const destination = sections.find(({ link, heading }) => {
        const top = heading.getBoundingClientRect().top - viewportTop;
        return link.hash === window.location.hash && top >= -activationLine && top < viewportHeight;
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
  window.visualViewport?.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.visualViewport?.addEventListener("resize", scheduleUpdate);
  window.addEventListener("hashchange", () => {
    followHash = true;
    scheduleUpdate();
  });
  nav.addEventListener("click", (event) => {
    if (event instanceof window.MouseEvent &&
      (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)) return;
    if (!(event.target instanceof window.Element)) return;
    const link = event.target.closest<HTMLAnchorElement>('a[href^="#"]');
    const accordion = accordions.find(({ heading }) => link?.hash === `#${encodeURIComponent(heading.id)}`);
    if (accordion) openAccordion(accordion);
  });
  main.addEventListener("toggle", scheduleUpdate, true);
  main.addEventListener("shown.bs.collapse", (event) => {
    const accordion = hashAccordion();
    if (accordion?.panel === event.target) accordion.heading.scrollIntoView({ block: "start" });
    scheduleUpdate();
  });
  main.addEventListener("hidden.bs.collapse", scheduleUpdate);
  scheduleUpdate();
}
