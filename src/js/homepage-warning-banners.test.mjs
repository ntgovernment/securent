import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { initializeHomepageWarningBanners } from "./homepage-warning-banners.mjs";

test("classifies each banner from its heading without changing its links", async () => {
  const window = new Window();
  try {
    window.document.body.innerHTML = `
      <div id="latest-warnings"><section>
        <div class="warning-banner"><div><h3>Storm RECOVERY assistance</h3>
          <a href="/assistance">More information</a><a href="/map">Map</a></div></div>
        <div class="warning-banner"><div><h3>Active storm warning</h3>
          <p>Recovery information is available later.</p><a href="/warning">More information</a></div></div>
        <div class="warning-banner"><p>Recovery without a heading</p></div>
      </section></div>
      <div class="warning-banner"><h3>Recovery elsewhere</h3></div>`;

    initializeHomepageWarningBanners(window);
    window.document.dispatchEvent(new window.Event("DOMContentLoaded"));

    const banners = window.document.querySelectorAll(".warning-banner");
    assert.deepEqual(Array.from(banners, banner => banner.classList.contains("warning-banner--recovery")),
      [true, false, false, false]);
    assert.deepEqual(Array.from(banners[0].querySelectorAll("a"), link => link.getAttribute("href")),
      ["/assistance", "/map"]);
    assert.equal(banners[1].querySelector("a").getAttribute("href"), "/warning");
  } finally {
    await window.happyDOM.close();
  }
});

test("classifies existing banners when the document is already ready", async () => {
  const window = new Window();
  try {
    window.document.body.innerHTML = `
      <div id="latest-warnings"><section>
        <div class="warning-banner"><h3>Disaster recovery</h3></div>
      </section></div>`;
    Object.defineProperty(window.document, "readyState", { configurable: true, value: "complete" });

    initializeHomepageWarningBanners(window);

    assert.equal(window.document.querySelector(".warning-banner").classList.contains("warning-banner--recovery"), true);
  } finally {
    await window.happyDOM.close();
  }
});
