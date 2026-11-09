import "./media-releases.css";
import { curateFeeds, filterAndSortNotices, warningLevelOrder } from "./curation.mjs";
import { fetchMediaReleaseFeeds, mediaReleaseSources } from "./feeds.mjs";
import { updatedTimestamp } from "../alerts-listing/sorting.mjs";

const listing = document.querySelector("[data-media-releases]");

if (listing) {
  const isLocalPreview = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  const search = listing.querySelector("[data-search]");
  const filters = listing.querySelector("[data-filters]");
  const sort = listing.querySelector("[data-sort]");
  const filterPanel = listing.querySelector("[data-filter-panel]");
  const mobile = window.matchMedia("(max-width: 767.98px)");
  filterPanel.open = !mobile.matches;
  mobile.addEventListener("change", () => { filterPanel.open = !mobile.matches; });
  const results = listing.querySelector("[data-results]");
  const status = listing.querySelector("[data-results-status]");
  const feedNote = listing.querySelector("[data-feed-note]");
  const pagination = listing.querySelector("[data-pagination]");
  const pageSize = 8;
  let items = [];
  let currentPage = 1;

  function selectedValues(name) {
    return [...filters.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);
  }

  function visibleItems() {
    return filterAndSortNotices(items, {
      query: search.value,
      sources: selectedValues("source"),
      regions: selectedValues("region"),
      emergencyTypes: selectedValues("emergencyType"),
      warningLevels: selectedValues("warningLevel"),
      order: sort.value,
    });
  }

  function renderFilterGroup(name, container, valuesFor, order) {
    container.replaceChildren();
    const values = [...new Set(items.flatMap(valuesFor))];
    values.sort((first, second) => order
      ? order.indexOf(first) - order.indexOf(second)
      : first === "Not identified" ? 1 : second === "Not identified" ? -1 : first.localeCompare(second));
    for (const value of values) {
      const count = items.filter((item) => valuesFor(item).includes(value)).length;
      if (!count) continue;
      const label = document.createElement("label");
      label.className = "media-releases__filter";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = name;
      input.value = value;
      const text = document.createElement("span");
      text.textContent = `${value} (${count})`;
      label.append(input, text);
      container.append(label);
    }
  }

  function renderFilters() {
    renderFilterGroup("source", filters.querySelector("[data-source-filters]"), (item) => item.sources.filter((source) => source !== "WoG"),
      mediaReleaseSources.map((source) => source.name));
    renderFilterGroup("region", filters.querySelector("[data-region-filters]"), (item) => item.regions);
    renderFilterGroup("emergencyType", filters.querySelector("[data-type-filters]"), (item) => item.emergencyTypes);
    renderFilterGroup("warningLevel", filters.querySelector("[data-level-filters]"), (item) => [item.warningLevel], warningLevelOrder);
  }

  function safeLink(value) {
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  function formatDate(value) {
    const timestamp = updatedTimestamp(value);
    if (timestamp === null) return "";
    return new Intl.DateTimeFormat("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Australia/Darwin",
    }).format(timestamp);
  }

  function renderCard(item) {
    const article = document.createElement("article");
    article.className = "media-releases__item";
    const link = safeLink(item.url);
    const title = document.createElement(link ? "a" : "h2");
    title.className = "media-releases__title";
    title.textContent = item.title;
    if (link) {
      title.href = link;
      title.target = "_blank";
      title.rel = "noopener noreferrer";
    }

    const meta = document.createElement("p");
    meta.className = "media-releases__meta";
    const details = [item.fromName, formatDate(item.publishedAt)].filter(Boolean);
    meta.textContent = details.join(" · ");

    const source = document.createElement("p");
    source.className = "media-releases__source";
    source.textContent = `Source${item.sources.length > 1 ? "s" : ""}: ${item.sources.join(", ")}`;
    const classification = document.createElement("p");
    classification.className = "media-releases__classification";
    classification.title = "Best-effort classification from the notice title and subject";
    classification.textContent = `Region: ${item.regions.join(", ")} | Emergency type: ${item.emergencyTypes.join(", ")} | Warning level: ${item.warningLevel}`;
    article.append(title, meta, classification, source);
    return article;
  }

  function renderPagination(pageCount) {
    pagination.replaceChildren();
    if (pageCount <= 1) return;

    const list = document.createElement("ul");
    list.className = "media-releases__page-list";
    const addButton = (label, page, disabled, current = false) => {
      const entry = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.page = String(page);
      button.textContent = label;
      button.disabled = disabled;
      if (current) button.setAttribute("aria-current", "page");
      entry.append(button);
      list.append(entry);
    };

    addButton("Previous", currentPage - 1, currentPage === 1);
    for (let page = 1; page <= pageCount; page += 1) {
      addButton(String(page), page, false, page === currentPage);
    }
    addButton("Next", currentPage + 1, currentPage === pageCount);
    pagination.append(list);
  }

  function render() {
    const matches = visibleItems();
    const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
    currentPage = Math.min(currentPage, pageCount);
    const start = (currentPage - 1) * pageSize;
    const pageItems = matches.slice(start, start + pageSize);
    results.replaceChildren(...pageItems.map(renderCard));
    results.setAttribute("aria-busy", "false");
    status.textContent = matches.length
      ? `Showing ${start + 1}-${Math.min(start + pageSize, matches.length)} of ${matches.length} emergency updates. Sorted by ${sort.selectedOptions[0].textContent.toLowerCase()}.`
      : "No emergency updates match your search or filters.";
    renderPagination(pageCount);
  }

  function showFeedNotes(failedSources, incompleteSources) {
    const messages = [];
    if (failedSources.length) {
      messages.push(`Some feeds are unavailable: ${failedSources.join(", ")}.`);
    }
    messages.push(...incompleteSources);
    feedNote.hidden = messages.length === 0;
    feedNote.textContent = messages.join(" ");
  }

  search.addEventListener("input", () => {
    currentPage = 1;
    render();
  });
  filters.addEventListener("change", () => {
    currentPage = 1;
    render();
  });
  sort.addEventListener("change", () => {
    currentPage = 1;
    render();
  });
  pagination.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-page]");
    if (!button || button.disabled) return;
    currentPage = Number(button.dataset.page);
    render();
  });

  fetchMediaReleaseFeeds(
    fetch,
    (source) => isLocalPreview ? `/api/media-releases/${source.id}` : source.endpoint,
  )
    .then(({ feeds, failedSources, incompleteSources }) => {
      items = curateFeeds(feeds);
      renderFilters();
      showFeedNotes(failedSources, incompleteSources);
      render();
    })
    .catch((error) => {
      results.setAttribute("aria-busy", "false");
      status.textContent = "Emergency updates are temporarily unavailable. Please try again later.";
      feedNote.hidden = false;
      feedNote.textContent = "No source feeds could be loaded.";
      console.error("Unable to load emergency updates", error);
    });
}
