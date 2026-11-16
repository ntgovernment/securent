interface SearchResult {
  clickUri: string;
  title?: string;
  raw: {
    dctitle?: string;
    systitle?: string;
    sysfiletype?: string;
    dcmodified?: string | number | null;
    sysdate?: string | number | null;
  };
}

interface SearchController {
  defaults: { endpointURL: string; scopeID: string };
  searchresults: { all: SearchResult[] };
  renderResults(...args: unknown[]): unknown;
}

type SearchWindow = Window & typeof globalThis & { ntgCOVEO?: SearchController };

const installations = new WeakSet<SearchController>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function initializeSearchResults(window: SearchWindow) {
  const document = window.document;
  const list = document.querySelector<HTMLElement>("#search-results-list");
  if (!list) return;
  const controller = window.ntgCOVEO;
  if (!controller) throw new Error("Search presentation must load after the Coveo controller.");
  if (installations.has(controller)) return;
  installations.add(controller);
  const main = list.closest("main");
  main?.classList.add("securent-search");

  const titles = new Map<string, string>();
  const defaults = controller.defaults;
  const originalRender = controller.renderResults;
  let generation = 0;
  let lookup: Promise<void> | undefined;
  let lookupFailed = false;

  function resultURL(value: string) {
    if (!URL.canParse(value, window.location.href)) {
      window.console.warn("Search breadcrumb has an invalid result URL:", value);
      return undefined;
    }
    const url = new URL(value, window.location.href);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      window.console.warn("Search breadcrumb has an unsupported result URL:", value);
      return undefined;
    }
    url.search = "";
    url.hash = "";
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url;
  }

  function addTitles(results: unknown[]) {
    for (const result of results) {
      if (!isRecord(result) || typeof result.clickUri !== "string") {
        window.console.warn("Search title lookup contains a result without a URL.");
        continue;
      }
      const raw = isRecord(result.raw) ? result.raw : {};
      const title = raw.dctitle || result.title || raw.systitle;
      const url = resultURL(result.clickUri);
      if (url && typeof title === "string" && title.trim()) titles.set(url.href, title.trim());
    }
  }

  function ancestors(value: string) {
    const url = resultURL(value);
    if (!url || url.origin !== window.location.origin) return [];
    const parts = url.pathname.split("/").filter(Boolean);
    const rootParts = parts[0] === "securent" ? 1 : 0;
    const root = new URL(rootParts ? "/securent" : "/", url.origin);
    const parents = [{ url: root.href, title: "SecureNT" }];
    for (let count = rootParts + 1; count < parts.length; count++) {
      const parent = new URL(`/${parts.slice(0, count).join("/")}`, url.origin).href;
      parents.push({ url: parent, title: titles.get(parent) || "" });
    }
    return parents;
  }

  function addBreadcrumb(card: HTMLElement, value: string) {
    card.querySelector(".search-result__breadcrumbs")?.remove();
    const parents = ancestors(value).filter((parent) => parent.title);
    if (!parents.length) return;
    const nav = document.createElement("nav");
    nav.className = "search-result__breadcrumbs";
    nav.setAttribute("aria-label", "Result location");
    const path = document.createElement("ol");
    for (const parent of parents) {
      const segment = document.createElement("li");
      segment.textContent = parent.title;
      path.append(segment);
    }
    nav.append(path);
    card.querySelector(".search-title")?.after(nav);
  }

  function addMetadata(card: HTMLElement, result: SearchResult) {
    const oldDate = card.querySelector('[data-ref="search-result-date"]');
    const filetype = card.querySelector('[data-ref="search-result-filetype"]');
    const row = oldDate?.parentElement;
    const metadata = document.createElement("div");
    metadata.className = "search-result__metadata";
    const value = result.raw.sysfiletype?.toLowerCase() === "html"
      ? result.raw.dcmodified : result.raw.sysdate;
    if (value !== undefined && value !== null && value !== "") {
      const date = new Date(typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value);
      if (Number.isFinite(date.getTime())) {
        const time = document.createElement("time");
        time.dateTime = date.toISOString();
        time.textContent = `Last updated: ${new Intl.DateTimeFormat("en-AU", {
          day: "numeric", month: "long", year: "numeric", timeZone: "Australia/Darwin",
        }).format(date)}`;
        metadata.append(time);
      } else {
        window.console.warn("Search result has an invalid updated date:", result.clickUri, value);
      }
    }
    if (result.raw.sysfiletype?.toLowerCase() !== "html" && filetype?.textContent?.trim()) {
      metadata.prepend(filetype);
    }
    row?.remove();
    if (metadata.childElementCount) card.append(metadata);
  }

  function lookupTitles() {
    if (!lookup) {
      const url = new URL(defaults.endpointURL, window.location.href);
      if (url.origin !== window.location.origin) {
        throw new Error("Search breadcrumb lookup requires the same-origin CMS JSON endpoint.");
      }
      url.searchParams.set("searchterm", "");
      url.searchParams.set("scope", defaults.scopeID);
      const abort = new window.AbortController();
      const timeout = window.setTimeout(() => abort.abort(), 10000);
      lookup = window.fetch(url.href, { signal: abort.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error(`Search title lookup failed: HTTP ${response.status}`);
          const data: unknown = await response.json();
          if (!isRecord(data) || !Array.isArray(data.results)) {
            throw new Error("Search title lookup did not return a results array.");
          }
          addTitles(data.results);
        })
        .catch((error: unknown) => {
          lookupFailed = true;
          window.console.warn("Search breadcrumb titles could not be loaded.", error);
        })
        .finally(() => window.clearTimeout(timeout));
    }
    return lookup;
  }

  controller.renderResults = function (...args) {
    const currentGeneration = ++generation;
    const results = [...this.searchresults.all];
    addTitles(results);
    const returned = originalRender.apply(this, args);
    main?.querySelector(".search-breadcrumb-status")?.remove();
    const byURL = new Map(results.map((result) => [result.clickUri, result]));
    const cards: { card: HTMLElement; result: SearchResult }[] = [];
    for (const card of list.querySelectorAll<HTMLElement>(":scope > li")) {
      const link = card.querySelector<HTMLAnchorElement>('[data-ref="search-result-title"]');
      const result = link && byURL.get(link.href);
      if (!result || card.classList.contains("search-result")) continue;
      card.classList.add("search-result");
      addBreadcrumb(card, result.clickUri);
      addMetadata(card, result);
      cards.push({ card, result });
    }
    if (cards.some(({ result }) => ancestors(result.clickUri).some((parent) => !parent.title))) {
      void lookupTitles().then(() => {
        if (generation !== currentGeneration) return;
        const connected = cards.filter(({ card }) => card.isConnected);
        for (const { card, result } of connected) addBreadcrumb(card, result.clickUri);
        if (lookupFailed && connected.length) {
          const status = document.createElement("p");
          status.className = "search-breadcrumb-status";
          status.setAttribute("role", "status");
          status.textContent = "Some result locations could not be loaded. Search results are still available.";
          list.before(status);
        }
      });
    }
    return returned;
  };
}
