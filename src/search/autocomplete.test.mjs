import { attachAutocomplete, getAutocompleteCandidates, getAutocompleteSuggestions, getPlaceSearchValues } from "./autocomplete.mjs";
import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";

test("matches unique candidates by case-insensitive prefix and respects the limit", () => {
  const candidates = ["Alice Springs", "alice springs", "Big Rivers", "Barkly", "Darwin"];
  assert.deepEqual(getAutocompleteSuggestions("  bI  ", candidates), ["Big Rivers"]);
  assert.deepEqual(getAutocompleteSuggestions("a", candidates), []);
  assert.deepEqual(getAutocompleteSuggestions("", candidates), []);
  assert.deepEqual(getAutocompleteSuggestions("b", candidates, 5), []);
  assert.deepEqual(getAutocompleteSuggestions("ba", candidates, 1), ["Barkly"]);
  assert.deepEqual(getAutocompleteSuggestions("da", candidates, 0), []);
});

function createAutocomplete() {
  const window = new Window();
  window.document.body.innerHTML = '<input id="search"><ul id="search-options"></ul>';
  const input = window.document.querySelector("#search");
  const listbox = window.document.querySelector("#search-options");
  const candidates = ["Alice Springs", "Big Rivers", "Katherine"];
  attachAutocomplete(input, listbox, () => candidates);
  return { window, input, listbox };
}

test("keyboard selection updates the input and dispatches its input event", () => {
  const { window, input, listbox } = createAutocomplete();
  let inputEvents = 0;
  input.addEventListener("input", () => { inputEvents += 1; });
  input.value = "al";
  input.dispatchEvent(new window.Event("input", { bubbles: true }));

  assert.equal(listbox.hidden, false);
  assert.equal(input.getAttribute("aria-expanded"), "true");
  input.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
  assert.equal(input.getAttribute("aria-activedescendant"), "search-options-option-0");
  input.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

  assert.equal(input.value, "Alice Springs");
  assert.equal(inputEvents, 2);
  assert.equal(listbox.hidden, true);
  assert.equal(input.getAttribute("aria-expanded"), "false");
});

test("pointer selection updates the input and Escape closes suggestions", () => {
  const { window, input, listbox } = createAutocomplete();
  input.value = "ka";
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
  input.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  assert.equal(listbox.hidden, true);

  input.dispatchEvent(new window.Event("input", { bubbles: true }));
  listbox.querySelector('[role="option"]').click();
  assert.equal(input.value, "Katherine");
  assert.equal(listbox.hidden, true);
});

test("refreshes suggestions when loaded candidates arrive while the input is focused", () => {
  const window = new Window();
  window.document.body.innerHTML = '<input id="search"><ul id="search-options"></ul>';
  const input = window.document.querySelector("#search");
  const listbox = window.document.querySelector("#search-options");
  let candidates = [];
  const autocomplete = attachAutocomplete(input, listbox, () => candidates.filter((candidate) => candidate !== "Not identified"));
  input.focus();
  input.value = "ka";
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
  candidates = ["Katherine", "Not identified"];
  autocomplete.refresh();

  assert.deepEqual([...listbox.querySelectorAll('[role="option"]')].map((option) => option.textContent), ["Katherine"]);
});

test("extracts searchable town, suburb, and street phrases from loaded text", () => {
  const candidates = getAutocompleteCandidates([
    "Flood Advice - Casuarina Drive, Nightcliff",
  ]);
  assert.deepEqual(getAutocompleteSuggestions("cas", candidates), ["Casuarina Drive", "Casuarina"]);
  assert.deepEqual(getAutocompleteSuggestions("nig", candidates), ["Nightcliff"]);
  assert.deepEqual(getPlaceSearchValues({ Town: "Alice Springs", street: "Todd Street", Suburb: "The Gap" }), [
    "Alice Springs", "Todd Street", "The Gap",
  ]);
});