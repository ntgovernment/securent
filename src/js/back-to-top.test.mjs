import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { initializeBackToTop } from "./back-to-top.mjs";

test("adds a labeled back-to-top button that appears after scrolling", async () => {
  const window = new Window();
  try {
    initializeBackToTop(window);
    const button = window.document.getElementById("back-to-top");

    assert.ok(button);
    assert.equal(button.tagName, "BUTTON");
    assert.equal(button.type, "button");
    assert.equal(button.getAttribute("aria-label"), "Back to top");
    assert.equal(button.hidden, true);
    assert.equal(button.querySelector(".fa-light.fa-chevron-up").getAttribute("aria-hidden"), "true");

    Object.defineProperty(window, "scrollY", { configurable: true, value: 501 });
    window.dispatchEvent(new window.Event("scroll"));
    assert.equal(button.hidden, false);

    Object.defineProperty(window, "scrollY", { configurable: true, value: 500 });
    window.dispatchEvent(new window.Event("scroll"));
    assert.equal(button.hidden, true);
  } finally {
    await window.happyDOM.close();
  }
});

test("scrolls to the top smoothly unless reduced motion is requested", async () => {
  const window = new Window();
  try {
    const scrollCalls = [];
    window.scrollTo = (options) => scrollCalls.push(options);
    window.matchMedia = (query) => ({ matches: query.includes("prefers-reduced-motion") });
    initializeBackToTop(window);
    const button = window.document.getElementById("back-to-top");

    button.click();
    assert.deepEqual(scrollCalls, [{ top: 0, behavior: "auto" }]);

    window.matchMedia = () => ({ matches: false });
    button.click();
    assert.deepEqual(scrollCalls[1], { top: 0, behavior: "smooth" });

    window.matchMedia = undefined;
    button.click();
    assert.deepEqual(scrollCalls[2], { top: 0, behavior: "smooth" });
  } finally {
    await window.happyDOM.close();
  }
});
