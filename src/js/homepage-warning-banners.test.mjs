import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";

test("theme preserves the CMS-assigned banner class regardless of heading text", async () => {
  const window = new Window();
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  try {
    window.document.body.innerHTML = `
      <div id="latest-warnings"><section>
        <div class="warning-banner"><h3>Recovery wording, no class</h3></div>
        <div class="warning-banner warning-banner--recovery"><h3>Active wording, recovery class</h3></div>
      </section></div>`;
    globalThis.window = window;
    globalThis.document = window.document;

    await import("./main.js");
    window.document.dispatchEvent(new window.Event("DOMContentLoaded"));

    const banners = [...window.document.querySelectorAll(".warning-banner")];
    assert.deepEqual(banners.map((banner) => banner.className), [
      "warning-banner",
      "warning-banner warning-banner--recovery",
    ]);
  } finally {
    globalThis.window = previousWindow;
    globalThis.document = previousDocument;
    await window.happyDOM.close();
  }
});
