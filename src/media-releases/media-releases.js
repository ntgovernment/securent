import "./media-releases.css";
import { attachAutocomplete, getAutocompleteCandidates } from "../search/autocomplete.mjs";
import { curateFeeds, filterAndSortNotices, warningLevelOrder } from "./curation.mjs";
import { fetchMediaReleaseFeeds, mediaReleaseSources } from "./feeds.mjs";
import { updatedTimestamp } from "../alerts-listing/sorting.mjs";
import { getPageWindow } from "../pagination/page-window.mjs";
import { awsHazardIconFilename, warningLevelSlug } from "./aws-icons.mjs";

const hazardIcons = import.meta.glob("../../assets/hazard-icons/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
});
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
  const status = listing.querySelector("[data-results-status]");
  const feedNote = listing.querySelector("[data-feed-note]");
  const pagination = listing.querySelector("[data-pagination]");
  const pageSize = 10;
  let items = [];
  let currentPage = 1;

  const loadingContents = [...listing.children];
  const loadingOverlay = document.createElement("div");
  loadingOverlay.className = "media-releases__loading-overlay";
  loadingOverlay.hidden = true;
  loadingOverlay.setAttribute("role", "status");
  const spinner = document.createElement("span");
  spinner.className = "media-releases__loading-spinner";
  spinner.setAttribute("aria-hidden", "true");
  const loadingMessage = document.createElement("span");
  loadingMessage.className = "visually-hidden";
  loadingMessage.textContent = "Loading current warnings...";
  loadingOverlay.append(spinner, loadingMessage);
  listing.append(loadingOverlay);

  function setLoading(loading) {
    listing.classList.toggle("media-releases__listing--loading", loading);
    loadingOverlay.hidden = !loading;
    results.setAttribute("aria-busy", String(loading));
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
      text.textContent = `${value} (${count})`;
      label.append(input, text);
      container.append(label);
    }
  }

  function renderFilters() {
    const sourceNames = mediaReleaseSources.map((source) => source.name);
    renderFilterGroup("source", filters.querySelector("[data-source-filters]"), (item) => item.sources,
      sourceNames, sourceNames);
    renderFilterGroup("region", filters.querySelector("[data-region-filters]"), (item) => item.regions);
    renderFilterGroup("emergencyType", filters.querySelector("[data-type-filters]"), (item) => item.emergencyTypes);
    renderFilterGroup("declaration", filters.querySelector("[data-declaration-filters]"), (item) => item.declarations);
    renderFilterGroup("warningLevel", filters.querySelector("[data-level-filters]"),
      (item) => item.declarations?.length ? [] : [item.warningLevel], warningLevelOrder);
  }

  function safeLink(value) {
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  function formatDateTime(value) {
    const timestamp = updatedTimestamp(value);
    if (timestamp === null) return "";
    return new Intl.DateTimeFormat("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "Australia/Darwin",
    }).format(timestamp);
  }

  function hazardIconFor(item) {
    const filename = awsHazardIconFilename(item.emergencyTypes, item.warningLevel);
    if (!filename) return "";
    const assetUrl = hazardIcons[`../../assets/hazard-icons/${filename}`];
    if (!assetUrl) return "";
    return import.meta.env.DEV ? assetUrl : new URL(assetUrl.slice(1), import.meta.url).href;
  }

  function renderCard(item) {
    const article = document.createElement("article");
    article.className = "media-releases__item";
    article.dataset.warningLevel = warningLevelSlug(item.warningLevel);
    article.dataset.declaration = item.declarations.map((declaration) => declaration.toLowerCase().replace(/\s+/g, "-")).join(" ");
    const url = safeLink(item.url);
    const cardLink = document.createElement(url ? "a" : "div");
    cardLink.className = "media-releases__link";
    if (url) {
      cardLink.href = url;
      cardLink.target = "_blank";
      cardLink.rel = "noopener noreferrer";
    }
    const content = document.createElement("div");
    content.className = "media-releases__content";

    const severity = document.createElement("span");
    severity.className = "media-releases__severity";
    const isDecreasingThreat = item.warningLevel === "Advice"
      && /\bdecreasing[\s_-]+threats?\b/i.test([item.title, item.name].filter(Boolean).join(" "));
    const isGeneralInformation = item.declarations.length
      ? item.declarations.some((declaration) => declaration !== "Planned burn advice")
      : !["Emergency warning", "Watch and act", "Advice"].includes(item.warningLevel) && !isDecreasingThreat;
    if (isGeneralInformation) article.dataset.generalInformation = "true";
    severity.textContent = item.declarations.length
      ? item.declarations.map((declaration) => declaration === "Planned burn advice" ? "Planned burn" : "General information").join(", ")
      : item.warningLevel === "Emergency warning" ? "Emergency"
        : isDecreasingThreat ? "Decreasing threat"
          : ["Advice", "Watch and act"].includes(item.warningLevel) ? item.warningLevel : "General information";

    const title = document.createElement("h2");
    title.className = "media-releases__title";
    title.textContent = item.title;

    const meta = document.createElement("p");
    meta.className = "media-releases__meta";
    const publishedAt = formatDateTime(item.publishedAt);
    if (publishedAt) {
      const dateTime = document.createElement("span");
      dateTime.className = "media-releases__date-time";
      const clock = document.createElement("i");
      clock.className = "fa-light fa-clock";
      clock.setAttribute("aria-hidden", "true");
      dateTime.append(clock, document.createTextNode(publishedAt));
      meta.append(dateTime);
    }

    const region = document.createElement("p");
    region.className = "media-releases__classification media-releases__region";
    const mapPin = document.createElement("i");
    mapPin.className = "fa-light fa-location-dot";
    mapPin.setAttribute("aria-hidden", "true");
    const regionLabel = document.createElement("span");
    regionLabel.textContent = `Region: ${item.regions.join(", ")}`;
    region.append(mapPin, regionLabel);

    const iconUrl = hazardIconFor(item);
    if (iconUrl) {
      const icon = document.createElement("img");
      icon.className = "media-releases__hazard-icon";
      icon.src = iconUrl;
      icon.alt = "";
      article.classList.add("media-releases__item--with-icon");
      cardLink.append(icon);
    }

    content.append(severity, title);
    if (meta.hasChildNodes()) content.append(meta);
    content.append(region);
    if (url) {
      const moreInformation = document.createElement("span");
      moreInformation.className = "media-releases__more-information";
      const label = document.createElement("span");
      label.className = "media-releases__more-information-label";
      label.textContent = "More information";
      const arrow = document.createElement("i");
      arrow.className = "fa-light fa-arrow-right";
      arrow.setAttribute("aria-hidden", "true");
      moreInformation.append(label, arrow);
      content.append(moreInformation);
    }
    cardLink.append(content);
    article.append(cardLink);
    return article;
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
      status.textContent = "Current warnings are temporarily unavailable. Please try again later.";
      feedNote.hidden = false;
      feedNote.textContent = "No source feeds could be loaded.";
      console.error("Unable to load current warnings", error);
    })
    .finally(() => setLoading(false));
}
