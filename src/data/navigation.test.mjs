import assert from "node:assert/strict";
import test from "node:test";
import { SECURENT_BASE_URL } from "../config/site-url.mjs";
import { primaryNavigation } from "./navigation.js";

function flatten(items) {
  return items.flatMap((item) => [item, ...flatten(item.children || [])]);
}

test("legacy SecureNT navigation destinations use the configured base URL", () => {
  const externalHrefs = flatten(primaryNavigation)
    .map(({ href }) => href)
    .filter((href) => /^https?:/.test(href));

  assert.ok(externalHrefs.length > 0);
  assert.ok(externalHrefs.every((href) => href.startsWith(SECURENT_BASE_URL)));
});
