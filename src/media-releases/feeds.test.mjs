import assert from "node:assert/strict";
import test from "node:test";
import { fetchMediaReleaseFeeds, mediaReleaseSources, parseFeedPayload } from "./feeds.mjs";

const source = { name: "WoG" };

test("uses all five Matrix keywords via rendered URLs and supports localhost proxy overrides", async () => {
  const requested = [];
  const fetcher = async (url) => {
    requested.push(url);
    return { ok: true, json: async () => [] };
  };
  assert.deepEqual(mediaReleaseSources.map((item) => item.endpoint), [
    "%globals_asset_url:1657482%", "%globals_asset_url:1657484%", "%globals_asset_url:1657483%",
    "%globals_asset_url:1657299%", "%globals_asset_url:1657265%",
  ]);
  await fetchMediaReleaseFeeds(fetcher, (item) => `https://cms.example/feeds/${item.id}`);
  assert.deepEqual(requested, mediaReleaseSources.map((item) => `https://cms.example/feeds/${item.id}`));
  requested.length = 0;
  await fetchMediaReleaseFeeds(fetcher, (item) => `/api/media-releases/${item.id}`);
  assert.deepEqual(requested, [
    "/api/media-releases/bushfires-nt", "/api/media-releases/ntes", "/api/media-releases/pfes",
    "/api/media-releases/securent", "/api/media-releases/wog",
  ]);
});

test("never fetches unresolved Matrix keywords and preserves per-source failures", async () => {
  let requests = 0;
  await assert.rejects(fetchMediaReleaseFeeds(async () => { requests += 1; }), (error) => {
    assert.ok(error instanceof AggregateError);
    assert.equal(error.errors.length, 5);
    assert.ok(error.errors.every((reason) => /Missing or unresolved Matrix feed URL/.test(reason.message)));
    return true;
  });
  assert.equal(requests, 0);
});

test("parses focused-feed arrays", () => {
  assert.deepEqual(parseFeedPayload([{ CampaignID: "one" }], source), {
    source: "WoG",
    items: [{ CampaignID: "one" }],
  });
});

test("marks a paginated feed as incomplete when only its first page is returned", () => {
  const parsed = parseFeedPayload({
    Results: [{ CampaignID: "one" }],
    PageNumber: 1,
    NumberOfPages: 3,
    TotalNumberOfRecords: 2051,
  }, source);

  assert.equal(parsed.incomplete, "WoG shows page 1 of 3 (2051 records). ".trim());
});

test("loads available sources and reports failed sources", async () => {
  const { feeds, failedSources, incompleteSources } = await fetchMediaReleaseFeeds(async (url) => {
    const matchingSource = mediaReleaseSources.find((item) => `/feed/${item.id}` === url);
    if (matchingSource.id === "ntes") throw new Error("offline");
    const payload = matchingSource.id === "wog"
      ? { Results: [], PageNumber: 1, NumberOfPages: 2, TotalNumberOfRecords: 900 }
      : [];
    return { ok: true, json: async () => payload };
  }, (item) => `/feed/${item.id}`);

  assert.equal(feeds.length, 4);
  assert.deepEqual(failedSources, ["NTES"]);
  assert.deepEqual(incompleteSources, ["WoG shows page 1 of 2 (900 records)."]);
});

test("rejects when all feeds are unavailable", async () => {
  await assert.rejects(
    fetchMediaReleaseFeeds(async () => { throw new Error("offline"); }, (item) => `/feed/${item.id}`),
    /All emergency update feeds are unavailable/,
  );
});
