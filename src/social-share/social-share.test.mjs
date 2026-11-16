import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Window } from "happy-dom";

const script = await readFile(new URL("./social-share.js", import.meta.url), "utf8");
const shareItem = `
  <li>
    <button type="button" class="ntg-social-share__link ntg-social-share--native">Share</button>
    <div class="ntg-social-share__status" role="status" aria-live="polite"></div>
  </li>`;

function setup(markup = shareItem, url = "https://example.test/event?x=1#details") {
  const window = new Window({ url });
  window.document.title = "Storm warning";
  window.document.body.innerHTML = `<section class="ntg-social-share"><ul>${markup}</ul></section>`;
  return window;
}

function setNavigator(window, key, value) {
  Object.defineProperty(window.navigator, key, { configurable: true, value });
}

async function settle() {
  await Promise.resolve();
  await Promise.resolve();
}

test("native share sends title and URL from the click and retains real fragments", async () => {
  const window = setup();
  try {
    let payload;
    setNavigator(window, "share", (data) => { payload = data; return Promise.resolve(); });
    window.eval(script);
    window.document.querySelector("button").click();
    assert.equal(payload.title, "Storm warning");
    assert.equal(payload.url, "https://example.test/event?x=1#details");
    await settle();
    assert.equal(window.document.querySelector('[role="status"]').textContent, "");
  } finally {
    await window.happyDOM.close();
  }
});

test("dismissal does not copy, while native share errors are reported", async () => {
  for (const name of ["AbortError", "NotAllowedError"]) {
    const window = setup();
    try {
      let copied = false;
      setNavigator(window, "share", () => Promise.reject({ name }));
      setNavigator(window, "clipboard", { writeText: () => { copied = true; return Promise.resolve(); } });
      window.eval(script);
      window.document.querySelector("button").click();
      await settle();
      assert.equal(copied, false);
      assert.equal(window.document.querySelector('[role="status"]').textContent,
        name === "AbortError" ? "" : "Unable to share this page.");
    } finally {
      await window.happyDOM.close();
    }
  }
});

test("synchronous native share errors are reported without copying", async () => {
  const window = setup();
  try {
    setNavigator(window, "share", () => { throw new Error("failed"); });
    window.eval(script);
    window.document.querySelector("button").click();
    assert.equal(window.document.querySelector('[role="status"]').textContent, "Unable to share this page.");
  } finally {
    await window.happyDOM.close();
  }
});

test("unsupported browsers copy the URL and update only the activated panel", async () => {
  const window = setup(shareItem + shareItem, "https://example.test/event?x=1#void");
  try {
    let copied;
    setNavigator(window, "share", undefined);
    setNavigator(window, "clipboard", { writeText: (text) => { copied = text; return Promise.resolve(); } });
    window.eval(script);
    window.document.querySelectorAll("button")[1].click();
    await settle();
    assert.equal(copied, "https://example.test/event?x=1");
    const statuses = window.document.querySelectorAll('[role="status"]');
    assert.equal(statuses[0].textContent, "");
    assert.equal(statuses[1].textContent, "URL copied!");
  } finally {
    await window.happyDOM.close();
  }
});

test("clipboard failure falls back to legacy copying and restores focus", async () => {
  const window = setup();
  try {
    setNavigator(window, "share", undefined);
    setNavigator(window, "clipboard", { writeText: () => Promise.reject(new Error("denied")) });
    window.document.execCommand = (command) => {
      assert.equal(command, "copy");
      assert.equal(window.document.activeElement.value, "https://example.test/event?x=1#details");
      return true;
    };
    window.eval(script);
    const button = window.document.querySelector("button");
    button.focus();
    button.click();
    await settle();
    assert.equal(window.document.activeElement, button);
    assert.equal(window.document.querySelector('[role="status"]').textContent, "URL copied!");
  } finally {
    await window.happyDOM.close();
  }
});

test("unavailable clipboard and failed legacy copy report failure", async () => {
  const window = setup();
  try {
    setNavigator(window, "share", undefined);
    setNavigator(window, "clipboard", undefined);
    window.document.execCommand = () => false;
    window.eval(script);
    window.document.querySelector("button").click();
    assert.equal(window.document.querySelector('[role="status"]').textContent, "Unable to copy the page link.");
  } finally {
    await window.happyDOM.close();
  }
});

test("existing social popups and legacy copy markup still work", async () => {
  const window = setup(`
    <li class="ntg-social-share--enabled"><a class="ntg-social-share__link" href="https://example.test/share">Social</a></li>
    <li><a class="ntg-social-share__link ntg-social-share--copy external" href="#void">Copy</a>
      <div id="fade-text" class="d-none">URL copied!</div></li>`);
  try {
    const opened = [];
    let copied;
    window.open = (...args) => { opened.push(args); };
    setNavigator(window, "clipboard", { writeText: (text) => { copied = text; return Promise.resolve(); } });
    window.eval(script);
    window.document.querySelector(".ntg-social-share--enabled a").click();
    window.document.querySelector(".ntg-social-share--copy").click();
    await settle();
    assert.equal(opened.length, 1);
    assert.equal(opened[0][0], "https://example.test/share");
    assert.equal(copied, "https://example.test/event?x=1#details");
    assert.equal(window.document.querySelector("#fade-text").classList.contains("d-none"), false);
  } finally {
    await window.happyDOM.close();
  }
});
