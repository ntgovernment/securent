import assert from "node:assert/strict";
import test from "node:test";
import { classifyNotice, curateFeeds, filterAndSortNotices, isOperationalNotice } from "./curation.mjs";

const record = (overrides = {}) => ({
  Name: "AWS Flood Advice - Daly River",
  Subject: "Flood Advice - Daly River - Stay Informed",
  FromName: "NT Fire and Emergency Services",
  SentDate: "2026-11-08 09:00:00",
  CampaignID: "campaign-1",
  WebVersionURL: "http://createsend.com/campaign-1",
  ...overrides,
});

test("includes operational warning and public health alert language", () => {
  assert.equal(isOperationalNotice(record()), true);
  assert.equal(isOperationalNotice(record({
    Name: "Public health alert on boiling water",
    Subject: "Boil Water Alert - East Arnhem communities",
    FromName: "NT Health",
  })), true);
  assert.equal(isOperationalNotice(record({
    Name: "Evacuees move to Batchelor",
    Subject: "Evacuations underway for Daly River",
    FromName: "Department of Children and Families",
  })), true);
});

test("rejects general news and weak hazard-only matches", () => {
  assert.equal(isOperationalNotice(record({
    Name: "Bushfires NT launches new Strategic Bushfire Management Plan",
    Subject: "New strategic bushfire plan",
  })), false);
  assert.equal(isOperationalNotice(record({
    Name: "Seasonal bushfire outlook - Spring",
    Subject: "Latest seasonal bushfire outlook",
  })), false);
  assert.equal(isOperationalNotice(record({
    Name: "Inaugural Women in Fire and Emergency Services Award",
    Subject: "Award recognises trailblazing leader",
  })), false);
});

test("recognizes the NTES duty officer email stored in FromName", () => {
  assert.equal(isOperationalNotice(record({
    Name: "Duty officer update",
    Subject: "Operational update",
    FromName: "Territorydutyofficer.NTES@pfes.nt.gov.au",
  })), true);
});

test("deduplicates campaigns by source precedence while retaining lineage", () => {
  const feeds = [
    { source: "WoG", items: [record({ Subject: "WoG title" })] },
    { source: "SecureNT", items: [record({ Subject: "SecureNT title" })] },
    { source: "NTES", items: [record({ Subject: "NTES title" })] },
    { source: "Bushfires NT", items: [record({ Subject: "Bushfires title" })] },
  ];

  assert.deepEqual(curateFeeds(feeds), [{
    id: "campaign-1",
    campaignId: "campaign-1",
    title: "Bushfires title",
    name: "AWS Flood Advice - Daly River",
    fromName: "NT Fire and Emergency Services",
    publishedAt: "2026-11-08 09:00:00",
    sources: ["Bushfires NT", "NTES", "SecureNT", "WoG"],
    source: "Bushfires NT",
    url: "http://createsend.com/campaign-1",
    regions: ["Big Rivers"],
    emergencyTypes: ["Bushfire", "Flooding"],
    warningLevel: "Advice",
  }]);
});

test("extracts multiple regions and hazards from names and subjects", () => {
  assert.deepEqual(classifyNotice({
    Name: "AWS Storm Watch and Act - Lasseter and Tanami districts",
    Subject: "Flooding - Katherine and Alice Springs",
  }), {
    regions: ["Big Rivers", "Central Australia"],
    emergencyTypes: ["Flooding", "Severe storm"],
    warningLevel: "Watch and act",
  });
  assert.deepEqual(classifyNotice({ Subject: "Bushfires NT Advice - Acacia Hills" }), {
    regions: ["Darwin, Palmerston and Litchfield"], emergencyTypes: ["Bushfire"], warningLevel: "Advice",
  });
});

test("keeps ambiguous classifications unknown and avoids highway region guesses", () => {
  assert.deepEqual(classifyNotice({ Subject: "Emergency update - Stuart Highway", FromName: "NT Fire and Emergency Services" }), {
    regions: ["Not identified"], emergencyTypes: ["Not identified"], warningLevel: "Not identified",
  });
  assert.deepEqual(classifyNotice({ Subject: "Advice - Barkly Highway" }).regions, ["Not identified"]);
});

test("recognizes warning variants and reduced threats without treating generic warnings as emergency warnings", () => {
  assert.equal(classifyNotice({ Subject: "Bushfire Emergency Warning - Katherine" }).warningLevel, "Emergency warning");
  assert.equal(classifyNotice({ Subject: "Watch & Act - Darwin" }).warningLevel, "Watch and act");
  assert.equal(classifyNotice({ Subject: "Advice - Decreasing threat - Katherine" }).warningLevel, "Decreasing threat");
  assert.equal(classifyNotice({ Subject: "Cyclone warning - Darwin" }).warningLevel, "Not identified");
  assert.equal(classifyNotice({ Subject: "Flood Emergency Warning", Name: "Flood Advice Decreasing threat" }).warningLevel, "Emergency warning");
  assert.deepEqual(classifyNotice({ Subject: "Flood Advice - Camooweal" }).regions, ["Not identified"]);
});

test("combines filter groups with OR within each group and AND between groups", () => {
  const items = curateFeeds([{ source: "NTES", items: [
    record({ CampaignID: "daly" }),
    record({ CampaignID: "alice", Name: "Storm Emergency Warning - Alice Springs", Subject: "Storm Emergency Warning - Alice Springs" }),
  ] }]);
  const selected = filterAndSortNotices(items, {
    sources: ["NTES"], regions: ["Big Rivers", "Central Australia"], emergencyTypes: ["Flooding"], warningLevels: ["Advice"],
  });
  assert.deepEqual(selected.map((item) => item.campaignId), ["daly"]);
  assert.equal(filterAndSortNotices(items, { regions: ["East Arnhem"] }).length, 0);
  assert.equal(filterAndSortNotices(items, { query: "central australia" }).length, 1);
});

test("sorts dates, titles and warning severity without mutating input, leaving missing dates last", () => {
  const items = curateFeeds([{ source: "NTES", items: [
    record({ CampaignID: "older", Subject: "B Flood Advice", SentDate: "2026-11-07 09:00:00" }),
    record({ CampaignID: "newer", Subject: "A Flood Emergency Warning", SentDate: "2026-11-08 09:00:00" }),
    record({ CampaignID: "undated", SentDate: "" }),
  ] }]);
  for (const order of ["newest", "oldest", "level", "title"]) {
    const sorted = filterAndSortNotices(items, { order });
    assert.equal(sorted[0].campaignId, order === "oldest" ? "older" : "newer");
    if (order === "newest" || order === "oldest") assert.equal(sorted.at(-1).campaignId, "undated");
  }
  assert.deepEqual(items.map((item) => item.campaignId), ["newer", "older", "undated"]);
});

test("items without campaign IDs remain distinct", () => {
  const feeds = [
    { source: "NTES", items: [record({ CampaignID: "" })] },
    { source: "NTES", items: [record({ CampaignID: "" })] },
  ];

  assert.equal(curateFeeds(feeds).length, 2);
});

test("sorts curated records newest-first with missing dates last", () => {
  const items = curateFeeds([{
    source: "SecureNT",
    items: [
      record({ CampaignID: "older", Subject: "Flood Advice - Daly River", SentDate: "2026-11-07 09:00:00" }),
      record({ CampaignID: "newer", Subject: "Flood Emergency Warning - Katherine", SentDate: "2026-11-08 09:00:00" }),
      record({ CampaignID: "undated", Subject: "Flood Watch and Act - Barkly", SentDate: "" }),
    ],
  }]);

  assert.deepEqual(items.map((item) => item.campaignId), ["newer", "older", "undated"]);
});
