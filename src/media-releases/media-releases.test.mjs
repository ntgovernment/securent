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
      assert.equal(cardLink.querySelector(".media-releases__more-information").textContent, "More information");
      assert.equal(cardLink.querySelector(".media-releases__more-information-label").textContent, "More information");
      assert.equal(cardLink.querySelector(".media-releases__more-information i").getAttribute("aria-hidden"), "true");
      assert.ok(cardLink.contains(cardLink.querySelector(".media-releases__title")));
      assert.equal(card.querySelector(".media-releases__agency, .media-releases__source, .media-releases__hazard"), null);
    }
    assert.equal(emergency.querySelector(".media-releases__severity").textContent, "Emergency");
    assert.equal(watchAct.querySelector(".media-releases__severity").textContent, "Watch and act");
    assert.equal(decreasingThreat.dataset.warningLevel, "advice");
    assert.equal(decreasingThreat.querySelector(".media-releases__severity").textContent, "Decreasing threat");
    assert.ok(emergency.querySelector(".media-releases__date-time"));
    assert.match(emergency.querySelector(".media-releases__region").textContent, /Region: Greater Darwin/);
    assert.ok(emergency.querySelector(".media-releases__hazard-icon"));
    assert.equal(plannedBurn.querySelector(".media-releases__severity").textContent, "Planned burn");
    assert.equal(plannedBurn.querySelector(".media-releases__hazard-icon"), null);
    assert.equal(fireBan.querySelector(".media-releases__severity").textContent, "Fire ban notice");
    assert.equal(fireBan.dataset.declaration, "fire-ban-declaration");
    assert.equal(boilWater.querySelector(".media-releases__severity").textContent, "General information");
    assert.equal(fireBan.dataset.generalInformation, "true");
    assert.equal(boilWater.dataset.generalInformation, "true");
    assert.equal(unknownWarning.querySelector(".media-releases__severity").textContent, "General information");
    assert.equal(unknownWarning.dataset.generalInformation, "true");
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

    assert.match(css, /\.media-releases__item\[data-declaration~=planned-burn-advice\]\{--media-releases-accent:\s*#865aa5\}/);
    assert.match(css, /\.media-releases__item\[data-declaration~=fire-ban-declaration\][^{]*\{--media-releases-accent:\s*#1f1f5f\}/);
    assert.match(css, /\.media-releases__item\[data-general-information=true\][^{]*\{--media-releases-accent:\s*#1f1f5f\}/);
    assert.match(css, /\.media-releases__item\[data-general-information=true\] \.media-releases__severity\{color:#fff\}/);
    assert.match(css, /\.media-releases__item\[data-warning-level=advice\]\{--media-releases-accent:\s*#fadf31\}/);
    assert.match(css, /\.media-releases__item\[data-warning-level=advice\] \.media-releases__severity\{color:#716309\}/);
    assert.match(css, /\.media-releases__item:hover\{box-shadow:0 4px 16px #0f0f2f26\}/);
    assert.match(css, /\.media-releases__item\[data-declaration~=planned-burn-advice\] \.media-releases__severity/);
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
    Object.assign(globalThis, originals);
    await window.happyDOM.close();
  }
});

for (const scenario of ["populated", "empty", "partial failure", "total failure", "render failure"]) {
  test(`loading overlay clears after ${scenario}`, async () => {
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
      const overlay = listing.querySelector(".media-releases__loading-overlay");
      const search = listing.querySelector(".media-releases__search");
      const layout = listing.querySelector(".media-releases__layout");
      const results = listing.querySelector("[data-results]");
      assert.equal(requests.length, 3);
      assert.equal(overlay.hidden, false);
      assert.equal(overlay.getAttribute("role"), "status");
      assert.equal(overlay.querySelector(".media-releases__loading-spinner").getAttribute("aria-hidden"), "true");
      assert.equal(search.inert, true);
      assert.equal(layout.inert, true);
      assert.equal(overlay.inert, false);
      assert.equal(window.document.querySelector("header").inert, false);
      assert.equal(window.document.querySelector("footer").inert, false);
      assert.equal(results.getAttribute("aria-busy"), "true");

      if (scenario === "render failure") {
        results.replaceChildren = () => { throw new Error("Render failed"); };
      }
      requests.forEach((request, index) => {
        if (scenario === "total failure" || (scenario === "partial failure" && index === 0)) {
          request.reject(new Error("Feed offline"));
        } else {
          request.resolve({ ok: true, json: async () => scenario === "empty" ? [] : [notice] });
        }
      });
      await new Promise((resolve) => setImmediate(resolve));

      assert.equal(overlay.hidden, true);
      assert.equal(listing.classList.contains("media-releases__listing--loading"), false);
      assert.equal(search.inert, false);
      assert.equal(layout.inert, false);
      assert.equal(results.getAttribute("aria-busy"), "false");
      const failed = ["total failure", "render failure"].includes(scenario);
      assert.equal(errors.length, failed ? 1 : 0, errors.flat().map(String).join("\n"));
      assert.equal(results.children.length, failed || scenario === "empty" ? 0 : 1);
      assert.equal(listing.querySelector("[data-feed-note]").hidden, !failed && scenario !== "partial failure");
      if (failed) {
        assert.match(listing.querySelector("[data-results-status]").textContent, /temporarily unavailable/);
      } else {
        listing.querySelector("[data-search]").dispatchEvent(new window.Event("input"));
        assert.equal(overlay.hidden, true);
      }
    } finally {
      Object.assign(globalThis, originals);
      console.error = originalConsoleError;
      await window.happyDOM.close();
    }
  });
}