import assert from "node:assert/strict";
import test from "node:test";
import { fetchMediaReleaseFeeds, mediaReleaseSources, parseFeedPayload, resolveMediaReleaseEndpoint } from "./feeds.mjs";

const source = { name: "WoG" };

test("uses the five unique integration paths and supports localhost proxy overrides", async () => {
  const requested = [];
  const fetcher = async (url) => {
    requested.push(url);
    return { ok: true, json: async () => [] };
  };
  const expected = [
    "/_design/integrations/campaign-monitor-bushfires-nt",
    "/_design/integrations/campaign-monitor-ntes",
    "/_design/integrations/campaign-monitor-pfes",
    "/_design/integrations/campaign-monitor-securent",
    "/_design/integrations/campaign-monitor-all-agencies",
  ];
  assert.deepEqual(mediaReleaseSources.map((item) => item.endpoint), expected);
  assert.equal(new Set(expected).size, 5);
  await fetchMediaReleaseFeeds(fetcher);
  assert.deepEqual(requested, expected);
  requested.length = 0;
  await fetchMediaReleaseFeeds(fetcher, (item) => `/api/media-releases/${item.id}`);
  assert.deepEqual(requested, [
    "/api/media-releases/bushfires-nt", "/api/media-releases/ntes", "/api/media-releases/pfes",
    "/api/media-releases/securent", "/api/media-releases/wog",
  ]);
});

test("resolves all feeds on the temporary host with the securent prefix", () => {
  for (const page of ["https://cmsexternal.nt.gov.au", "https://cmsexternal.nt.gov.au/securent/media-releases", "https://cmsexternal.nt.gov.au/securent/news/releases/?a=123"]) {
    assert.deepEqual(mediaReleaseSources.map((item) => resolveMediaReleaseEndpoint(item, page)),
      mediaReleaseSources.map((item) => `https://cmsexternal.nt.gov.au/securent${item.endpoint}`));
  }
});

test("resolves all feeds on the final host without the temporary site prefix", () => {
  for (const page of ["https://securent.nt.gov.au", "https://securent.nt.gov.au/media-releases", "https://securent.nt.gov.au/news/releases/?a=123"]) {
    assert.deepEqual(mediaReleaseSources.map((item) => resolveMediaReleaseEndpoint(item, page)),
      mediaReleaseSources.map((item) => `https://securent.nt.gov.au${item.endpoint}`));
  }
});

test("never fetches missing URLs and preserves per-source failures", async () => {
  let requests = 0;
  await assert.rejects(fetchMediaReleaseFeeds(async () => { requests += 1; }, () => ""), (error) => {
    assert.ok(error instanceof AggregateError);
    assert.equal(error.errors.length, 5);
    assert.ok(error.errors.every((reason) => /Missing feed URL/.test(reason.message)));
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

test("ignores upstream page metadata when parsing feed results", () => {
  const parsed = parseFeedPayload({
    Results: [{ CampaignID: "one" }],
    PageNumber: 1,
    NumberOfPages: 3,
    TotalNumberOfRecords: 2051,
  }, source);

  assert.deepEqual(parsed, { source: "WoG", items: [{ CampaignID: "one" }] });
});

test("loads available sources and reports failed sources without page notes", async () => {
  const { feeds, failedSources, ...otherResults } = await fetchMediaReleaseFeeds(async (url) => {
    const matchingSource = mediaReleaseSources.find((item) => `/feed/${item.id}` === url);
    if (matchingSource.id === "ntes") throw new Error("offline");
    const payload = matchingSource.id === "wog"
      ? { Results: [], PageNumber: 1, NumberOfPages: 2, TotalNumberOfRecords: 900 }
      : [];
    return { ok: true, json: async () => payload };
  }, (item) => `/feed/${item.id}`);

  assert.equal(feeds.length, 4);
  assert.deepEqual(failedSources, ["NTES"]);
  assert.deepEqual(otherResults, {});
});

test("rejects when all feeds are unavailable", async () => {
  await assert.rejects(
    fetchMediaReleaseFeeds(async () => { throw new Error("offline"); }, (item) => `/feed/${item.id}`),
    /All emergency update feeds are unavailable/,
  );
});
