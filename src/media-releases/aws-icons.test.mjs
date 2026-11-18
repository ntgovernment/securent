import assert from "node:assert/strict";
import test from "node:test";
import { awsHazardIconFilename, warningLevelSlug } from "./aws-icons.mjs";

test("maps warning levels to their AWS icon tiers", () => {
  assert.equal(awsHazardIconFilename(["Flooding"], "Advice"), "flood-advice.webp");
  assert.equal(awsHazardIconFilename(["Storm"], "Advice"), "storm-advice.webp");
  assert.equal(awsHazardIconFilename(["Flooding"], "Watch and act"), "flood-watch_act.webp");
  assert.equal(awsHazardIconFilename(["Flooding"], "Emergency warning"), "flood-emergency_warning.webp");
});

test("uses the first identified type and the Other icon for unmapped types", () => {
  assert.equal(awsHazardIconFilename(["Cyclone", "Flooding"], "Advice"), "cyclone-advice.webp");
  assert.equal(awsHazardIconFilename(["Health emergency"], "Advice"), "other-advice.webp");
});

test("uses the Advice hazard icon while retaining a distinct data level for decreasing threat", () => {
  assert.equal(warningLevelSlug("Decreasing threat"), "decreasing_threat");
  assert.equal(awsHazardIconFilename(["Flooding"], "Decreasing threat"), "flood-advice.webp");
  assert.equal(awsHazardIconFilename(["Storm"], "Decreasing threat"), "storm-advice.webp");
  assert.equal(awsHazardIconFilename(["Health emergency"], "Decreasing threat"), "other-advice.webp");
});

test("omits AWS icons when type or warning level is not identified", () => {
  assert.equal(awsHazardIconFilename(["Not identified"], "Advice"), "");
  assert.equal(awsHazardIconFilename(["Flooding"], "Not identified"), "");
  assert.equal(awsHazardIconFilename(["Flooding"], "Unexpected level"), "");
});

test("uses the neutral card-level fallback for unknown warning levels", () => {
  assert.equal(warningLevelSlug("Not identified"), "not-identified");
  assert.equal(warningLevelSlug("Unexpected level"), "not-identified");
});