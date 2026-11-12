import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Window } from "happy-dom";
import { fetchAirQuality, fetchAirQualityStations, parseAirQualityStations } from "./air-quality.mjs";
import worker from "./worker.js";
import { FIRE_AREA_CODES, FIRE_DANGER_URL, readFireDanger } from "./fire-danger.mjs";

const script = await readFile(new URL("./local-conditions.js", import.meta.url), "utf8");
const xml = await readFile(new URL("../../public/IDD60920.xml", import.meta.url), "utf8");
const fireDangerFixture = JSON.parse(await readFile(new URL("../../public/fire-danger-ratings.json", import.meta.url), "utf8"));
const fixture = `<product><observations>
  <station bom-id="014015" description="Darwin Airport" lat="-12.4239" lon="130.8925">
    <period index="0"><level type="surface"><element type="minimum_air_temperature">31.5</element><element type="maximum_air_temperature">35.6</element></level></period>
  </station>
  <station bom-id="014272" description="Batchelor" lat="-13.0544" lon="131.0252">
    <period index="0"><level type="surface"><element type="minimum_air_temperature">30.4</element><element type="maximum_air_temperature">36.3</element></level></period>
  </station>
  <station bom-id="014253" description="Channel Point" lat="-13.168" lon="130.25"><period index="0" /></station>
  <station bom-id="015590" description="Alice Springs Airport" lat="-23.7951" lon="133.8890"><period index="0" /></station>
  <station bom-id="missing" description="Missing coordinates"><period index="0" /></station>
  <station bom-id="invalid" description="Invalid coordinates" lat="91" lon="131.0252"><period index="0" /></station>
</observations></product>`;

function response(body, ok = true) {
  return { ok, status: ok ? 200 : 500, text: async () => body, json: async () => body };
}

const readingTimestamp = Date.parse("2026-11-08T11:30:00.000Z");
const epaFixture = { d: [
  { name: "Palmerston", serialCode: 1, IndexValue: 0, IndexColorStrHex: "#42A93C", IndexColorDescription: "Good" },
  { name: "Winnellie", serialCode: 2, IndexValue: 51, IndexColorStrHex: "#EEC900", IndexColorDescription: "Fair",
    pollutants: [
      { IndexValue: 999, IndexColorStrHex: "#FF0000", IndexColorDescription: "Poor", Date: `/Date(${readingTimestamp + 3600000})/` },
      { IndexValue: 51, Date: `/Date(${readingTimestamp})/` },
    ] },
  { name: "Stokes Hill", serialCode: 3, IndexValue: 64.5 },
  { name: "Katherine", serialCode: 4, IndexValue: 90 },
] };

test("fire-danger feed selects the mapped area and normalizes its severity", () => {
  assert.deepEqual(FIRE_AREA_CODES, {
    darwin: "NT_FW001",
    palmerston: "NT_FW001",
    "alice-springs": "NT_FW014",
    katherine: "NT_FW007",
    "tennant-creek": "NT_FW012",
    nhulunbuy: "NT_FW006",
    yulara: "NT_FW018",
  });
  const darwinWarning = fireDangerFixture.warnings.find((item) => item.area_code === FIRE_AREA_CODES.darwin);
  const aliceWarning = fireDangerFixture.warnings.find((item) => item.area_code === FIRE_AREA_CODES["alice-springs"]);
  assert.deepEqual(readFireDanger(fireDangerFixture, FIRE_AREA_CODES.darwin),
    { label: "Moderate", level: 1, issuedAt: darwinWarning.issuetime });
  assert.deepEqual(readFireDanger(fireDangerFixture, FIRE_AREA_CODES["alice-springs"]),
    { label: "No Rating", level: 0, issuedAt: aliceWarning.issuetime });
  assert.equal(readFireDanger(fireDangerFixture, "NT_FW999"), null);
  assert.equal(readFireDanger({}, "NT_FW001"), null);

  const levels = ["No Rating", "Moderate", "High", "Extreme", "Catastrophic"];
  for (const [level, severity] of levels.entries()) {
    assert.deepEqual(readFireDanger({ warnings: [{ area_code: "NT_FW001", severity_code: severity }] }, "NT_FW001"),
      { label: severity, level, issuedAt: null });
  }
});

test("production worker gets fire danger from the CMS feed independently of BOM temperatures", async () => {
  const originalFetch = globalThis.fetch;
  const originalCaches = globalThis.caches;
  const requestedUrls = [];
  globalThis.caches = { default: { match: async () => null, put: async () => {} } };
  globalThis.fetch = async (input) => {
    const url = String(input);
    requestedUrls.push(url);
    if (url === FIRE_DANGER_URL) return Response.json(fireDangerFixture);
    if (url.includes("/locations?search=")) {
      return Response.json({ data: [{ state: "NT", geohash: "r1r0f0" }] });
    }
    if (url.includes("/forecasts/daily")) {
      return Response.json({ data: [{ temp_min: 25, temp_max: 34 }] });
    }
    return new Response("", { status: 200 });
  };

  try {
    const response = await worker.fetch(new Request("https://worker.example/?location=darwin"));
    const body = await response.json();
    assert.deepEqual(body.fireDanger, readFireDanger(fireDangerFixture, FIRE_AREA_CODES.darwin));
    assert.deepEqual(body.temperature, { min: 25, max: 34 });
    assert.ok(requestedUrls.includes(FIRE_DANGER_URL));
    assert.ok(requestedUrls.some((url) => url.includes("/forecasts/daily")));
  } finally {
    globalThis.fetch = originalFetch;
    if (originalCaches === undefined) delete globalThis.caches;
    else globalThis.caches = originalCaches;
  }
});

test("EPA reads station-level JSON indices and rejects invalid or missing readings", () => {
  assert.deepEqual(parseAirQualityStations(epaFixture), [
    { id: 1, name: "Palmerston", index: 0, colour: "#42A93C", category: "Good", time: null },
    { id: 2, name: "Winnellie", index: 51, colour: "#EEC900", category: "Fair", time: "2026-11-08T11:30:00.000Z" },
    { id: 3, name: "Stokes Hill", index: 64.5, colour: null, category: null, time: null },
    { id: 4, name: "Katherine", index: 90, colour: null, category: null, time: null },
  ]);
  for (const value of [undefined, null, "", "N/A", -9999, Infinity]) {
    assert.equal(parseAirQualityStations({ d: [{ name: "Katherine", serialCode: 4, IndexValue: value }] })[0].index, null);
  }
  assert.deepEqual(parseAirQualityStations({ d: [null, { name: "Other", serialCode: 5 }, ...epaFixture.d, ...epaFixture.d] }),
    parseAirQualityStations(epaFixture));
  for (const data of [null, {}, { d: "invalid" }]) assert.throws(() => parseAirQualityStations(data));
});

test("EPA fetches the JSON source and selects each station by serialCode", async () => {
  const requests = [];
  const fetcher = async (url, options) => {
    requests.push(url);
    assert.equal(options.headers.Accept, "application/json");
    assert.ok(options.signal instanceof AbortSignal);
    return response(JSON.stringify(epaFixture));
  };
  for (const id of [1, 2, 3, 4]) {
    const station = parseAirQualityStations(epaFixture)[id - 1];
    assert.deepEqual(await fetchAirQuality(id, fetcher), { index: station.index, colour: station.colour,
      category: station.category, station: station.name, time: station.time });
    assert.equal(requests.at(-1), "https://api.brainiumlabs.com.au/ntepa/stationindex.json");
  }
  for (const id of [null, undefined, "", 0, 5, "2&other=1", "02"]) {
    await assert.rejects(fetchAirQuality(id, fetcher), RangeError);
  }
  assert.equal(requests.length, 4);
  await assert.rejects(fetchAirQuality(2, async () => response("", false)), /request failed/);
  await assert.rejects(fetchAirQuality(2, async () => { throw new Error("offline"); }), /offline/);
  assert.deepEqual(await fetchAirQualityStations(fetcher), parseAirQualityStations(epaFixture));
  await assert.rejects(fetchAirQuality(2, async () => response('{"d":[]}')), /Missing/);
  await assert.rejects(fetchAirQualityStations(async () => response("not JSON")), SyntaxError);
});

async function settle() {
  await new Promise((resolve) => setImmediate(resolve));
}

test("AQI timestamp uses the latest valid matching pollutant, not unrelated readings", () => {
  const row = { ...epaFixture.d[1], pollutants: [
    ...epaFixture.d[1].pollutants,
    { IndexValue: 51, Date: `/Date(${readingTimestamp - 3600000}+0930)/` },
    { IndexValue: 51, Date: "invalid" },
    { IndexValue: 51, Date: "/Date(999999999999999999999)/" },
  ] };
  assert.equal(parseAirQualityStations({ d: [row] })[0].time, "2026-11-08T11:30:00.000Z");
  for (const pollutants of [undefined, [], [{ IndexValue: 999, Date: `/Date(${readingTimestamp})/` }]]) {
    assert.equal(parseAirQualityStations({ d: [{ ...row, pollutants }] })[0].time, null);
  }
});

async function widget({ url = "http://localhost:5173/", saved, feed = fixture, observations, worker, air, catalog, geolocation, timers } = {}) {
  const window = new Window({ url });
  window.document.body.innerHTML = `
    <section id="local-conditions" data-endpoint="/api/local-conditions">
      <select class="lc-select"><option value="old">Old option</option></select>
      <button class="lc-use-location">Use location</button>
      <div class="lc-cards"></div><p class="lc-status"></p>
      <p class="lc-attribution">Source: Bureau of Meteorology and NT Environment Protection Authority.</p>
    </section>`;
  if (saved) window.localStorage.setItem("securent.localConditions.location", saved);
  if (geolocation) Object.defineProperty(window.navigator, "geolocation", { value: geolocation });
  if (timers) {
    window.setTimeout = timers.setTimeout;
    window.clearTimeout = timers.clearTimeout;
  }
  const requests = [];
  window.fetch = (input, options) => {
    const request = String(input);
    requests.push(request);
    if (request.includes("IDD60920.xml") || request.includes("1657184")) {
      return observations ? observations(options) : Promise.resolve(response(feed));
    }
    if (request === FIRE_DANGER_URL) return Promise.resolve(response(fireDangerFixture));
    if (request === "/api/air-quality") {
      return catalog ? catalog(options) : Promise.resolve(response({ stations: parseAirQualityStations(epaFixture) }));
    }
    if (request === "./?a=1657186") {
      const first = requests.filter((item) => item === request).length === 1;
      if (first) return catalog ? catalog(options) : Promise.resolve(response(epaFixture));
      return air ? air(request) : Promise.resolve(response(epaFixture));
    }
    if (request.includes("/api/air-quality")) {
      return air ? air(request) : Promise.resolve(response({}));
    }
    return worker ? worker(request) : Promise.resolve(response({}));
  };
  window.eval(script);
  await settle();
  return { window, requests, select: window.document.querySelector(".lc-select") };
}

function selectLocation(context, key) {
  context.select.value = key;
  context.select.dispatchEvent(new context.window.Event("change"));
}

test("catalog loading uses skeleton cards without a loading message", async () => {
  let resolveObservations;
  let resolveCatalog;
  const context = await widget({
    observations: () => new Promise((resolve) => { resolveObservations = resolve; }),
    catalog: () => new Promise((resolve) => { resolveCatalog = resolve; }),
  });
  const cards = context.window.document.querySelector(".lc-cards");
  assert.equal(cards.getAttribute("aria-busy"), "true");
  assert.equal(cards.querySelectorAll(".lc-skeleton-group").length, 3);
  assert.equal(cards.querySelectorAll('.lc-skeleton-group[aria-hidden="true"]').length, 3);
  assert.equal(context.window.document.querySelector(".lc-status").textContent, "");
  resolveObservations(response(fixture));
  resolveCatalog(response({ stations: parseAirQualityStations(epaFixture) }));
  await settle();
  assert.equal(cards.querySelectorAll(".lc-skeleton-group").length, 0);
});

function cardFor(context, title) {
  return Array.from(context.window.document.querySelectorAll(".lc-card")).find((card) =>
    card.querySelector(".lc-card__title")?.textContent === title) || null;
}

function groupFor(context, title) {
  const card = cardFor(context, title);
  return card ? card.closest(".lc-card-group") : null;
}

test("the feed populates every station and shows its observed temperatures", async () => {
  const context = await widget({
    worker: () => Promise.resolve(response({ fireDanger: { label: "Moderate", level: 1 } })),
    air: () => Promise.resolve(response({ index: 0 })),
  });
  assert.equal(context.requests[0], "/IDD60920.xml");
  assert.equal(context.select.options.length, 10);
  assert.equal(context.select.querySelector('[value="014272"]').dataset.coordinates, "-13.0544,131.0252");
  assert.equal(context.select.querySelector('[value="missing"]').dataset.coordinates, "");
  assert.equal(context.select.querySelector('[value="invalid"]').dataset.coordinates, "");
  assert.equal(context.select.value, "014015");
  assert.equal(context.select.selectedOptions[0].textContent, "Darwin Airport");
  assert.match(context.window.document.querySelector(".lc-cards").textContent, /32 °C/);
  assert.match(context.window.document.querySelector(".lc-cards").textContent, /36 °C/);
  assert.doesNotMatch(context.window.document.querySelector(".lc-cards").textContent, /Observed temperatures/);
  const temperatures = context.window.document.querySelectorAll(".lc-temp-row .lc-temp");
  assert.equal(temperatures.length, 2);
  assert.match(temperatures[0].textContent, /Observed minimum 32 °C/);
  assert.match(temperatures[1].textContent, /Observed maximum 36 °C/);
  assert.ok(temperatures[0].querySelector(".fa-caret-down"));
  assert.ok(temperatures[1].querySelector(".fa-caret-up"));
  assert.equal(temperatures[0].querySelector("i").getAttribute("aria-hidden"), "true");
  const groups = context.window.document.querySelectorAll(".lc-card-group");
  assert.deepEqual(Array.from(groups, (group) => group.querySelector(".lc-attribution").textContent),
    ["Source: Bushfires NT", "Source: NTEPA", "Source: Bureau of Meteorology"]);
  assert.equal(context.window.document.querySelectorAll(".lc-attribution").length, 3);
  assert.equal(context.window.document.querySelectorAll(".lc-card .lc-attribution").length, 0);
  assert.equal(groups[0].querySelector("a").href, "https://www.pfes.nt.gov.au/incidentmap");
  assert.equal(groups[1].querySelector("a").href, "https://ntepa.nt.gov.au/");
  assert.equal(groups[2].querySelector("a").href, "https://www.bom.gov.au/location/australia/northern-territory#observations");
  selectLocation(context, "014253");
  assert.equal(context.window.document.querySelectorAll(".lc-card-group").length, 0);
  assert.equal(context.window.document.querySelectorAll(".lc-attribution").length, 0);
  assert.equal(context.requests.length, 4);
});

test("temperature remains available when only one bound is present", async () => {
  const partial = fixture.replace('<element type="maximum_air_temperature">35.6</element>', "");
  const context = await widget({ feed: partial });
  const temperature = cardFor(context, "Temperature");
  assert.ok(temperature);
  assert.match(temperature.textContent, /32 °C/);
  assert.match(temperature.textContent, /Observed maximum –/);
  assert.equal(groupFor(context, "Temperature").querySelector(".lc-attribution").textContent,
    "Source: Bureau of Meteorology");
});

test("localhost fetches the matching EPA station and displays an index, not PM2.5", async () => {
  const context = await widget({
    feed: xml,
    air: (url) => Promise.resolve(response({ index: url.endsWith("id=2") ? 51 : 64 })),
    worker: () => Promise.resolve(response({ fireDanger: { label: "Moderate", level: 1 },
      airQuality: { category: "Fair", pm25: 999 } })),
  });
  assert.ok(context.requests.includes("/api/air-quality?id=2"));
  const airCard = () => cardFor(context, "Air quality monitor");
  assert.match(airCard().textContent, /51 Index/);
  assert.doesNotMatch(airCard().textContent, /PM2\.5|Fair|999/);
  selectLocation(context, "014072");
  await settle();
  assert.ok(context.requests.includes("/api/air-quality?id=3"));
  assert.match(airCard().textContent, /64 Index/);
  const count = context.requests.length;
  selectLocation(context, "014253");
  await settle();
  assert.equal(context.requests.length, count);
  assert.equal(airCard(), null);
  assert.equal(groupFor(context, "Air quality monitor"), null);
});

test("production requests the JSON Matrix asset and selects the station index", async () => {
  for (const value of [0, 64.5]) {
    const context = await widget({ url: "https://example.com/conditions",
      air: () => Promise.resolve(response({ d: [
        { serialCode: 1, IndexValue: 999 }, { serialCode: 2, IndexValue: value },
      ] })),
    });
    assert.ok(context.requests.includes("./?a=1657186"));
    assert.equal(context.requests.some((url) => url.includes("1657178") || url.includes("1657186?id")), false);
    assert.match(cardFor(context, "Air quality monitor").textContent,
      new RegExp(Number(value) + " Index"));
  }
});

test("air quality displays the station colour and description in both environments", async () => {
  for (const local of [true, false]) {
    for (const [id, category, colour] of [[1, "Good", "#42A93C"], [2, "Fair", "#EEC900"]]) {
      const station = parseAirQualityStations(epaFixture)[id - 1];
      const context = await widget({
        url: local ? "http://localhost/" : "https://example.com/conditions",
        saved: "epa-" + id,
        air: () => Promise.resolve(response(local ? station : epaFixture)),
      });
      const card = cardFor(context, "Air quality monitor");
      assert.equal(card.querySelector(".lc-air").textContent, category);
      assert.equal(card.querySelector(".lc-air__dot").style.backgroundColor, colour);
      assert.equal(card.querySelector(".lc-air__dot").getAttribute("aria-hidden"), "true");
      assert.doesNotMatch(card.textContent, /Poor|999/);
    }
  }
});

test("available AQI source includes the station and reading date/time in NT time", async () => {
  for (const local of [true, false]) {
    const station = parseAirQualityStations(epaFixture)[1];
    const context = await widget({
      url: local ? "http://localhost/" : "https://example.com/conditions",
      air: () => Promise.resolve(response(local
        ? { index: station.index, station: station.name, time: station.time }
        : epaFixture)),
    });
    const source = groupFor(context, "Air quality monitor").querySelector(".lc-attribution");
    assert.match(source.textContent, /Source: NTEPA, Winnellie, 08\/11\/2026, 21:00 ACST/);
    assert.equal(source.querySelector("a").href, "https://ntepa.nt.gov.au/");
    assert.equal(source.querySelector("time").dateTime, station.time);
  }
});

test("unavailable AQI omits its card and source; valid readings do not fabricate timestamps", async () => {
  for (const index of [null, 0]) {
    for (const time of [null, "invalid", "2026-11-08T11:30:00.000Z"]) {
      const context = await widget({ air: () => Promise.resolve(response({ index, station: "Winnellie", time })) });
      const group = groupFor(context, "Air quality monitor");
      if (index === null) {
        assert.equal(group, null);
        assert.equal(cardFor(context, "Air quality monitor"), null);
        continue;
      }
      const source = group.querySelector(".lc-attribution");
      assert.match(source.textContent, /Source: NTEPA, Winnellie/);
      assert.equal(Boolean(source.querySelector("time")), index === 0 && time === "2026-11-08T11:30:00.000Z");
    }
  }
});

test("missing descriptions and invalid colours do not hide the air-quality index", async () => {
  for (const local of [true, false]) {
    for (const category of [null, "Good"]) {
      const context = await widget({
        url: local ? "http://localhost/" : "https://example.com/conditions",
        air: () => Promise.resolve(response(local
          ? { index: 51, colour: "url(invalid)", category }
          : { d: [{ serialCode: 2, IndexValue: 51, IndexColorStrHex: "url(invalid)", IndexColorDescription: category }] })),
      });
      const card = cardFor(context, "Air quality monitor");
      assert.match(card.textContent, /51 Index/);
      if (category) assert.equal(card.querySelector(".lc-air__dot").style.backgroundColor, "#999999");
      else assert.equal(card.querySelector(".lc-air"), null);
    }
  }
});

test("air failures and invalid readings preserve fire danger and temperatures", async () => {
  for (const value of [null, "", " ", "N/A", "Infinity", "<b>51</b>", -1, false, {}]) {
    for (const local of [true, false]) {
      const context = await widget({
        url: local ? "http://localhost/" : "https://example.com/conditions",
        air: () => Promise.resolve(response(local ? { index: value } : { d: [{ serialCode: 2, IndexValue: value }] })),
        worker: () => Promise.resolve(response({ fireDanger: { label: "Moderate", level: 1 } })),
      });
      assert.equal(cardFor(context, "Air quality monitor"), null);
      assert.equal(groupFor(context, "Air quality monitor"), null);
      assert.ok(cardFor(context, "Bushfire danger rating"));
      assert.ok(cardFor(context, "Temperature"));
      assert.match(context.window.document.querySelector(".lc-cards").textContent, /Moderate/);
      assert.match(context.window.document.querySelector(".lc-cards").textContent, /36 °C/);
      assert.equal(context.window.document.querySelector(".lc-cards").hasAttribute("aria-busy"), false);
    }
  }
  for (const air of [() => Promise.reject(new Error("offline")), () => Promise.resolve(response("", false))]) {
    const context = await widget({ air, worker: () => Promise.resolve(response({ fireDanger: { label: "Moderate", level: 1 } })) });
    assert.match(context.window.document.querySelector(".lc-cards").textContent, /Moderate/);
    assert.match(context.window.document.querySelector(".lc-cards").textContent, /36 °C/);
  }
});

test("air quality loads independently while fire danger is pending or failed", async () => {
  let resolveWorker;
  const context = await widget({
    worker: () => new Promise((resolve) => { resolveWorker = resolve; }),
    air: () => Promise.resolve(response({ index: 0 })),
  });
  const cards = context.window.document.querySelector(".lc-cards");
  assert.match(cards.textContent, /0 Index/);
  assert.equal(cardFor(context, "Bushfire danger rating"), null);
  assert.equal(groupFor(context, "Bushfire danger rating"), null);
  assert.equal(cards.querySelectorAll(".lc-skeleton-group").length, 1);
  assert.equal(cards.getAttribute("aria-busy"), "true");
  resolveWorker(response("", false));
  await settle();
  assert.match(cards.textContent, /0 Index/);
  assert.equal(groupFor(context, "Bushfire danger rating"), null);
  assert.equal(cards.querySelectorAll(".lc-skeleton-group").length, 0);
  assert.equal(cards.hasAttribute("aria-busy"), false);
  assert.equal(context.window.document.querySelector(".lc-status").textContent, "");
});

test("late EPA success or failure cannot overwrite a newer location", async () => {
  for (const failed of [false, true]) {
    let resolveAir;
    const context = await widget({
      feed: xml,
      air: (url) => url.endsWith("id=2")
        ? new Promise((resolve) => { resolveAir = resolve; })
        : Promise.resolve(response({ index: 64 })),
    });
    selectLocation(context, "014072");
    await settle();
    resolveAir(response({ index: 999 }, !failed));
    await settle();
    const cards = context.window.document.querySelector(".lc-cards");
    assert.match(cards.textContent, /64 Index/);
    assert.doesNotMatch(cards.textContent, /999/);
    selectLocation(context, "014015");
    selectLocation(context, "014253");
    resolveAir(response({ index: 999 }, !failed));
    await settle();
    assert.equal(cardFor(context, "Air quality monitor"), null);
    assert.equal(groupFor(context, "Air quality monitor"), null);
    assert.equal(cards.hasAttribute("aria-busy"), false);
  }
});

test("the checked-in BOM snapshot populates every station", async () => {
  const context = await widget({ feed: xml });
  const document = new context.window.DOMParser().parseFromString(xml, "application/xml");
  const stations = Array.from(document.querySelectorAll("observations > station"));
  assert.ok(stations.length > 0);
  assert.equal(context.select.options.length, stations.length + 4);
  assert.deepEqual(
    Array.from(context.select.options, (option) => option.value).filter((key) => !key.startsWith("epa-")).sort(),
    stations.map((station) => station.getAttribute("bom-id")).sort(),
  );
});

test("localhost adds all missing EPA locations and restores their selections", async () => {
  const context = await widget({
    saved: "epa-4",
    air: (url) => Promise.resolve(response({ index: epaFixture.d[Number(url.split("id=")[1]) - 1].IndexValue })),
  });
  assert.equal(context.select.value, "epa-4");
  for (const station of epaFixture.d) {
    const option = context.select.querySelector(`[value="epa-${station.serialCode}"]`);
    assert.equal(option.textContent, station.name);
    assert.equal(option.dataset.coordinates, "");
    selectLocation(context, option.value);
    await settle();
    assert.ok(context.requests.includes(`/api/air-quality?id=${station.serialCode}`));
    assert.match(cardFor(context, "Air quality monitor").textContent,
      new RegExp(station.IndexValue + " Index"));
    assert.equal(cardFor(context, "Temperature"), null);
    assert.equal(groupFor(context, "Temperature"), null);
  }
});

test("EPA locations merge by name without duplicating or losing existing BOM data", async () => {
  const feed = fixture.replace("Batchelor", "Palmerston");
  const context = await widget({ feed,
    catalog: () => Promise.resolve(response({ stations: [
      ...parseAirQualityStations(epaFixture), { id: 1, name: "PALMERSTON", index: 0 },
    ] })),
    air: () => Promise.resolve(response({ index: 0 })),
  });
  assert.equal(Array.from(context.select.options).filter((option) => option.textContent.toLowerCase() === "palmerston").length, 1);
  assert.equal(context.select.querySelector('[value="epa-1"]'), null);
  selectLocation(context, "014272");
  await settle();
  assert.ok(context.requests.includes("/api/air-quality?id=1"));
  assert.match(cardFor(context, "Air quality monitor").textContent, /0 Index/);
  assert.match(cardFor(context, "Temperature").textContent, /36 °C/);
});

test("catalog failures keep the original BOM locations usable", async () => {
  for (const catalog of [() => Promise.reject(new Error("offline")),
    () => Promise.resolve(response({}, false)), () => Promise.resolve(response({}))]) {
    const context = await widget({ catalog });
    assert.equal(context.select.options.length, 6);
    assert.equal(context.select.disabled, false);
    assert.match(context.window.document.querySelector(".lc-cards").textContent, /36 °C/);
  }
  const production = await widget({ url: "https://example.com/conditions" });
  assert.equal(production.select.options.length, 10);
  assert.ok(production.requests.includes("./?a=1657186"));
  assert.equal(production.requests.includes("/api/air-quality"), false);
});

test("production adds and restores EPA-only locations from the cached JSON asset", async () => {
  const context = await widget({ url: "https://example.com/conditions", saved: "epa-4" });
  assert.equal(context.select.value, "epa-4");
  assert.match(cardFor(context, "Air quality monitor").textContent, /90 Index/);
  selectLocation(context, "epa-1");
  await settle();
  assert.match(cardFor(context, "Air quality monitor").textContent, /0 Index/);
  assert.equal(context.requests.filter((url) => url === "./?a=1657186").length, 3);
});

test("production uses the Matrix asset and restores saved or legacy selections", async () => {
  const context = await widget({ url: "https://example.com/conditions", saved: "alice-springs" });
  assert.equal(context.requests[0], "./?a=1657184");
  assert.equal(context.select.value, "015590");
  assert.equal(context.window.localStorage.getItem("securent.localConditions.location"), "015590");
  assert.ok(context.requests.includes(FIRE_DANGER_URL));
  const saved = await widget({ saved: "014253" });
  assert.equal(saved.select.value, "014253");
});

test("production reads mapped fire ratings from the CMS integration directly", async () => {
  const context = await widget({ url: "https://cmsexternal.nt.gov.au/securent/home", saved: "015590" });
  assert.ok(context.requests.includes(FIRE_DANGER_URL));
  assert.equal(context.requests.some((url) => url.includes("/api/local-conditions")), false);
  const card = cardFor(context, "Bushfire danger rating");
  assert.match(card.textContent, /No Rating/);
  const warning = fireDangerFixture.warnings.find((item) => item.area_code === FIRE_AREA_CODES["alice-springs"]);
  const issuedDate = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Darwin", day: "2-digit", month: "2-digit", year: "numeric",
  }).format(new Date(warning.issuetime));
  assert.match(card.textContent, new RegExp("Issue date: " + issuedDate));
});

test("worker failures cannot hide BOM temperatures or replace them with worker data", async () => {
  const failed = await widget({ worker: () => Promise.reject(new Error("unavailable")) });
  assert.match(failed.window.document.querySelector(".lc-cards").textContent, /36 °C/);
  const mocked = await widget({ worker: () => Promise.resolve(response({ temperature: { min: 99, max: 100 } })) });
  assert.match(mocked.window.document.querySelector(".lc-cards").textContent, /36 °C/);
  assert.doesNotMatch(mocked.window.document.querySelector(".lc-cards").textContent, /100 °C/);
});

test("late worker responses do not overwrite a newer selection", async () => {
  let resolveWorker;
  const context = await widget({ worker: () => new Promise((resolve) => { resolveWorker = resolve; }) });
  selectLocation(context, "014272");
  resolveWorker(response({ fireDanger: { label: "Incorrect", level: 1 } }));
  await settle();
  const text = context.window.document.querySelector(".lc-cards").textContent;
  assert.match(text, /36 °C/);
  assert.doesNotMatch(text, /Incorrect/);
});

test("geolocation selects the nearest station from the feed", async () => {
  const geolocation = { getCurrentPosition: (success) => success({ coords: { latitude: -13.05, longitude: 131.02 } }) };
  const context = await widget({ geolocation });
  context.window.document.querySelector(".lc-use-location").click();
  assert.equal(context.select.value, "014272");
  assert.equal(context.window.localStorage.getItem("securent.localConditions.location"), "014272");
  assert.match(context.window.document.querySelector(".lc-cards").textContent, /36 °C/);
});

test("geolocation finds the nearest station across the antimeridian", async () => {
  const geolocation = { getCurrentPosition: (success) => success({ coords: { latitude: 0, longitude: 179.9 } }) };
  const feed = `<product><observations>
    <station bom-id="farther" description="Farther" lat="0" lon="170" />
    <station bom-id="nearest" description="Nearest" lat="0" lon="-179.9" />
  </observations></product>`;
  const context = await widget({ geolocation, feed });
  context.window.document.querySelector(".lc-use-location").click();
  assert.equal(context.select.value, "nearest");
});

test("geolocation is disabled when no stations have usable coordinates", async () => {
  const geolocation = { getCurrentPosition: (success) => success({ coords: { latitude: 0, longitude: 0 } }) };
  const feed = '<product><observations><station bom-id="missing" description="Missing coordinates" /></observations></product>';
  const context = await widget({ geolocation, feed });
  assert.equal(context.window.document.querySelector(".lc-use-location").disabled, true);
  context.window.document.querySelector(".lc-use-location").click();
  assert.equal(context.select.value, "missing");
  assert.equal(context.window.document.querySelector(".lc-status").textContent, "");
});

test("invalid or empty feeds leave controls disabled when EPA also fails", async () => {
  for (const feed of ["not xml", "<product><observations /></product>"]) {
    const context = await widget({ feed, catalog: () => Promise.reject(new Error("offline")) });
    assert.equal(context.select.disabled, true);
    assert.equal(context.select.options.length, 0);
    assert.match(context.window.document.querySelector(".lc-status").textContent, /locations are currently unavailable/);
  }
});

test("BOM failures still populate EPA locations and display their readings", async () => {
  const failures = [
    () => Promise.reject(new Error("offline")),
    () => Promise.resolve(response("", false)),
    () => Promise.resolve(response("<!DOCTYPE html><html><body>Temperatures</body></html>")),
    () => Promise.resolve(response("not xml")),
    () => Promise.resolve(response("<product><observations /></product>")),
  ];
  for (const local of [true, false]) {
    for (const observations of failures) {
      const context = await widget({
        url: local ? "http://localhost/" : "https://example.com/conditions",
        saved: "epa-2", observations,
        air: () => Promise.resolve(response(local
          ? { ...parseAirQualityStations(epaFixture)[1], station: "Winnellie" } : epaFixture)),
      });
      assert.ok(context.requests.includes(local ? "/api/air-quality" : "./?a=1657186"));
      assert.equal(context.select.disabled, false);
      assert.equal(context.select.options.length, 4);
      assert.equal(context.select.value, "epa-2");
      assert.equal(context.window.document.querySelector(".lc-use-location").disabled, true);
      const airCard = cardFor(context, "Air quality monitor");
      assert.match(airCard.textContent, /51 Index/);
      assert.equal(airCard.querySelector(".lc-air").textContent, "Fair");
      assert.equal(cardFor(context, "Temperature"), null);
      assert.equal(groupFor(context, "Temperature"), null);
      assert.match(groupFor(context, "Air quality monitor").querySelector(".lc-attribution").textContent, /Winnellie/);
    }
  }
});

test("catalog timeouts preserve the other feed and ignore late results", async () => {
  for (const stalled of ["observations", "catalog"]) {
    const pendingTimers = new Map();
    const timers = {
      setTimeout(callback, delay) {
        assert.equal(delay, 30000);
        const key = {};
        pendingTimers.set(key, callback);
        return key;
      },
      clearTimeout(key) { pendingTimers.delete(key); },
    };
    let resolveRequest;
    let signal;
    const context = await widget({ timers,
      [stalled]: (options) => {
        signal = options.signal;
        return new Promise((resolve) => { resolveRequest = resolve; });
      },
      air: () => Promise.resolve(response({ index: 51 })),
    });
    assert.deepEqual(context.requests.slice(0, 2), ["/IDD60920.xml", "/api/air-quality"]);
    assert.equal(context.select.disabled, false);
    assert.equal(pendingTimers.size, 1);
    Array.from(pendingTimers.values())[0]();
    await settle();
    assert.equal(signal.aborted, true);
    assert.equal(pendingTimers.size, 0);
    assert.equal(context.select.disabled, false);
    assert.equal(context.select.options.length, stalled === "observations" ? 4 : 6);
    if (stalled === "observations") {
      assert.match(cardFor(context, "Air quality monitor").textContent, /51 Index/);
    } else {
      assert.match(cardFor(context, "Temperature").textContent, /36 °C/);
    }
    const keys = Array.from(context.select.options, (option) => option.value);
    resolveRequest(response(stalled === "observations" ? fixture : { stations: parseAirQualityStations(epaFixture) }));
    await settle();
    assert.deepEqual(Array.from(context.select.options, (option) => option.value), keys);
  }
});

test("catalog timeout includes response body reading", async () => {
  for (const stalled of ["observations", "catalog"]) {
    const pendingTimers = new Map();
    const timers = {
      setTimeout(callback) {
        const key = {};
        pendingTimers.set(key, callback);
        return key;
      },
      clearTimeout(key) { pendingTimers.delete(key); },
    };
    const context = await widget({ timers,
      [stalled]: () => Promise.resolve({ ok: true,
        [stalled === "observations" ? "text" : "json"]: () => new Promise(() => {}),
      }),
    });
    assert.equal(pendingTimers.size, 1);
    assert.equal(context.select.disabled, false);
    Array.from(pendingTimers.values())[0]();
    await settle();
    assert.equal(pendingTimers.size, 0);
    assert.equal(context.select.disabled, false);
    assert.equal(context.select.options.length, stalled === "observations" ? 4 : 6);
  }
});

test("no usable catalogs leave controls disabled and end loading", async () => {
  for (const local of [true, false]) {
    for (const catalog of [
      () => Promise.reject(new Error("offline")),
      () => Promise.resolve(response("", false)),
      () => Promise.resolve(response({})),
      () => Promise.resolve(response(local ? { stations: [] } : { d: [] })),
      () => Promise.resolve(response(local ? { stations: [{ id: 5, name: "Invalid" }] }
        : { d: [{ serialCode: 5, name: "Invalid" }] })),
    ]) {
      const context = await widget({ url: local ? "http://localhost/" : "https://example.com/conditions",
        observations: () => Promise.reject(new Error("offline")), catalog });
      assert.equal(context.select.options.length, 0);
      assert.equal(context.select.disabled, true);
      assert.equal(context.window.document.querySelector(".lc-use-location").disabled, true);
      assert.equal(context.window.document.querySelector(".lc-cards").hasAttribute("aria-busy"), false);
      assert.match(context.window.document.querySelector(".lc-status").textContent, /locations are currently unavailable/);
    }
  }
});

test("either catalog populates immediately and late arrivals preserve user selection", async () => {
  for (const local of [true, false]) {
    for (const delayed of ["observations", "catalog"]) {
      let resolveCatalog;
      const context = await widget({ url: local ? "http://localhost/" : "https://example.com/conditions",
        [delayed]: () => new Promise((resolve) => { resolveCatalog = resolve; }),
        air: () => Promise.resolve(response(local ? { index: 90, station: "Katherine" } : epaFixture)),
      });
      assert.equal(context.select.disabled, false);
      assert.equal(context.select.options.length, delayed === "observations" ? 4 : 6);
      const selected = delayed === "observations" ? "epa-4" : "014272";
      selectLocation(context, selected);
      await settle();
      const requests = context.requests.length;
      resolveCatalog(response(delayed === "observations" ? fixture
        : local ? { stations: parseAirQualityStations(epaFixture) } : epaFixture));
      await settle();
      assert.equal(context.select.options.length, 10);
      assert.equal(context.select.value, selected);
      assert.equal(context.requests.length, requests);
      assert.equal(context.window.localStorage.getItem("securent.localConditions.location"), selected);
      assert.equal(context.window.document.querySelector(".lc-use-location").disabled, false);
      if (delayed === "observations") {
        assert.match(cardFor(context, "Air quality monitor").textContent, /90 Index/);
      } else {
        assert.match(cardFor(context, "Temperature").textContent, /36 °C/);
      }
    }
  }
});

test("saved locations arriving later restore only until the user chooses a location", async () => {
  for (const userChoice of [false, true]) {
    for (const delayed of ["observations", "catalog"]) {
      let resolveCatalog;
      const saved = delayed === "observations" ? "015590" : "epa-4";
      const context = await widget({ saved,
        [delayed]: () => new Promise((resolve) => { resolveCatalog = resolve; }),
      });
      const chosen = context.select.value;
      if (userChoice) selectLocation(context, chosen);
      resolveCatalog(response(delayed === "observations" ? fixture : { stations: parseAirQualityStations(epaFixture) }));
      await settle();
      assert.equal(context.select.value, userChoice ? chosen : saved);
    }
  }
});

test("late BOM matches enrich the selected EPA location without losing its readings", async () => {
  let resolveBom;
  const station = { id: 2, name: "Darwin Airport", index: 51 };
  const context = await widget({
    observations: () => new Promise((resolve) => { resolveBom = resolve; }),
    catalog: () => Promise.resolve(response({ stations: [station] })),
    air: () => Promise.resolve(response({ index: 51, station: station.name })),
    worker: () => Promise.resolve(response({ fireDanger: { label: "Moderate", level: 1 } })),
  });
  assert.equal(context.select.value, "epa-2");
  selectLocation(context, "epa-2");
  await settle();
  const requests = context.requests.length;
  resolveBom(response(fixture));
  await settle();
  assert.equal(context.select.value, "014015");
  assert.equal(context.select.querySelector('[value="epa-2"]'), null);
  assert.equal(context.requests.length, requests);
  assert.match(cardFor(context, "Air quality monitor").textContent, /51 Index/);
  assert.match(cardFor(context, "Temperature").textContent, /36 °C/);
  assert.match(cardFor(context, "Bushfire danger rating").textContent, /Moderate/);
});