import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Window } from "happy-dom";
import { guardQuickExit } from "./quick-exit.mjs";

test("does not run quick exit without its component", () => {
  const window = new Window();
  let calls = 0;
  window.quickExit = () => { calls += 1; };
  guardQuickExit(window);
  window.quickExit();
  assert.equal(calls, 0);
});

test("preserves the original receiver, arguments and result with a component", () => {
  const window = new Window();
  window.document.body.innerHTML = '<button id="quickexit" hidden>Quick exit</button>';
  const receiver = {};
  window.quickExit = function (...args) {
    assert.equal(this, receiver);
    assert.deepEqual(args, ["original", 2]);
    return "result";
  };
  guardQuickExit(window);
  assert.equal(window.quickExit.call(receiver, "original", 2), "result");
});

test("checks component presence again after insertion and removal", () => {
  const window = new Window();
  let calls = 0;
  window.quickExit = () => { calls += 1; };
  guardQuickExit(window);
  window.quickExit();
  window.document.body.innerHTML = '<button id="quickexit">Quick exit</button>';
  window.quickExit();
  window.document.getElementById("quickexit").remove();
  window.quickExit();
  assert.equal(calls, 1);
});

test("leaves missing or non-function legacy globals unchanged", () => {
  const window = new Window();
  guardQuickExit(window);
  assert.equal(window.quickExit, undefined);
  window.quickExit = null;
  guardQuickExit(window);
  assert.equal(window.quickExit, null);
});

test("legacy Escape and click bindings redirect only with a component", async () => {
  const window = new Window();
  try {
    const jquery = await readFile(new URL("../../SecureNT_files/jquery.min.js", import.meta.url), "utf8");
    const components = await readFile(new URL("../../SecureNT_files/ntgbase-components.min.js", import.meta.url), "utf8");
    const quickExitScript = components.split(/\r?\n/).find((line) => line.startsWith("function quickExit()"));
    assert.ok(quickExitScript, "legacy quick-exit implementation is available");
    const calls = [];
    window.open = (...args) => { calls.push(["open", ...args]); };
    window.location.replace = (...args) => { calls.push(["replace", ...args]); };
    window.eval(jquery);
    window.eval(quickExitScript);
    guardQuickExit(window);
    await window.happyDOM.whenAsyncComplete();

    let otherEscapeEvents = 0;
    window.document.addEventListener("keyup", (event) => {
      if (event.key === "Escape") otherEscapeEvents += 1;
    });
    const escape = () => window.document.dispatchEvent(new window.KeyboardEvent("keyup", {
      key: "Escape", keyCode: 27, bubbles: true,
    }));

    escape();
    assert.deepEqual(calls, []);
    assert.equal(otherEscapeEvents, 1);

    window.document.body.innerHTML = '<button id="quickexit">Quick exit</button>';
    escape();
    const expected = [["open", "https://nt.gov.au", "_newtab"], ["replace", "https://www.google.com"]];
    assert.deepEqual(calls, expected);

    window.document.getElementById("quickexit").remove();
    escape();
    assert.deepEqual(calls, expected);
    assert.equal(otherEscapeEvents, 3);

    window.document.body.innerHTML = '<button id="quickexit">Quick exit</button>';
    window.eval(quickExitScript);
    guardQuickExit(window);
    await window.happyDOM.whenAsyncComplete();
    window.document.getElementById("quickexit").click();
    assert.deepEqual(calls, [...expected, ...expected]);
  } finally {
    await window.happyDOM.close();
  }
});