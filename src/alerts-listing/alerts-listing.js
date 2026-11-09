import "./alerts-listing.css";
import { sortAlerts } from "./sorting.mjs";
import { getPageWindow } from "../pagination/page-window.mjs";

const endpoint = "https://cmsexternal.nt.gov.au/securent/_design/listing/alerts-listing/_nocache";
const listing = document.querySelector("[data-alerts-listing]");

if (listing) {
  const search = listing.querySelector("#alerts-search");
  const results = listing.querySelector("[data-alert-results]");
  const status = listing.querySelector("[data-results-status]");
  const pagination = listing.querySelector("[data-alert-pagination]");
  const levelFilters = listing.querySelector("[data-level-filters]");
  const regionFilters = listing.querySelector("[data-region-filters]");
  const topicFilters = listing.querySelector("[data-topic-filters]");
  const locationButton = listing.querySelector("[data-use-location]");
  const filters = listing.querySelector(".alerts-listing__filters");
  const resultsColumn = results.parentElement;
  const row = filters.parentElement;
  const mobile = window.matchMedia("(max-width: 767.98px)");
  const panel = document.createElement("div");
  panel.id = "alerts-filter-panel";
  panel.className = "alerts-listing__filter-panel";
  panel.append(...filters.childNodes);

  const sortField = document.createElement("div");
  sortField.className = "alerts-listing__sort";
  const sortLabel = document.createElement("label");
  sortLabel.htmlFor = "alerts-sort";
  sortLabel.textContent = "Sort by";
  const sort = document.createElement("select");
  sort.id = "alerts-sort";
  sort.name = "sort";
  for (const [value, label] of [["current", "Current order"], ["level", "Warning level"],
    ["updated", "Newest updated"], ["location", "Location A-Z"], ["title", "Title A-Z"]]) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    sort.append(option);
  }
  sortField.append(sortLabel, sort);
  panel.prepend(sortField);

  const filterToggle = document.createElement("button");
  filterToggle.type = "button";
  filterToggle.className = "alerts-listing__filter-toggle";
  filterToggle.setAttribute("aria-controls", panel.id);
  const toggleLabel = document.createElement("span");
  toggleLabel.className = "alerts-listing__filter-toggle-label";
  const sliders = document.createElement("i");
  sliders.className = "fa-light fa-sliders";
  sliders.setAttribute("aria-hidden", "true");
  toggleLabel.append(sliders, document.createTextNode("Filter and sort"));
  const chevron = document.createElement("i");
  chevron.className = "fa-light fa-chevron-right alerts-listing__filter-chevron";
  chevron.setAttribute("aria-hidden", "true");
  filterToggle.append(toggleLabel, chevron);
  filters.append(filterToggle, panel);
  let mobileExpanded = false;
  let data;
  let currentPage = 1;

  function syncFilters() {
    const focused = document.activeElement;
    const expanded = !mobile.matches || mobileExpanded;
    filterToggle.hidden = !mobile.matches;
    filterToggle.setAttribute("aria-expanded", String(expanded));
    if (mobile.matches) row.insertBefore(filters, resultsColumn);
    else row.append(filters);
    panel.hidden = !expanded;
    if (!expanded && panel.contains(focused)) filterToggle.focus();
    else if (focused === filterToggle && filterToggle.hidden) {
      panel.querySelector("input, select")?.focus();
    } else if (filters.contains(focused)) focused.focus();
  }

  filterToggle.addEventListener("click", () => {
    mobileExpanded = !mobileExpanded;
    syncFilters();
  });
  mobile.addEventListener("change", syncFilters);
  syncFilters();

  function isLocalPreview() {
    return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  }

  function slugify(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function titleFor(item) {
    if (item.title && item.title.trim()) return item.title.trim();
    return `${item.emergencyType} ${item.warningLevel} - ${item.location}`;
  }

  function typeLabel(value) {
    const labels = {
      Bushfire: "Bushfires",
      Cyclone: "Cyclones",
      Flooding: "Flooding",
      "Severe storm": "Severe storms",
      Heatwave: "Heatwaves",
    };
    return labels[value] || value;
  }

  function makeFilter(container, name, value, label, count) {
    const wrapper = document.createElement("label");
    wrapper.className = "alerts-listing__filter-option";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = name;
    input.value = value;

    const text = document.createElement("span");
    text.textContent = `${label} (${count})`;

    wrapper.append(input, text);
    container.append(wrapper);
  }

  function renderFilters() {
    levelFilters.replaceChildren();
    regionFilters.replaceChildren();
    topicFilters.replaceChildren();

    const levels = data.facets?.levels || [...new Set(data.items.map((item) => item.warningLevel).filter(Boolean))];
    sortAlerts(levels.map((warningLevel) => ({ warningLevel })), "level", titleFor).forEach(({ warningLevel: level }) => {
      const count = data.items.filter((item) => item.warningLevel === level).length;
      makeFilter(levelFilters, "level", level, level, count);
    });

    const regions = data.facets?.regions || [...new Set(data.items.map((item) => item.region).filter(Boolean))];
    regions.forEach((region) => {
      const count = data.items.filter((item) => item.region === region).length;
      makeFilter(regionFilters, "region", region, region, count);
    });

    const types = data.facets?.types || [...new Set(data.items.map((item) => item.emergencyType).filter(Boolean))];
    types.forEach((type) => {
      const count = data.items.filter((item) => item.emergencyType === type).length;
      makeFilter(topicFilters, "topic", type, typeLabel(type), count);
    });
  }

  function selectedValues(container, name) {
    return [...container.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);
  }

  function filteredItems() {
    const query = search.value.trim().toLocaleLowerCase();
    const levels = selectedValues(levelFilters, "level");
    const regions = selectedValues(regionFilters, "region");
    const topics = selectedValues(topicFilters, "topic");

    return data.items.filter((item) => {
      const searchable = [titleFor(item), item.location, item.region, item.emergencyType, item.warningLevel]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase();
      return (!query || searchable.includes(query)) &&
        (!levels.length || levels.includes(item.warningLevel)) &&
        (!regions.length || regions.includes(item.region)) &&
        (!topics.length || topics.includes(item.emergencyType));
    });
  }

  function safeLink(value) {
    try {
      const url = new URL(value, window.location.origin);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "#";
    } catch {
      return "#";
    }
  }

  function renderCard(item) {
    const card = document.createElement("article");
    card.className = "alerts-listing__card";
    card.dataset.warningLevel = slugify(item.warningLevel || "advice");

    const link = document.createElement("a");
    link.className = "alerts-listing__card-link";
    link.href = safeLink(item.url);

    const title = document.createElement("h2");
    title.className = "alerts-listing__card-title";
    title.textContent = titleFor(item);
    link.append(title);

    if (item.summary && item.summary.trim()) {
      const summary = document.createElement("p");
      summary.className = "alerts-listing__summary";
      summary.textContent = item.summary.trim();
      link.append(summary);
    }

    const location = document.createElement("p");
    location.className = "alerts-listing__location";
    location.textContent = item.region || item.location || "Northern Territory";
    link.append(location);
    card.append(link);
    return card;
  }

  function renderPagination(pageCount) {
    pagination.replaceChildren();
    const list = document.createElement("ul");
    list.className = "pagination__page-list";

    const addButton = (label, page, disabled, current = false) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "pagination__page-button";
      if (label === "Previous" || label === "Next") {
        const icon = document.createElement("i");
        icon.className = `fa-light fa-chevron-${label === "Previous" ? "left" : "right"} pagination__page-icon`;
        icon.setAttribute("aria-hidden", "true");
        if (label === "Previous") {
          button.append(icon, document.createTextNode(label));
        } else {
          button.append(document.createTextNode(label), icon);
        }
      } else {
        button.textContent = label;
      }
      button.dataset.page = String(page);
      button.disabled = disabled;
      if (current) button.setAttribute("aria-current", "page");
      item.append(button);
      list.append(item);
    };

    const addEllipsis = () => {
      const item = document.createElement("li");
      const ellipsis = document.createElement("span");
      ellipsis.className = "pagination__ellipsis";
      ellipsis.setAttribute("aria-hidden", "true");
      ellipsis.textContent = "\u2026";
      item.append(ellipsis);
      list.append(item);
    };

    addButton("Previous", currentPage - 1, currentPage <= 1);
    for (const page of getPageWindow(currentPage, pageCount)) {
      if (page === "ellipsis") {
        addEllipsis();
      } else {
        addButton(String(page), page, false, page === currentPage);
      }
    }
    addButton("Next", currentPage + 1, currentPage >= pageCount);
    pagination.append(list);
  }

  function render() {
    if (!data) return;
    const items = sortAlerts(filteredItems(), sort.value, titleFor);
    const pageSize = Math.max(1, Number(data.pageSize) || 8);
    const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
    currentPage = Math.min(currentPage, pageCount);
    const start = (currentPage - 1) * pageSize;
    const pageItems = items.slice(start, start + pageSize);

    results.replaceChildren(...pageItems.map(renderCard));
    results.setAttribute("aria-busy", "false");
    status.textContent = items.length
      ? `Showing ${start + 1}-${Math.min(start + pageSize, items.length)} of ${items.length} alerts`
      : "No alerts match your search or filters.";
    renderPagination(pageCount);
  }

  async function load() {
    try {
      const url = isLocalPreview()
        ? "/src/alerts-listing/alerts-listing.local.json"
        : listing.dataset.endpoint || endpoint;
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error(`Alert request failed: ${response.status}`);
      const payload = await response.json();
      if (!Array.isArray(payload.items)) throw new Error("Alert response has no items array");
      data = payload;
      renderFilters();
      render();
    } catch (error) {
      results.setAttribute("aria-busy", "false");
      status.textContent = "Alerts are temporarily unavailable. Please try again later.";
      console.error("Unable to load alerts", error);
    }
  }

  search.addEventListener("input", () => {
    currentPage = 1;
    render();
  });

  listing.addEventListener("change", (event) => {
    if (event.target.matches('input[name="level"], input[name="region"], input[name="topic"], select[name="sort"]')) {
      currentPage = 1;
      render();
    }
  });

  pagination.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-page]");
    if (!button || button.disabled) return;
    currentPage = Number(button.dataset.page);
    render();
  });

  locationButton.addEventListener("click", () => {
    status.textContent = "Location-based filtering is not available for this alert listing.";
  });

  load();
}