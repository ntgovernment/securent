import assert from "node:assert/strict";
import test from "node:test";
import { fetchMediaReleaseFeeds, mediaReleaseSources, parseFeedPayload } from "./feeds.mjs";

const source = { name: "WoG" };

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
    const matchingSource = mediaReleaseSources.find((item) => item.endpoint === url);
    if (matchingSource.id === "ntes") throw new Error("offline");
    const payload = matchingSource.id === "wog"
      ? { Results: [], PageNumber: 1, NumberOfPages: 2, TotalNumberOfRecords: 900 }
      : [];
    return { ok: true, json: async () => payload };
  });

  assert.equal(feeds.length, 3);
  assert.deepEqual(failedSources, ["NTES"]);
  assert.deepEqual(incompleteSources, ["WoG shows page 1 of 2 (900 records)."]);
});

test("rejects when all feeds are unavailable", async () => {
  await assert.rejects(
    fetchMediaReleaseFeeds(async () => { throw new Error("offline"); }),
    /All emergency update feeds are unavailable/,
  );
});
