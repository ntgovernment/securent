import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Window } from "happy-dom";

const html = await readFile(new URL("../../media-releases.html", import.meta.url), "utf8");
const css = await readFile(new URL("../../dist/media-releases.css", import.meta.url), "utf8");
const alertsCss = await readFile(new URL("../../dist/alerts-listing.css", import.meta.url), "utf8");
const themeCss = await readFile(new URL("../../dist/theme.css", import.meta.url), "utf8");
const notice = {
  Name: "AWS Flood Advice - Daly River",
  Subject: "Flood Advice - Daly River - Stay Informed",
  FromName: "NT Fire and Emergency Services",
  SentDate: "2026-11-08 09:00:00",
  CampaignID: "campaign-1",
  WebVersionURL: "http://createsend.com/campaign-1",
};

test("renders declaration-only cards with their accent colors and checkbox styles", async () => {
  const window = new Window({ url: "http://localhost/media-releases.html" });
  window.document.write(html);
  const originals = { window: globalThis.window, document: globalThis.document, fetch: globalThis.fetch };
  const originalDateNow = Date.now;
  const originalSetInterval = window.setInterval;
  const intervalCallbacks = [];
  window.setInterval = (callback, delay) => {
    intervalCallbacks.push({ callback, delay });
    return intervalCallbacks.length;
  };
  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => [
      { ...notice, CampaignID: "planned-burn", Name: "Planned burn advice - Darwin", Subject: "Planned burn advice - Darwin" },
      { ...notice, CampaignID: "fire-ban", Name: "Fire ban declaration - Darwin", Subject: "Fire ban declaration - Darwin" },
      { ...notice, CampaignID: "boil-water", Name: "Boil water notice - East Arnhem", Subject: "Boil water notice - East Arnhem" },
      { ...notice, CampaignID: "unknown-warning-level", Name: "Cyclone warning - Darwin", Subject: "Cyclone warning - Darwin" },
      { ...notice, CampaignID: "ordinary", Name: "Flood Advice - Daly River", Subject: "Flood Advice - Daly River" },
      { ...notice, CampaignID: "emergency", Name: "Emergency warning - Cyclone - Darwin", Subject: "Emergency warning - Cyclone - Darwin" },
      { ...notice, CampaignID: "watch-act", Name: "Severe storm watch and act - Darwin", Subject: "Severe storm watch and act - Darwin" },
      { ...notice, CampaignID: "decreasing-threat", Name: "Flood Advice - Decreasing threat - Katherine", Subject: "Flood Advice - Decreasing threat - Katherine" },
      { ...notice, CampaignID: "heatwave", Name: "Heatwave advice - Alice Springs", Subject: "Heatwave advice - Alice Springs" },
      { ...notice, CampaignID: "unknown-type", Name: "Advice - Remote community", Subject: "Advice - Remote community" },
    ],
  });

  try {
    await import("../../dist/media-releases.js?declaration-card-test");
    const listing = window.document.querySelector("[data-media-releases]");
    await new Promise((resolve) => setImmediate(resolve));

    const cards = [...listing.querySelectorAll(".media-releases__item")];
    const plannedBurn = cards.find((card) => card.dataset.declaration === "planned-burn-advice");
    const fireBan = cards.find((card) => card.dataset.declaration === "fire-ban-declaration");
    const boilWater = cards.find((card) => card.dataset.declaration === "boil-water-notice");
    const ordinary = cards.find((card) => card.dataset.declaration === "");
    const emergency = cards.find((card) => card.querySelector(".media-releases__title")?.textContent.includes("Emergency warning"));
    const watchAct = cards.find((card) => card.dataset.warningLevel === "watch_act");
    const decreasingThreat = cards.find((card) => card.querySelector(".media-releases__title")?.textContent.includes("Decreasing threat"));
    const unknownWarning = cards.find((card) => card.dataset.warningLevel === "not-identified" && card.dataset.declaration === "");
    assert.ok(plannedBurn);
    assert.ok(fireBan);
    assert.ok(boilWater);
    assert.ok(ordinary);
    assert.ok(emergency);
    assert.ok(watchAct);
    assert.ok(decreasingThreat);
    assert.ok(unknownWarning);
    for (const card of cards) {
      const cardLink = card.querySelector(":scope > .media-releases__link");
      assert.equal(cardLink.tagName, "A");
      assert.equal(card.querySelectorAll("a").length, 1);
      assert.equal(cardLink.target, "_blank");
      assert.equal(cardLink.rel, "noopener noreferrer");
      if (card.classList.contains("media-releases__item--formatted")) {
        assert.equal(cardLink.querySelector(".media-releases__more-information"), null);
      } else {
        assert.equal(cardLink.querySelector(".media-releases__more-information").textContent, "More information");
        assert.equal(cardLink.querySelector(".media-releases__more-information-label").textContent, "More information");
        assert.equal(cardLink.querySelector(".media-releases__more-information i").getAttribute("aria-hidden"), "true");
      }
      assert.ok(cardLink.contains(cardLink.querySelector(".media-releases__title")));
      assert.equal(card.querySelector(".media-releases__agency, .media-releases__source, .media-releases__hazard"), null);
    }
    const timeLabel = emergency.querySelector("time[data-time]");
    assert.ok(timeLabel);
    assert.equal(timeLabel.dateTime, timeLabel.dataset.time);
    assert.ok(Number.isFinite(Date.parse(timeLabel.dataset.time)));
    assert.equal(intervalCallbacks.length, 1);
    assert.equal(intervalCallbacks[0].delay, 60_000);
    const publishedTimestamp = Date.parse(timeLabel.dataset.time);
    let now = publishedTimestamp + 60_000;
    Date.now = () => now;
    intervalCallbacks[0].callback();
    assert.equal(timeLabel.textContent, "1 minute ago");
    now = publishedTimestamp + 2 * 60_000;
    intervalCallbacks[0].callback();
    assert.equal(timeLabel.textContent, "2 minutes ago");
    now = publishedTimestamp + 60 * 60_000;
    intervalCallbacks[0].callback();
    assert.equal(timeLabel.textContent, "1 hour ago");
    now = publishedTimestamp + 24 * 60 * 60_000;
    intervalCallbacks[0].callback();
    assert.equal(timeLabel.textContent, "1 day ago");
    now = publishedTimestamp + 2 * 24 * 60 * 60_000;
    intervalCallbacks[0].callback();
    assert.equal(timeLabel.textContent, "2 days ago");
    for (const card of [emergency, watchAct, decreasingThreat]) {
      assert.ok(card.classList.contains("media-releases__item--formatted"));
      assert.equal(card.querySelector(".media-releases__severity"), null);
      assert.ok(card.querySelector(".media-releases__hazard-icon"));
      assert.deepEqual(
        [...card.querySelector(".media-releases__content").children].map((element) => element.className),
        ["media-releases__meta", "media-releases__title", "media-releases__classification media-releases__region"],
      );
    }
    assert.equal(decreasingThreat.dataset.warningLevel, "advice");
    assert.ok(emergency.querySelector(".media-releases__date-time"));
    assert.match(emergency.querySelector(".media-releases__region").textContent, /Region: Greater Darwin/);
    assert.ok(emergency.querySelector(".media-releases__region .fa-location-dot"));
    assert.equal(emergency.querySelector(".media-releases__region .visually-hidden").textContent, "Region: ");
    const unknownRegionCard = cards.find((card) => card.querySelector(".media-releases__title")?.textContent === "Advice - Remote community");
    assert.ok(unknownRegionCard);
    assert.equal(unknownRegionCard.querySelector(".media-releases__region"), null);
    assert.ok(emergency.querySelector(".media-releases__hazard-icon"));
    assert.ok(plannedBurn.classList.contains("media-releases__item--formatted"));
    assert.ok(plannedBurn.classList.contains("media-releases__item--planned-burn"));
    assert.equal(plannedBurn.querySelector(".media-releases__severity"), null);
    assert.equal(plannedBurn.querySelector(".media-releases__notice-icon").getAttribute("aria-hidden"), "true");
    assert.deepEqual(
      [...plannedBurn.querySelector(".media-releases__content").children].map((element) => element.className),
      ["media-releases__meta", "media-releases__title", "media-releases__classification media-releases__region"],
    );
    assert.equal(plannedBurn.querySelector(".media-releases__date-time i"), null);
    const plannedBurnLocationIcon = plannedBurn.querySelector(".media-releases__region i");
    assert.ok(plannedBurnLocationIcon.classList.contains("fa-location-dot"));
    assert.equal(plannedBurnLocationIcon.getAttribute("aria-hidden"), "true");
    assert.equal(plannedBurn.querySelector(".media-releases__hazard-icon"), null);
    assert.match(plannedBurn.querySelector(".media-releases__region").textContent, /Region: Greater Darwin/);
    assert.equal(plannedBurn.querySelector(".media-releases__region .visually-hidden").textContent, "Region: ");
    assert.equal(fireBan.dataset.declaration, "fire-ban-declaration");
    assert.equal(fireBan.dataset.generalInformation, "true");
    assert.equal(boilWater.dataset.generalInformation, "true");
    assert.equal(unknownWarning.dataset.generalInformation, "true");
    for (const card of [fireBan, boilWater, unknownWarning, unknownRegionCard]) {
      assert.ok(card.classList.contains("media-releases__item--formatted"));
      assert.ok(card.classList.contains("media-releases__item--general-information"));
      assert.equal(card.querySelector(".media-releases__severity"), null);
      assert.ok(card.querySelector(".media-releases__notice-icon").classList.contains("fa-triangle-exclamation"));
      assert.equal(card.querySelector(".media-releases__notice-icon").getAttribute("aria-hidden"), "true");
    }
    assert.ok(fireBan.querySelector(".media-releases__region .fa-location-dot"));
    const incidentNoticeFilters = listing.querySelector("[data-type-filters]");
    assert.equal(incidentNoticeFilters.parentElement.querySelector("legend").textContent, "Incident or notice type");
    const fireBanFilter = incidentNoticeFilters.querySelector('input[name="declaration"][value="Fire ban declaration"]');
    assert.ok(fireBanFilter);
    assert.equal(fireBanFilter.parentElement.textContent, "Fire ban notices (1)");
    assert.ok(incidentNoticeFilters.querySelector('input[name="declaration"][value="Planned burn advice"]'));
    assert.ok(incidentNoticeFilters.querySelector('input[name="declaration"][value="Boil water notice"]'));
    assert.ok(incidentNoticeFilters.querySelector('input[name="emergencyType"][value="Flooding"]'));
    const unknownTypeFilter = incidentNoticeFilters.querySelector('input[name="emergencyType"][value="Not identified"]');
    assert.ok(unknownTypeFilter);
    assert.equal(unknownTypeFilter.parentElement.textContent, "Other (1)");
    const incidentOptions = [...incidentNoticeFilters.querySelectorAll(".media-releases__filter")];
    assert.equal(incidentOptions.length, 8);
    assert.equal(incidentOptions.at(-1).textContent, "Other (1)");
    assert.equal(incidentOptions.filter((option) => option.hidden).length, 2);
    const expandFilters = incidentNoticeFilters.querySelector("[data-expand-filters]");
    assert.equal(expandFilters.textContent, "Show all (2)");
    assert.equal(expandFilters.getAttribute("aria-expanded"), "false");
    expandFilters.click();
    assert.equal(incidentOptions.filter((option) => option.hidden).length, 0);
    assert.equal(expandFilters.textContent, "Show less");
    assert.equal(expandFilters.getAttribute("aria-expanded"), "true");
    expandFilters.click();
    assert.equal(incidentOptions.filter((option) => option.hidden).length, 2);
    assert.equal(expandFilters.textContent, "Show all (2)");
    assert.equal(listing.querySelector("[data-declaration-filters]"), null);

    fireBanFilter.checked = true;
    fireBanFilter.dispatchEvent(new window.Event("change", { bubbles: true }));
    assert.equal(listing.querySelectorAll("[data-results] .media-releases__item").length, 1);
    assert.equal(listing.querySelector("[data-results] .media-releases__item").dataset.declaration, "fire-ban-declaration");
    fireBanFilter.checked = false;
    fireBanFilter.dispatchEvent(new window.Event("change", { bubbles: true }));
    const unknownRegion = listing.querySelector('[data-region-filters] input[value="Not identified"]');
    assert.ok(unknownRegion);
    assert.equal(unknownRegion.parentElement.textContent, "Other (1)");
    const unknownWarningLevel = listing.querySelector('[data-level-filters] input[value="Not identified"]');
    assert.ok(unknownWarningLevel);
    assert.equal(unknownWarningLevel.parentElement.textContent, "Other (1)");

    unknownWarningLevel.checked = true;
    unknownWarningLevel.dispatchEvent(new window.Event("change", { bubbles: true }));
    const filteredCards = [...listing.querySelectorAll("[data-results] .media-releases__item")];
    assert.equal(filteredCards.length, 1);
    assert.equal(filteredCards[0].dataset.declaration, "");
    assert.match(filteredCards[0].textContent, /Cyclone warning - Darwin/);

    const globalSelectStyles = themeCss.match(/(?:^|})select,\.form-select\{([^}]*)\}/)?.[1];
    assert.ok(globalSelectStyles);
    assert.match(globalSelectStyles, /appearance:none/);
    assert.match(globalSelectStyles, /background-image:url\("data:image\/svg\+xml,/);
    assert.match(globalSelectStyles, /background-position:right 16px center/);
    assert.match(globalSelectStyles, /background-size:16px 10px/);
    const mediaSelectBase = css.match(/\.media-releases__search input,\.media-releases__sort select\{([^}]*)\}/)?.[1];
    const alertsSelectBase = alertsCss.match(/\.alerts-listing__sort select\{([^}]*)\}/)?.[1];
    assert.ok(mediaSelectBase);
    assert.ok(alertsSelectBase);
    assert.match(mediaSelectBase, /background-color:#fff/);
    assert.match(alertsSelectBase, /background-color:#fff/);
    assert.match(css, /\.media-releases__search input:hover:not\(:focus\):not\(:active\):placeholder-shown,\.media-releases__sort select:hover:not\(:focus\):not\(:active\)\{background-color:#ecf0f0\}/);

    assert.match(css, /\.media-releases__item--formatted\.media-releases__item--planned-burn\{--media-releases-accent:\s*#865aa5\}/);
    assert.match(css, /\.media-releases__item--formatted\.media-releases__item--general-information\{--media-releases-accent:\s*#343741\}/);
    assert.match(css, /\.media-releases__item--formatted \.media-releases__link\{grid-template-columns:48px minmax\(0,1fr\)\}/);
    assert.match(css, /\.media-releases__notice-icon\{[^}]*color:var\(--media-releases-accent\);[^}]*font-size:48px/);
    assert.match(css, /\.media-releases__item--formatted \.media-releases__meta\{[^}]*font-size:14px;[^}]*line-height:20px/);
    assert.match(css, /\.media-releases__item--formatted \.media-releases__region\{[^}]*font-size:16px;[^}]*line-height:24px/);
    assert.match(css, /\.media-releases__item--formatted \.media-releases__hazard-icon\{width:48px;height:48px\}/);
    assert.match(css, /\.media-releases__item\[data-declaration~=fire-ban-declaration\][^{]*\{--media-releases-accent:\s*#1f1f5f\}/);
    assert.match(css, /\.media-releases__item\[data-general-information=true\][^{]*\{--media-releases-accent:\s*#1f1f5f\}/);
    assert.match(css, /\.media-releases__item\[data-general-information=true\] \.media-releases__severity\{color:#fff\}/);
    assert.match(css, /\.media-releases__item\[data-warning-level=advice\]\{--media-releases-accent:\s*#fadf31\}/);
    assert.match(css, /\.media-releases__item\[data-warning-level=advice\] \.media-releases__severity\{color:#716309\}/);
    assert.match(css, /\.media-releases__item:hover\{box-shadow:0 4px 16px #0f0f2f26\}/);
    assert.match(css, /\.media-releases__item\[data-warning-level=watch_act\] \.media-releases__severity/);
    assert.doesNotMatch(css, /\.media-releases__item\[data-declaration\] \.media-releases__severity/);
    assert.match(css, /\.media-releases__item\{[^}]*border-left:4px solid var\(--media-releases-accent\)/);
    assert.match(css, /\.media-releases__link:hover \.media-releases__more-information-label\{text-decoration:underline\}/);
    assert.match(css, /\.media-releases__link:hover \.media-releases__more-information i\{transform:translate(?:X\(3px\)|\(3px\))\}/);
    assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    assert.match(css, /\.media-releases__item,\.media-releases__item \*\{transition:none\}/);
    assert.match(css, /\.media-releases__item>\.media-releases__link:hover\{padding-bottom:24px\}/);
    assert.match(css, /\.media-releases__link:focus-visible\{outline:3px solid #267e82/);
    assert.match(css, /\.media-releases__item--with-icon \.media-releases__link\{grid-template-columns:79px minmax\(0,1fr\)\}/);
    const checkboxBoxStyle = css.match(/\.media-releases__filter input:before\{([^}]*)\}/)?.[1];
    assert.ok(checkboxBoxStyle);
    assert.match(checkboxBoxStyle, /border:2px solid #1f1e27/);
    assert.match(checkboxBoxStyle, /background:#fff/);
    assert.doesNotMatch(checkboxBoxStyle, /border-radius/);
    assert.match(css, /\.media-releases__filter input:not\(:checked\):hover:before\{background:#ecf0f0\}/);
    assert.match(css, /\.media-releases__filter input:checked:before\{border-color:#174c4e;background:#174c4e\}/);
    assert.match(css, /\.media-releases__filter input:focus-visible\s*\{/);
  } finally {
    Date.now = originalDateNow;
    window.setInterval = originalSetInterval;
    Object.assign(globalThis, originals);
    await window.happyDOM.close();
  }
});

for (const scenario of ["populated", "empty", "partial failure", "total failure", "render failure"]) {
  test(`loading skeletons clear after ${scenario}`, async () => {
    const window = new Window({ url: "http://localhost/media-releases.html" });
    window.document.write(html);
    const originals = { window: globalThis.window, document: globalThis.document, fetch: globalThis.fetch };
    const originalConsoleError = console.error;
    const errors = [];
    const requests = [];
    globalThis.window = window;
    globalThis.document = window.document;
    globalThis.fetch = () => new Promise((resolve, reject) => requests.push({ resolve, reject }));
    console.error = (...args) => {
      if (args[0] === "Unable to load current warnings") errors.push(args);
      else originalConsoleError(...args);
    };

    try {
      await import(`../../dist/media-releases.js?loading-test=${encodeURIComponent(scenario)}`);
      const listing = window.document.querySelector("[data-media-releases]");
      const loadingStatus = listing.querySelector("[data-loading-status]");
      const search = listing.querySelector(".media-releases__search");
      const layout = listing.querySelector(".media-releases__layout");
      const results = listing.querySelector("[data-results]");
      const filterSkeletonCounts = [
        ["[data-level-filters]", 3],
        ["[data-type-filters]", 6],
        ["[data-region-filters]", 4],
        ["[data-source-filters]", 3],
      ];
      assert.equal(requests.length, 3);
      assert.equal(loadingStatus.getAttribute("role"), "status");
      assert.equal(loadingStatus.getAttribute("aria-live"), "polite");
      assert.equal(loadingStatus.textContent, "Loading current warnings...");
      assert.equal(search.inert, true);
      assert.equal(layout.inert, true);
      assert.equal(loadingStatus.inert, false);
      assert.equal(window.document.querySelector("header").inert, false);
      assert.equal(window.document.querySelector("footer").inert, false);
      assert.equal(results.getAttribute("aria-busy"), "true");
      assert.equal(results.querySelectorAll('.media-releases__skeleton[aria-hidden="true"]').length, 10);
      assert.equal(results.querySelectorAll(".media-releases__skeleton-block").length, 50);
      const firstSkeleton = results.querySelector(".media-releases__skeleton");
      assert.deepEqual([...firstSkeleton.children].map((element) => element.className), [
        "media-releases__skeleton-block media-releases__skeleton-icon",
        "media-releases__skeleton-content",
      ]);
      assert.deepEqual(
        [...firstSkeleton.querySelector(".media-releases__skeleton-content").children].map((element) => element.className),
        [
          "media-releases__skeleton-block media-releases__skeleton-meta",
          "media-releases__skeleton-block media-releases__skeleton-title",
          "media-releases__skeleton-block media-releases__skeleton-title-short",
          "media-releases__skeleton-block media-releases__skeleton-region",
        ],
      );
      for (const [selector, count] of filterSkeletonCounts) {
        const container = listing.querySelector(selector);
        const placeholders = container.querySelectorAll(".media-releases__filter-skeleton-row");
        assert.equal(placeholders.length, count);
        assert.equal(container.querySelectorAll("input[type=checkbox]").length, 0);
        assert.ok([...placeholders].every((placeholder) => placeholder.getAttribute("aria-hidden") === "true"));
      }

      if (scenario === "render failure") {
        const replaceResults = results.replaceChildren.bind(results);
        results.replaceChildren = (...children) => {
          if (children.length) throw new Error("Render failed");
          replaceResults();
        };
      }
      requests.forEach((request, index) => {
        if (scenario === "total failure" || (scenario === "partial failure" && index === 0)) {
          request.reject(new Error("Feed offline"));
        } else {
          request.resolve({ ok: true, json: async () => scenario === "empty" ? [] : [notice] });
        }
      });
      await new Promise((resolve) => setImmediate(resolve));

      assert.equal(loadingStatus.textContent, "");
      assert.equal(search.inert, false);
      assert.equal(layout.inert, false);
      assert.equal(results.getAttribute("aria-busy"), "false");
      const failed = ["total failure", "render failure"].includes(scenario);
      assert.equal(errors.length, failed ? 1 : 0, errors.flat().map(String).join("\n"));
      assert.equal(results.children.length, failed || scenario === "empty" ? 0 : 1);
      assert.equal(results.querySelectorAll(".media-releases__skeleton").length, 0);
      assert.equal(listing.querySelectorAll(".media-releases__filter-skeleton-row").length, 0);
      assert.equal(listing.querySelector("[data-feed-note]").hidden, !failed && scenario !== "partial failure");
      if (failed) {
        assert.match(listing.querySelector("[data-results-status]").textContent, /temporarily unavailable/);
      } else {
        listing.querySelector("[data-search]").dispatchEvent(new window.Event("input"));
        assert.equal(results.querySelectorAll(".media-releases__skeleton").length, 0);
      }
    } finally {
      Object.assign(globalThis, originals);
      console.error = originalConsoleError;
      await window.happyDOM.close();
    }
  });
}

for (const scenario of ["latest three", "production endpoint", "fewer than three", "missing icon", "unknown region", "empty", "invalid response", "http failure", "total failure"]) {
  test(`compact listing handles ${scenario}`, async () => {
    const window = new Window({ url: scenario === "production endpoint" ? "https://cmsexternal.nt.gov.au/" : "http://localhost/" });
    window.document.write(`<section data-latest-media-releases>
      <p data-results-status role="status"></p>
      <p data-feed-note hidden></p>
      <div class="media-releases__results" data-results></div>
    </section>`);
    const originals = { window: globalThis.window, document: globalThis.document, fetch: globalThis.fetch };
    const originalConsoleError = console.error;
    const originalSetInterval = window.setInterval;
    const intervalCallbacks = [];
    window.setInterval = (callback, delay) => {
      intervalCallbacks.push({ callback, delay });
      return intervalCallbacks.length;
    };
    globalThis.window = window;
    globalThis.document = window.document;
    const requests = [];
    globalThis.fetch = (url, options) => new Promise((resolve, reject) => requests.push({ url, options, resolve, reject }));
    console.error = () => {};

    try {
      await import(`../../dist/latest-media-releases.js?test=${encodeURIComponent(scenario)}`);
      const listing = window.document.querySelector("[data-latest-media-releases]");
      const results = listing.querySelector("[data-results]");
      assert.equal(intervalCallbacks.length, 1);
      assert.equal(intervalCallbacks[0].delay, 60_000);
      assert.equal(results.getAttribute("aria-busy"), "true");
      assert.equal(results.querySelectorAll('.media-releases__skeleton[aria-hidden="true"]').length, 3);
      assert.equal(results.querySelectorAll(".media-releases__skeleton-block").length, 21);
      assert.ok(results.querySelector(".media-releases__skeleton--compact"));
      assert.equal(listing.querySelector("[data-results-status]").textContent, "Loading current warnings...");
      assert.ok(listing.querySelector("[data-results-status]").classList.contains("media-releases__status--loading"));
      assert.equal(requests.length, 1);
      assert.equal(requests[0].url, scenario === "production endpoint"
        ? "https://cmsexternal.nt.gov.au/securent/_design/integrations/campaign-monitor"
        : "/api/media-releases/latest");
      const records = [1, 4, 2, 3].map((day) => ({
        ...notice,
        CampaignID: `campaign-${day}`,
        Subject: `Flood Advice - Daly River - ${day}`,
        SentDate: `2026-11-0${day} 09:00:00`,
      }));
      requests.forEach((request) => {
        if (scenario === "total failure") {
          request.reject(new Error("Feed offline"));
        } else if (scenario === "http failure") {
          request.resolve({ ok: false, status: 503 });
        } else {
          const items = scenario === "empty" ? [{ ...notice, Name: "Awards ceremony", Subject: "Awards ceremony" }]
            : scenario === "fewer than three" ? records.slice(0, 2)
            : scenario === "missing icon" ? [{ ...notice, Subject: "Fire ban declaration - Darwin" }]
            : scenario === "unknown region" ? [{ ...notice, Name: "Advice - Remote community", Subject: "Advice - Remote community" }]
            : scenario === "invalid response" ? { error: "Invalid feed" }
            : [...records, records[1], { ...notice, CampaignID: "news", Name: "Awards ceremony", Subject: "Awards ceremony" }];
          request.resolve({ ok: true, json: async () => items });
        }
      });
      await new Promise((resolve) => setImmediate(resolve));

      const cards = [...results.querySelectorAll(".media-releases__item")];
      const expected = ["empty", "total failure", "http failure", "invalid response"].includes(scenario) ? 0
        : ["missing icon", "unknown region"].includes(scenario) ? 1 : scenario === "fewer than three" ? 2 : 3;
      assert.equal(cards.length, expected);
      assert.equal(results.getAttribute("aria-busy"), "false");
      assert.equal(results.querySelectorAll(".media-releases__skeleton").length, 0);
      assert.equal(listing.querySelector("[data-results-status]").classList.contains("media-releases__status--loading"), false);
      assert.equal(listing.querySelector("[data-feed-note]").hidden, !["invalid response", "http failure", "total failure"].includes(scenario));
      if (expected === 3) {
        assert.deepEqual(cards.map((card) => card.querySelector("h2").textContent), [
          "Flood Advice - Daly River - 4", "Flood Advice - Daly River - 3", "Flood Advice - Daly River - 2",
        ]);
      }
      if (cards.length) {
        const timeLabel = cards[0].querySelector("time[data-time]");
        assert.ok(timeLabel);
        assert.equal(timeLabel.dateTime, timeLabel.dataset.time);
        const heading = cards[0].querySelector(".media-releases__card-heading");
        assert.ok(heading.querySelector(".media-releases__severity"));
        if (["missing icon", "unknown region"].includes(scenario)) assert.equal(heading.querySelector("img"), null);
        else assert.match(heading.querySelector("img").src, /\/SecureNT_files\/flood-advice\.webp$/);
        if (scenario === "unknown region") assert.equal(cards[0].querySelector(".media-releases__region"), null);
        else assert.ok(cards[0].querySelector(".media-releases__region"));
        assert.equal(cards[0].querySelector(".media-releases__link").rel, "noopener noreferrer");
      }
      if (scenario === "empty") assert.match(listing.querySelector("[data-results-status]").textContent, /no current warnings/i);
      if (["invalid response", "http failure", "total failure"].includes(scenario)) assert.match(listing.querySelector("[data-results-status]").textContent, /temporarily unavailable/i);
    } finally {
      window.setInterval = originalSetInterval;
      Object.assign(globalThis, originals);
      console.error = originalConsoleError;
      await window.happyDOM.close();
    }
  });
}