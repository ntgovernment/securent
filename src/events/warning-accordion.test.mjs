import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Window } from "happy-dom";

const css = await readFile(new URL("../css/components/warning-accordion.css", import.meta.url), "utf8");
const eventCss = await readFile(new URL("./event.css", import.meta.url), "utf8");

async function withAccordion(check) {
  const window = new Window();
  try {
    window.document.head.innerHTML = `<style>:root{--clr-status-advice:#fbe032}${css.replace('@import "../tokens.css";', "")}</style>`;
    window.document.body.innerHTML = `
      <details class="warning-accordion">
        <summary><span class="warning-accordion__level warning-accordion__level--advice">Advice</span></summary>
        <div class="warning-accordion__body"></div>
      </details>
      <div class="event-page__header-accent warning-level-advice"></div>`;
    const accordion = window.document.querySelector("details");
    const level = accordion.querySelector(".warning-accordion__level");
    await check({ window, accordion, level });
  } finally {
    await window.happyDOM.close();
  }
}

test("accent matches each summary warning level without an outer level class", async () => {
  for (const [status, color] of [
    ["advice", "#fbe032"],
    ["watch_act", "#ff7900"],
    ["emergency_warning", "#d6001c"],
    ["decreasing_threat", "#fbe032"],
  ]) {
    await withAccordion(({ window, accordion, level }) => {
      level.className = `warning-accordion__level warning-accordion__level--${status}`;
      assert.equal(window.getComputedStyle(accordion).borderLeftColor, color);
    });
  }
});

test("existing outer warning-level classes still set the accent", async () => {
  await withAccordion(({ window, accordion, level }) => {
    level.className = "warning-accordion__level";
    for (const [status, color] of [
      ["watch_act", "#ff7900"],
      ["emergency_warning", "#d6001c"],
      ["advice", "#fbe032"],
      ["decreasing_threat", "#fbe032"],
    ]) {
      accordion.className = `warning-accordion warning-level-${status}`;
      assert.equal(window.getComputedStyle(accordion).borderLeftColor, color);
    }
  });
});

test("event-page header accent matches Advice for decreasing threat", async () => {
  const window = new Window();
  try {
    window.document.head.innerHTML = `<style>:root{--clr-status-advice:#fbe032}${eventCss.replace('@import "../css/tokens.css";', "")}</style>`;
    window.document.body.innerHTML = `
      <div class="event-page__header-accent warning-level-advice"></div>
      <div class="event-page__header-accent warning-level-decreasing_threat"></div>`;
    const [advice, decreasingThreat] = window.document.querySelectorAll(".event-page__header-accent");
    assert.equal(window.getComputedStyle(decreasingThreat).backgroundColor, window.getComputedStyle(advice).backgroundColor);
  } finally {
    await window.happyDOM.close();
  }
});
