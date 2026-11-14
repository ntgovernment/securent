import "./media-releases.css";
import { attachAutocomplete, getAutocompleteCandidates } from "../search/autocomplete.mjs";
import { curateFeeds, filterAndSortNotices, warningLevelOrder } from "./curation.mjs";
import { fetchMediaReleaseFeeds, mediaReleaseSources } from "./feeds.mjs";
import { getPageWindow } from "../pagination/page-window.mjs";
import { createCardSkeleton, renderCard, startRelativeTimeUpdates } from "./media-release-card.js";
const listing = document.querySelector("[data-media-releases]");

if (listing) {
  const isLocalPreview = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  const search = listing.querySelector("[data-search]");
  const searchSuggestions = listing.querySelector("[data-search-suggestions]");
  const filters = listing.querySelector("[data-filters]");
  const sort = listing.querySelector("[data-sort]");
  const filterPanel = listing.querySelector("[data-filter-panel]");
  const mobile = window.matchMedia("(max-width: 767.98px)");
  filterPanel.open = !mobile.matches;
  mobile.addEventListener("change", () => { filterPanel.open = !mobile.matches; });
  const results = listing.querySelector("[data-results]");
  startRelativeTimeUpdates(results);
  const status = listing.querySelector("[data-results-status]");
  const feedNote = listing.querySelector("[data-feed-note]");
  const pagination = listing.querySelector("[data-pagination]");
  const pageSize = 10;
  let items = [];
  let currentPage = 1;

  const loadingContents = [...listing.children];
  const loadingMessage = document.createElement("span");
  loadingMessage.className = "visually-hidden";
  loadingMessage.dataset.loadingStatus = "";
  loadingMessage.setAttribute("role", "status");
  loadingMessage.setAttribute("aria-live", "polite");
  listing.append(loadingMessage);

  function renderFilterSkeletons() {
    const groups = [
      ["[data-level-filters]", 3],
      ["[data-type-filters]", 6],
      ["[data-region-filters]", 4],
      ["[data-source-filters]", 3],
    ];
    for (const [selector, count] of groups) {
      const container = filters.querySelector(selector);
      container.replaceChildren(...Array.from({ length: count }, () => {
        const row = document.createElement("div");
        row.className = "media-releases__filter-skeleton-row";
        row.setAttribute("aria-hidden", "true");
        row.innerHTML = `<span class="media-releases__filter-skeleton-control">
          <span class="media-releases__skeleton-block media-releases__filter-skeleton-checkbox"></span>
        </span>
        <span class="media-releases__skeleton-block media-releases__filter-skeleton-label"></span>`;
        return row;
      }));
    }
  }

  function clearFilterSkeletons() {
    filters.querySelectorAll(".media-releases__filter-skeleton-row").forEach((row) => row.remove());
  }

  function setLoading(loading) {
    loadingMessage.textContent = loading ? "Loading current warnings..." : "";
    results.setAttribute("aria-busy", String(loading));
    if (loading) {
      results.replaceChildren(...Array.from({ length: pageSize }, () => createCardSkeleton()));
      renderFilterSkeletons();
    }
    for (const content of loadingContents) {
      content.inert = loading;
      content.setAttribute("aria-busy", String(loading));
    }
  }

  const searchAutocomplete = attachAutocomplete(search, searchSuggestions, () => items
    .flatMap((item) => getAutocompleteCandidates([
      item.title, item.name, ...item.regions, ...(item.locationTerms || []),
    ])));

  function selectedValues(name) {
    return [...filters.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);
  }

  function visibleItems() {
    return filterAndSortNotices(items, {
      query: search.value,
      sources: selectedValues("source"),
      regions: selectedValues("region"),
      emergencyTypes: selectedValues("emergencyType"),
      declarations: selectedValues("declaration"),
      warningLevels: selectedValues("warningLevel"),
      order: sort.value,
    });
  }

  function renderFilterGroup(name, container, valuesFor, order, alwaysInclude = []) {
    container.replaceChildren();
    const alwaysIncluded = new Set(alwaysInclude);
    const values = [...new Set([...alwaysInclude, ...items.flatMap(valuesFor)])];
    values.sort((first, second) => order
      ? order.indexOf(first) - order.indexOf(second)
      : first === "Not identified" ? 1 : second === "Not identified" ? -1 : first.localeCompare(second));
    for (const value of values) {
      const count = items.filter((item) => valuesFor(item).includes(value)).length;
      if (!count && !alwaysIncluded.has(value)) continue;
      const label = document.createElement("label");
      label.className = "media-releases__filter";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = name;
      input.value = value;
      const text = document.createElement("span");
      text.textContent = `${filterDisplayLabel(value)} (${count})`;
      label.append(input, text);
      container.append(label);
    }
  }

  function filterDisplayLabel(value) {
    if (value === "Not identified") return "Other";
    if (value === "Fire ban declaration") return "Fire ban notices";
    return value;
  }

  function renderIncidentNoticeTypeFilters(container) {
    container.replaceChildren();
    const options = new Map();
    for (const item of items) {
      const itemOptions = new Set();
      for (const [name, values] of [["emergencyType", item.emergencyTypes], ["declaration", item.declarations]]) {
        for (const value of values) {
          const key = `${name}:${value}`;
          if (itemOptions.has(key)) continue;
          itemOptions.add(key);
          const option = options.get(key) || { name, value, count: 0 };
          option.count += 1;
          options.set(key, option);
        }
      }
    }

    const entries = [...options.values()].sort((first, second) => {
      const firstLabel = filterDisplayLabel(first.value);
      const secondLabel = filterDisplayLabel(second.value);
      if (firstLabel === "Other") return secondLabel === "Other" ? 0 : 1;
      if (secondLabel === "Other") return -1;
      return firstLabel.localeCompare(secondLabel, "en");
    });
    const filterLabels = entries.map((entry, index) => {
      const label = document.createElement("label");
      label.className = "media-releases__filter";
      label.hidden = index >= 6;
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = entry.name;
      input.value = entry.value;
      const text = document.createElement("span");
      text.textContent = `${filterDisplayLabel(entry.value)} (${entry.count})`;
      label.append(input, text);
      container.append(label);
      return label;
    });

    const hiddenCount = Math.max(0, entries.length - 6);
    if (!hiddenCount) return;
    const expandButton = document.createElement("button");
    expandButton.type = "button";
    expandButton.className = "media-releases__filter-expand";
    expandButton.dataset.expandFilters = "";
    expandButton.setAttribute("aria-expanded", "false");
    expandButton.textContent = `Show all (${hiddenCount})`;
    expandButton.addEventListener("click", () => {
      const expanded = expandButton.getAttribute("aria-expanded") !== "true";
      filterLabels.slice(6).forEach((label) => { label.hidden = !expanded; });
      expandButton.setAttribute("aria-expanded", String(expanded));
      expandButton.textContent = expanded ? "Show less" : `Show all (${hiddenCount})`;
    });
    container.append(expandButton);
  }

  function renderFilters() {
    const sourceNames = mediaReleaseSources.map((source) => source.name);
    renderFilterGroup("source", filters.querySelector("[data-source-filters]"), (item) => item.sources,
      sourceNames, sourceNames);
    renderFilterGroup("region", filters.querySelector("[data-region-filters]"), (item) => item.regions);
    renderIncidentNoticeTypeFilters(filters.querySelector("[data-type-filters]"));
    renderFilterGroup("warningLevel", filters.querySelector("[data-level-filters]"),
      (item) => item.declarations?.length ? [] : [item.warningLevel], warningLevelOrder);
  }

  function renderPagination(pageCount) {
    pagination.replaceChildren();
    if (pageCount <= 1) return;

    const list = document.createElement("ul");
    list.className = "pagination__page-list";
    const addButton = (label, page, disabled, current = false) => {
      const entry = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "pagination__page-button";
      button.dataset.page = String(page);
      button.textContent = label;
      button.disabled = disabled;
      if (current) button.setAttribute("aria-current", "page");
      entry.append(button);
      list.append(entry);
    };
    const addEllipsis = () => {
      const entry = document.createElement("li");
      const ellipsis = document.createElement("span");
      ellipsis.className = "pagination__ellipsis";
      ellipsis.setAttribute("aria-hidden", "true");
      ellipsis.textContent = "\u2026";
      entry.append(ellipsis);
      list.append(entry);
    };

    addButton("Previous", currentPage - 1, currentPage === 1);
    for (const page of getPageWindow(currentPage, pageCount)) {
      if (page === "ellipsis") {
        addEllipsis();
      } else {
        addButton(String(page), page, false, page === currentPage);
      }
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
    status.textContent = matches.length
      ? `Showing ${start + 1}-${Math.min(start + pageSize, matches.length)} of ${matches.length} current warnings. Sorted by ${sort.selectedOptions[0].textContent.toLowerCase()}.`
      : "No current warnings match your search or filters.";
    renderPagination(pageCount);
  }

  function showFeedNotes(failedSources) {
    const messages = [];
    if (failedSources.length) {
      messages.push(`Some feeds are unavailable: ${failedSources.join(", ")}.`);
    }
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
  filters.querySelector("[data-clear-filters]")?.addEventListener("click", () => {
    filters.querySelectorAll('input[type="checkbox"]').forEach((input) => { input.checked = false; });
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

  setLoading(true);
  fetchMediaReleaseFeeds(
    fetch,
    (source) => isLocalPreview
      ? `/${source.id}.json`
      : source.endpoint,
  )
    .then(({ feeds, failedSources }) => {
      items = curateFeeds(feeds);
      renderFilters();
      searchAutocomplete.refresh();
      showFeedNotes(failedSources);
      render();
    })
    .catch((error) => {
      results.replaceChildren();
      clearFilterSkeletons();
      status.textContent = "Current warnings are temporarily unavailable. Please try again later.";
      feedNote.hidden = false;
      feedNote.textContent = "No source feeds could be loaded.";
      console.error("Unable to load current warnings", error);
    })
    .finally(() => setLoading(false));
}
