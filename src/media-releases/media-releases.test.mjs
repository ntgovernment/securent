import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Window } from "happy-dom";

const html = await readFile(new URL("../../media-releases.html", import.meta.url), "utf8");
const css = await readFile(new URL("../../dist/media-releases.css", import.meta.url), "utf8");
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
    assert.ok(plannedBurn);
    assert.ok(fireBan);
    assert.ok(boilWater);
    assert.ok(ordinary);
    assert.equal(plannedBurn.querySelector(".media-releases__hazard"), null);
    assert.equal(fireBan.querySelector(".media-releases__hazard"), null);
    assert.equal(boilWater.querySelector(".media-releases__hazard"), null);
    assert.ok(ordinary.querySelector(".media-releases__hazard"));
    assert.ok([...listing.querySelectorAll('[data-declaration-filters] input')]
      .some((input) => input.value === "Planned burn advice"));
    assert.ok([...listing.querySelectorAll('[data-declaration-filters] input')]
      .some((input) => input.value === "Fire ban declaration"));
    assert.ok([...listing.querySelectorAll('[data-declaration-filters] input')]
      .some((input) => input.value === "Boil water notice"));
    assert.equal(listing.querySelector('[data-type-filters] input[value="Not identified"]'), null);
    const unknownWarningLevel = listing.querySelector('[data-level-filters] input[value="Not identified"]');
    assert.ok(unknownWarningLevel);
    assert.equal(unknownWarningLevel.parentElement.textContent, "Not identified (1)");

    unknownWarningLevel.checked = true;
    unknownWarningLevel.dispatchEvent(new window.Event("change", { bubbles: true }));
    const filteredCards = [...listing.querySelectorAll("[data-results] .media-releases__item")];
    assert.equal(filteredCards.length, 1);
    assert.equal(filteredCards[0].dataset.declaration, "");
    assert.match(filteredCards[0].textContent, /Cyclone warning - Darwin/);

    assert.match(css, /\.media-releases__item\[data-declaration~=planned-burn-advice\]\{--media-releases-accent:\s*#865aa5\}/);
    assert.match(css, /\.media-releases__item\[data-declaration~=fire-ban-declaration\]\{--media-releases-accent:\s*#52565f\}/);
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