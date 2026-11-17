import assert from "node:assert/strict";
import test from "node:test";
import {
  emergencyWarningsEndpoint, fetchEmergencyWarnings, fetchMappedWarnings, fetchMediaReleaseFeeds,
  loadMappedWarnings, mappedWarningsEndpoint, mediaReleaseSources, parseFeedPayload,
} from "./feeds.mjs";

const source = { name: "NTG agencies" };

test("loads and validates the mapped warnings feed", async () => {
  const records = [{ campaignId: "one", region: ["Top End", "Barkly"] }];
  assert.deepEqual(await fetchMappedWarnings(async (url, options) => {
    assert.equal(url, mappedWarningsEndpoint);
    assert.equal(options.headers.Accept, "application/json");
    assert.ok(options.signal);
    return { ok: true, json: async () => records };
  }), records);
  await assert.rejects(fetchMappedWarnings(async () => ({ ok: false, status: 503 })), /503/);
  await assert.rejects(fetchMappedWarnings(async () => ({ ok: true, json: async () => ({}) })), /unsupported response shape/);
});

test("loads the emergency warnings feed for campaign-level classification", async () => {
  const records = [{ campaignId: "campaign-1", warningLevel: "decreasing_threat" }];
  assert.deepEqual(await fetchEmergencyWarnings(async (url, options) => {
    assert.equal(url, emergencyWarningsEndpoint);
    assert.equal(options.headers.Accept, "application/json");
    assert.ok(options.signal);
    return { ok: true, json: async () => records };
  }), records);
  await assert.rejects(fetchEmergencyWarnings(async () => ({ ok: false, status: 503 })), /503/);
  await assert.rejects(fetchEmergencyWarnings(async () => ({ ok: true, json: async () => ({}) })), /unsupported response shape/);
});

test("reports mapping failures while allowing warnings to fall back", async () => {
  const originalError = console.error;
  const errors = [];
  console.error = (...args) => errors.push(args);
  try {
    assert.deepEqual(await loadMappedWarnings(async () => { throw new Error("offline"); }), {
      mappedWarnings: [], mappingFailed: true,
    });
    assert.match(String(errors[0][1]), /offline/);
  } finally {
    console.error = originalError;
  }
});

test("times out even if the mapping request does not respond to cancellation", async () => {
  const originalSetTimeout = globalThis.setTimeout;
  globalThis.setTimeout = (callback) => {
    queueMicrotask(callback);
    return undefined;
  };
  try {
    await assert.rejects(fetchMappedWarnings(() => new Promise(() => {})), /timed out/);
  } finally {
    globalThis.setTimeout = originalSetTimeout;
  }
});

test("uses the configured integration URLs and supports localhost proxy overrides", async () => {
  const requested = [];
  const fetcher = async (url) => {
    requested.push(url);
    return { ok: true, json: async () => [] };
  };
  const expected = [
    "https://cmsexternal.nt.gov.au/securent/_design/integrations/campaign-monitor-bushfires-nt",
    "https://cmsexternal.nt.gov.au/securent/_design/integrations/campaign-monitor-ntes",
    "https://cmsexternal.nt.gov.au/securent/_design/integrations/campaign-monitor-ntg-agencies",
  ];
  assert.deepEqual(mediaReleaseSources.map((item) => item.endpoint), expected);
  assert.equal(new Set(expected).size, 3);
  await fetchMediaReleaseFeeds(fetcher);
  assert.deepEqual(requested, expected);
  requested.length = 0;
  await fetchMediaReleaseFeeds(fetcher, (item) => `/api/media-releases/${item.id}`);
  assert.deepEqual(requested, [
    "/api/media-releases/bushfires-nt", "/api/media-releases/ntes",
    "/api/media-releases/ntg-agencies",
  ]);
});

test("never fetches missing URLs and preserves per-source failures", async () => {
  let requests = 0;
  await assert.rejects(fetchMediaReleaseFeeds(async () => { requests += 1; }, () => ""), (error) => {
    assert.ok(error instanceof AggregateError);
    assert.equal(error.errors.length, 3);
    assert.ok(error.errors.every((reason) => /Missing feed URL/.test(reason.message)));
    return true;
  });
  assert.equal(requests, 0);
});

test("parses focused-feed arrays", () => {
  assert.deepEqual(parseFeedPayload([{ CampaignID: "one" }], source), {
    source: "NTG agencies",
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

  assert.deepEqual(parsed, { source: "NTG agencies", items: [{ CampaignID: "one" }] });
});

test("loads available sources and reports failed sources without page notes", async () => {
  const { feeds, failedSources, ...otherResults } = await fetchMediaReleaseFeeds(async (url) => {
    const matchingSource = mediaReleaseSources.find((item) => `/feed/${item.id}` === url);
    if (matchingSource.id === "ntes") throw new Error("offline");
    const payload = matchingSource.id === "ntg-agencies"
      ? { Results: [], PageNumber: 1, NumberOfPages: 2, TotalNumberOfRecords: 900 }
      : [];
    return { ok: true, json: async () => payload };
  }, (item) => `/feed/${item.id}`);

  assert.equal(feeds.length, 2);
  assert.deepEqual(failedSources, ["NTES"]);
  assert.deepEqual(otherResults, {});
});

test("rejects when all feeds are unavailable", async () => {
  await assert.rejects(
    fetchMediaReleaseFeeds(async () => { throw new Error("offline"); }, (item) => `/feed/${item.id}`),
    /All emergency update feeds are unavailable/,
  );
});
