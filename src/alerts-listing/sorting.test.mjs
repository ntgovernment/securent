import assert from "node:assert/strict";
import test from "node:test";
import { sortAlerts, updatedTimestamp } from "./sorting.mjs";

const titleFor = (item) => item.title?.trim() || `${item.emergencyType} ${item.warningLevel} - ${item.location}`;
const ids = (items) => items.map((item) => item.id);

test("current order and sorting never mutate the source; tied ranks retain feed order", () => {
  const items = Object.freeze([
    { id: 1, warningLevel: "Advice" },
    { id: 2, warningLevel: " emergency WARNING " },
    { id: 3, warningLevel: "Watch and act" },
    { id: 4, warningLevel: "Advice" },
    { id: 5, warningLevel: "Decreasing threat" },
    { id: 6, warningLevel: "Unknown" },
    { id: 7 },
  ].map(Object.freeze));
  assert.deepEqual(ids(sortAlerts(items, "level", titleFor)), [2, 3, 1, 4, 5, 6, 7]);
  assert.deepEqual(ids(sortAlerts(items, "current", titleFor)), [1, 2, 3, 4, 5, 6, 7]);
  assert.notEqual(sortAlerts(items, "current", titleFor), items);
});

test("CMS dates use NT time; explicit offsets and fractions are respected", () => {
  assert.equal(updatedTimestamp("2026-10-27 00:00:00"), Date.parse("2026-10-26T14:30:00Z"));
  assert.equal(updatedTimestamp("2026-10-27T00:00:00+0930"), Date.parse("2026-10-26T14:30:00Z"));
  assert.equal(updatedTimestamp("2026-10-27T00:00:00.12Z"), Date.parse("2026-10-27T00:00:00.120Z"));
  assert.equal(updatedTimestamp("2026-10-27T00:00:00-05:00"), Date.parse("2026-10-27T05:00:00Z"));
  assert.equal(updatedTimestamp("2024-02-29 00:00:00"), Date.parse("2024-02-29T00:00:00+09:30"));
});

test("blank, invalid and overflowing dates are rejected", () => {
  for (const value of [undefined, "", "invalid", "2026-02-29 00:00:00", "2026-13-01 00:00:00",
    "2026-04-31 00:00:00", "2026-10-27 24:00:00", "2026-10-27T00:00:00+24:00",
    "2026-10-27T00:00:00+09:60", "2026-10-27 00:60:00", "2026-10-27 00:00:60"]) {
    assert.equal(updatedTimestamp(value), null, String(value));
  }
});

test("newest sorting puts missing dates last and preserves tied dates", () => {
  const items = [
    { id: 1, updatedAt: "" },
    { id: 2, updatedAt: "2026-10-27 00:00:00" },
    { id: 3, updatedAt: "2026-10-27T00:00:00Z" },
    { id: 4, updatedAt: "invalid" },
    { id: 5, updatedAt: "2026-10-26T14:30:00Z" },
  ];
  assert.deepEqual(ids(sortAlerts(items, "updated", titleFor)), [3, 2, 5, 1, 4]);
});

test("alphabetical location sorting is case-insensitive, stable and puts blanks last", () => {
  const items = [{ id: 1 }, { id: 2, location: "Barkly" }, { id: 3, location: " alice Springs " },
    { id: 4, location: "ALICE SPRINGS" }, { id: 5, location: " " }];
  assert.deepEqual(ids(sortAlerts(items, "location", titleFor)), [3, 4, 2, 1, 5]);
});

test("title sorting uses the same fallback titles as the listing", () => {
  const items = [{ id: 1, title: "Severe storm" }, { id: 2, title: "", emergencyType: "Flooding",
    warningLevel: "Advice", location: "Barkly" }, { id: 3, title: "Bushfire" }];
  assert.deepEqual(ids(sortAlerts(items, "title", titleFor)), [3, 2, 1]);
});

test("sort filtered matches before page slicing and restore their feed order", () => {
  const items = Array.from({ length: 20 }, (_, index) => ({ id: index, location: `Location ${20 - index}`,
    warningLevel: index % 2 ? "Advice" : "Watch and act" }));
  const matches = items.filter((item) => item.warningLevel === "Advice");
  assert.deepEqual(ids(sortAlerts(matches, "location", titleFor).slice(0, 8)), [19, 17, 15, 13, 11, 9, 7, 5]);
  assert.deepEqual(ids(sortAlerts(matches, "current", titleFor)), ids(matches));
});