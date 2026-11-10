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
    { source: "Bushfires NT", items: [record({ Subject: "Bushfires title" })] },
    { source: "NTES", items: [record({ Subject: "NTES title" })] },
    { source: "NTG agencies", items: [record({ Subject: "NTG agencies title" })] },
  ];

  assert.deepEqual(curateFeeds(feeds), [{
    id: "campaign-1",
    campaignId: "campaign-1",
    title: "Bushfires title",
    name: "AWS Flood Advice - Daly River",
    fromName: "NT Fire and Emergency Services",
    publishedAt: "2026-11-08 09:00:00",
    sources: ["Bushfires NT", "NTES", "NTG agencies"],
    source: "Bushfires NT",
    url: "http://createsend.com/campaign-1",
    regions: ["Big Rivers"],
    emergencyTypes: ["Bushfire", "Flooding"],
    declarations: [],
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
    declarations: [],
    warningLevel: "Watch and act",
  });
    assert.deepEqual(classifyNotice({ Subject: "Bushfires NT Advice - Acacia Hills" }), {
      regions: ["Greater Darwin"], emergencyTypes: ["Bushfire"], declarations: [], warningLevel: "Advice",
  });
});

  test("maps BushfiresNT titles to Bushfire and Darwin localities to Greater Darwin", () => {
    const notice = classifyNotice({ title: "BushfiresNT Emergency Warning - Darwin" });
    assert.deepEqual(notice, {
      regions: ["Greater Darwin"], emergencyTypes: ["Bushfire"], declarations: [], warningLevel: "Emergency warning",
    });
    for (const place of ["Darwin", "Palmerston", "Litchfield"]) {
      assert.deepEqual(classifyNotice({ title: `Flood Advice - ${place}` }).regions, ["Greater Darwin"]);
    }
    const fireBan = classifyNotice({ title: "BushfiresNT Fire ban - Darwin" });
    assert.deepEqual(fireBan.emergencyTypes, ["Not identified"]);
    assert.deepEqual(fireBan.declarations, ["Fire ban"]);
  });

test("keeps ambiguous classifications unknown and avoids highway region guesses", () => {
  assert.deepEqual(classifyNotice({ Subject: "Emergency update - Stuart Highway", FromName: "NT Fire and Emergency Services" }), {
    regions: ["Not identified"], emergencyTypes: ["Not identified"], declarations: [], warningLevel: "Not identified",
  });
  assert.deepEqual(classifyNotice({ Subject: "Advice - Barkly Highway" }).regions, ["Not identified"]);
});

test("classifies explicit fire bans as declarations without emergency types or warning levels", () => {
  for (const wording of ["Fire ban", "TOTAL FIRE BAN", "Total fire bans"]) {
    for (const field of ["Subject", "Name", "title", "name"]) {
      const notice = { [field]: `${wording} - Darwin` };
      const classified = classifyNotice(notice);
      assert.deepEqual(classified.declarations, ["Fire ban"]);
      assert.deepEqual(classified.emergencyTypes, ["Not identified"]);
      assert.equal(classified.warningLevel, "Not identified");
      assert.equal(isOperationalNotice(notice), true);
    }
  }
  const classified = classifyNotice({ Subject: "Bushfires NT Advice - Total fire ban - Darwin" });
  assert.deepEqual(classified.declarations, ["Fire ban"]);
  assert.deepEqual(classified.emergencyTypes, ["Not identified"]);
  assert.equal(classified.warningLevel, "Not identified");
  for (const Subject of ["Fire danger period - Darwin", "Bushfire Advice - Darwin", "Fire banquet - Darwin"]) {
    assert.deepEqual(classifyNotice({ Subject }).declarations, []);
  }
});

test("filters declarations alone and in combination with existing filters", () => {
  const items = curateFeeds([{ source: "Bushfires NT", items: [
    record({ CampaignID: "darwin-ban", Name: "Total fire ban - Darwin", Subject: "Total fire ban Advice - Darwin" }),
    record({ CampaignID: "katherine-ban", Name: "Fire bans - Katherine", Subject: "Fire bans - Katherine" }),
    record({ CampaignID: "bushfire", Name: "Bushfire Advice - Darwin", Subject: "Bushfire Advice - Darwin" }),
    record({ CampaignID: "flood" }),
  ] }]);
  assert.equal(filterAndSortNotices(items).length, 4);
  assert.deepEqual(filterAndSortNotices(items, { declarations: ["Fire ban"] })
    .map((item) => item.campaignId), ["katherine-ban", "darwin-ban"]);
  assert.deepEqual(filterAndSortNotices(items, {
    declarations: ["Fire ban"], sources: ["Bushfires NT"],
    regions: ["Greater Darwin"],
    query: "Darwin", order: "title",
  }).map((item) => item.campaignId), ["darwin-ban"]);
  assert.deepEqual(filterAndSortNotices(items, { emergencyTypes: ["Bushfire"], warningLevels: ["Advice"] })
    .map((item) => item.campaignId), ["bushfire"]);
  assert.equal(filterAndSortNotices(items, { declarations: ["Fire ban"], emergencyTypes: ["Bushfire"] }).length, 0);
  assert.equal(filterAndSortNotices(items, { declarations: ["Fire ban"], warningLevels: ["Advice"] }).length, 0);
  assert.equal(filterAndSortNotices(items, { declarations: ["Fire ban"], emergencyTypes: ["Flooding"] }).length, 0);
  const fireBan = items.find((item) => item.campaignId === "darwin-ban");
  assert.equal(filterAndSortNotices([{ ...fireBan, title: "Update", name: "" }], { query: "fire ban" }).length, 1);
  const { declarations, ...legacyItem } = fireBan;
  assert.equal(filterAndSortNotices([legacyItem]).length, 1);
  assert.equal(filterAndSortNotices([legacyItem], { declarations: ["Fire ban"] }).length, 0);
});

test("preserves and searches structured town, street, and suburb values", () => {
  const [notice] = curateFeeds([{ source: "NTES", items: [record({
    CampaignID: "street-alert",
    Town: "Alice Springs",
    Street: "Todd Street",
    Suburb: "The Gap",
  })] }]);

  assert.deepEqual(notice.locationTerms, ["Alice Springs", "Todd Street", "The Gap"]);
  assert.deepEqual(filterAndSortNotices([notice], { query: "Todd Street" }), [notice]);
  assert.deepEqual(filterAndSortNotices([notice], { query: "The Gap" }), [notice]);
});

test("recognizes warning variants and reduced threats without treating generic warnings as emergency warnings", () => {
  assert.equal(classifyNotice({ Subject: "Bushfire Emergency Warning - Katherine" }).warningLevel, "Emergency warning");
  assert.equal(classifyNotice({ Subject: "Watch & Act - Darwin" }).warningLevel, "Watch and act");
  assert.equal(classifyNotice({ Subject: "Advice - Decreasing threat - Katherine" }).warningLevel, "Advice");
  assert.equal(classifyNotice({ Subject: "Cyclone warning - Darwin" }).warningLevel, "Not identified");
  assert.equal(classifyNotice({ Subject: "Flood Emergency Warning", Name: "Flood Advice Decreasing threat" }).warningLevel, "Emergency warning");
  assert.deepEqual(classifyNotice({ Subject: "Flood Advice - Camooweal" }).regions, ["Not identified"]);
});

test("maps decreasing-threat variants to Advice and includes them in the Advice filter", () => {
  for (const wording of ["Decreasing threat", "Decreasing threats", "Decreasing-threat", "Threat is reduced", "All clear"]) {
    assert.equal(classifyNotice({ Subject: `Flood ${wording} - Katherine` }).warningLevel, "Advice");
  }
  const items = curateFeeds([{ source: "NTES", items: [
    record({ CampaignID: "reduced", Name: "Flood Decreasing threat - Katherine", Subject: "Flood Decreasing threat - Katherine" }),
    record({ CampaignID: "reduced-plural", Name: "Flood Decreasing threats - Katherine", Subject: "Flood Decreasing threats - Katherine" }),
    record({ CampaignID: "advice" }),
  ] }]);
  assert.equal(items.length, 3);
  assert.ok(items.every((item) => item.warningLevel === "Advice"));
  assert.equal(filterAndSortNotices(items, { warningLevels: ["Advice"], order: "level" }).length, 3);
  assert.equal(filterAndSortNotices(items, { warningLevels: ["Decreasing threat"] }).length, 0);
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

test("deduplicates with Bushfires NT above NTES above NTG agencies", () => {
  const feeds = [
    { source: "NTG agencies", items: [record({ Subject: "NTG agencies title" })] },
  ];
  const [preferred] = curateFeeds(feeds);
  assert.equal(preferred.source, "NTG agencies");
  assert.deepEqual(preferred.sources, ["NTG agencies"]);
  const [bushfires] = curateFeeds([...feeds, { source: "Bushfires NT", items: [record({ Subject: "Bushfires title" })] }]);
  assert.equal(bushfires.source, "Bushfires NT");
  assert.deepEqual(bushfires.sources, ["Bushfires NT", "NTG agencies"]);
  const [ntes] = curateFeeds([...feeds, { source: "NTES", items: [record({ Subject: "NTES title" })] }]);
  assert.equal(ntes.source, "NTES");
  assert.deepEqual(ntes.sources, ["NTES", "NTG agencies"]);
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
    source: "NTES",
    items: [
      record({ CampaignID: "older", Subject: "Flood Advice - Daly River", SentDate: "2026-11-07 09:00:00" }),
      record({ CampaignID: "newer", Subject: "Flood Emergency Warning - Katherine", SentDate: "2026-11-08 09:00:00" }),
      record({ CampaignID: "undated", Subject: "Flood Watch and Act - Barkly", SentDate: "" }),
    ],
  }]);

  assert.deepEqual(items.map((item) => item.campaignId), ["newer", "older", "undated"]);
});
