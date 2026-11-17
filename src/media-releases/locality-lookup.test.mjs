import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { findLocality } from "./locality-lookup.mjs";

const square = (west, south, east, north) => [
  [west, south], [east, south], [east, north], [west, north], [west, south],
];

test("resolves polygon boundaries, holes and multipolygon islands", () => {
  const data = {
    type: "FeatureCollection",
    features: [
      { properties: { loc_name: "First" }, geometry: {
        type: "Polygon", coordinates: [square(0, 0, 10, 10), square(2, 2, 4, 4)],
      } },
      { properties: { loc_name: "Islands" }, geometry: {
        type: "MultiPolygon", coordinates: [[square(20, 20, 21, 21)], [square(30, 30, 31, 31)]],
      } },
    ],
  };
  assert.equal(findLocality(data, 1, 1), "First");
  assert.equal(findLocality(data, 0, 5), "First");
  assert.equal(findLocality(data, 3, 3), null);
  assert.equal(findLocality(data, 2, 3), "First");
  assert.equal(findLocality(data, 30.5, 30.5), "Islands");
  assert.equal(findLocality(data, 15, 15), null);
  assert.throws(() => findLocality(data, NaN, 0), /Invalid device coordinates/);
  assert.throws(() => findLocality({}, 0, 0), /Invalid locality boundaries/);
});

test("NT boundaries resolve actual localities and exclude interstate locations", async () => {
  const data = JSON.parse(await readFile(new URL("./nt-localities.json", import.meta.url), "utf8"));
  assert.equal(findLocality(data, -12.4634, 130.8456), "Darwin City");
  assert.equal(findLocality(data, -23.698, 133.8807), "Alice Springs");
  assert.equal(findLocality(data, -33.8688, 151.2093), null);
});
