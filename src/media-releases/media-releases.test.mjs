import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Window } from "happy-dom";

const html = await readFile(new URL("../../media-releases.html", import.meta.url), "utf8");
const notice = {
  Name: "AWS Flood Advice - Daly River",
  Subject: "Flood Advice - Daly River - Stay Informed",
  FromName: "NT Fire and Emergency Services",
  SentDate: "2026-11-08 09:00:00",
  CampaignID: "campaign-1",
  WebVersionURL: "http://createsend.com/campaign-1",
};

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