const initializedMenus = new WeakSet();

export function initializeOnThisPage(window) {
  const document = window.document;
  document.querySelectorAll('main#content[data-event-page] [data-component="ntg-inpage-nav"]').forEach((menu) => {
    if (initializedMenus.has(menu)) return;
    initializedMenus.add(menu);
    let entries = [];
    let frame = 0;

    function update() {
      frame = 0;
      const offset = parseFloat(window.getComputedStyle(menu).getPropertyValue("--ntg-on-this-page-offset")) || 16;
      let active = null;
      let distance = Infinity;
      entries.forEach((entry) => {
        if (!entry.heading.getClientRects().length) return;
        const nextDistance = Math.abs(entry.heading.getBoundingClientRect().top - offset);
        if (nextDistance < distance) {
          active = entry;
          distance = nextDistance;
        }
      });
      entries.forEach((entry) => {
        const selected = entry === active;
        entry.item.classList.toggle("active", selected);
        entry.link.classList.toggle("active", selected);
        if (selected) entry.link.setAttribute("aria-current", "location");
        else entry.link.removeAttribute("aria-current");
      });
    }

    function schedule() {
      if (!frame) frame = window.requestAnimationFrame(update);
    }

    function readLinks() {
      entries.forEach(({ item, link }) => {
        item.classList.remove("active");
        link.classList.remove("active");
        link.removeAttribute("aria-current");
      });
      entries = Array.from(menu.querySelectorAll('.ntg-inpage-nav .nav-item:not(.heading) > a[href]')).flatMap((link) => {
        try {
          const url = new URL(link.getAttribute("href"), document.baseURI);
          const id = decodeURIComponent(url.hash.slice(1));
          const item = link.parentElement;
          const samePage = url.origin === window.location.origin && url.pathname === window.location.pathname && url.search === window.location.search;
          if (!id || (!samePage && item.dataset.anchorName !== id)) return [];
          const heading = document.getElementById(id);
          if (!heading?.matches("h1,h2,h3,h4,h5,h6") || !heading.closest("#content")) return [];
          return [{ item, link, heading }];
        } catch {
          return [];
        }
      }).sort((first, second) => first.heading.compareDocumentPosition(second.heading) & 4 ? -1 : 1);
      menu.classList.toggle("ntg-on-this-page", entries.length > 0);
      schedule();
    }

    readLinks();
    new window.MutationObserver(readLinks).observe(menu, { childList: true, subtree: true });
    if (window.ResizeObserver) {
      const observer = new window.ResizeObserver(schedule);
      observer.observe(menu);
      const content = document.querySelector(".content__main");
      if (content) observer.observe(content);
    }
    window.addEventListener("scroll", schedule, { passive: true });
    ["resize", "hashchange", "load", "pageshow"].forEach((event) => window.addEventListener(event, schedule));
    document.fonts?.ready.then(schedule);
  });
}