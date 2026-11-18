import assert from "node:assert/strict";
import test from "node:test";
import { SECURENT_BASE_URL, secureNTUrl } from "./site-url.mjs";

test("builds SecureNT URLs from the configured base", () => {
  assert.equal(secureNTUrl("/_design/integrations/fire-danger-ratings"),
    `${SECURENT_BASE_URL}/_design/integrations/fire-danger-ratings`);
  assert.equal(secureNTUrl("events/severe-storm-alice-springs"),
    `${SECURENT_BASE_URL}/events/severe-storm-alice-springs`);
});
