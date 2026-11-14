import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { curateFeeds } from "./curation.mjs";
import { randomizePreviewWarnings } from "./preview-warnings.mjs";

const preview = JSON.parse(await readFile(new URL("./latest-warnings.preview.json", import.meta.url), "utf8"));

test("local preview covers each hazard type and warning level", () => {
  const warnings = curateFeeds([{ source: "Merged", items: preview }]);
  const combinations = new Set(warnings.map((warning) => `${warning.emergencyTypes[0]}|${warning.warningLevel}`));

  assert.equal(warnings.length, 18);
  for (const type of ["Bushfire", "Cyclone", "Flooding", "Storm", "Heatwave"]) {
    for (const level of ["Emergency warning", "Watch and act", "Advice"]) {
      assert.ok(combinations.has(`${type}|${level}`), `Missing ${type} ${level} preview`);
    }
  }
  assert.ok(warnings.some((warning) => warning.declarations.includes("Planned burn advice")));
  assert.ok(warnings.some((warning) => warning.declarations.includes("Boil water notice")));
  assert.ok(warnings.some((warning) => /decreasing threat/i.test(warning.title)));
});

test("randomizes three distinct preview warnings", () => {
  const first = randomizePreviewWarnings(preview, () => 0);
  const second = randomizePreviewWarnings(preview, () => 0.999);
  const specialTagPreviews = preview.filter((item) =>
    /\b(?:decreasing[\s_-]+threats?|planned burns?|boil(?:ing)? water)\b/i.test(item.Subject));
  const selectedSpecialTags = new Set([0, 0.5, 0.999].map((value) =>
    randomizePreviewWarnings(preview, () => value)
      .find((item) => specialTagPreviews.includes(item))?.CampaignID));

  assert.equal(first.length, 3);
  assert.equal(new Set(first.map((item) => item.CampaignID)).size, 3);
  assert.ok(first.every((item) => preview.includes(item)));
  assert.ok(first.some((item) => specialTagPreviews.includes(item)));
  assert.notDeepEqual(first, second);
  assert.deepEqual(selectedSpecialTags, new Set(specialTagPreviews.map((item) => item.CampaignID)));
});
