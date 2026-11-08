import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Window } from "happy-dom";
import { fetchAirQuality, fetchAirQualityStations, parseAirQualityStations } from "./air-quality.mjs";

const script = await readFile(new URL("./local-conditions.js", import.meta.url), "utf8");
const xml = await readFile(new URL("../../public/IDD60920.xml", import.meta.url), "utf8");
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

const epaFixture = { d: [
  { name: "Palmerston", serialCode: 1, IndexValue: 0, IndexColorStrHex: "#42A93C", IndexColorDescription: "Good" },
  { name: "Winnellie", serialCode: 2, IndexValue: 51, IndexColorStrHex: "#EEC900", IndexColorDescription: "Fair",
    pollutants: [{ IndexValue: 999, IndexColorStrHex: "#FF0000", IndexColorDescription: "Poor" }] },
  { name: "Stokes Hill", serialCode: 3, IndexValue: 64.5 },
  { name: "Katherine", serialCode: 4, IndexValue: 90 },
] };

test("EPA reads station-level JSON indices and rejects invalid or missing readings", () => {
  assert.deepEqual(parseAirQualityStations(epaFixture), [
    { id: 1, name: "Palmerston", index: 0, colour: "#42A93C", category: "Good" },
    { id: 2, name: "Winnellie", index: 51, colour: "#EEC900", category: "Fair" },
    { id: 3, name: "Stokes Hill", index: 64.5, colour: null, category: null },
    { id: 4, name: "Katherine", index: 90, colour: null, category: null },
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
    assert.deepEqual(await fetchAirQuality(id, fetcher), { index: station.index, colour: station.colour, category: station.category });
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

async function widget({ url = "http://localhost:5173/", saved, feed = fixture, worker, air, catalog, geolocation } = {}) {
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
  const requests = [];
  window.fetch = (input) => {
    const request = String(input);
    requests.push(request);
    if (request.includes("IDD60920.xml") || request.includes("1657184")) {
      return Promise.resolve(response(feed));
    }
    if (request === "/api/air-quality") {
      return catalog ? catalog() : Promise.resolve(response({ stations: parseAirQualityStations(epaFixture) }));
    }
    if (request === "./?a=1657186") {
      const first = requests.filter((item) => item === request).length === 1;
      if (first) return catalog ? catalog() : Promise.resolve(response(epaFixture));
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

test("the feed populates every station and shows its observed temperatures", async () => {
  const context = await widget();
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
  const groups = context.window.document.querySelectorAll(".lc-card-group");
  assert.deepEqual(Array.from(groups, (group) => group.querySelector(".lc-attribution").textContent),
    ["Source: Bushfires NT", "Source: NTEPA", "Source: Bureau of Meteorology"]);
  assert.equal(context.window.document.querySelectorAll(".lc-attribution").length, 3);
  assert.equal(context.window.document.querySelectorAll(".lc-card .lc-attribution").length, 0);
  assert.equal(groups[0].querySelector("a").href, "https://www.pfes.nt.gov.au/incidentmap");
  assert.equal(groups[1].querySelector("a").href, "https://ntepa.nt.gov.au/");
  assert.equal(groups[2].querySelector("a").href, "https://www.bom.gov.au/location/australia/northern-territory#observations");
  selectLocation(context, "014253");
  assert.match(context.window.document.querySelector(".lc-cards").textContent, /Data is currently unavailable/);
  assert.equal(context.window.document.querySelector(".lc-card-group:last-child a").href, "https://www.bom.gov.au/location/australia/northern-territory#observations");
  assert.equal(context.requests.length, 4);
});

test("localhost fetches the matching EPA station and displays an index, not PM2.5", async () => {
  const context = await widget({
    feed: xml,
    air: (url) => Promise.resolve(response({ index: url.endsWith("id=2") ? 51 : 64 })),
    worker: () => Promise.resolve(response({ fireDanger: { label: "Moderate", level: 1 },
      airQuality: { category: "Fair", pm25: 999 } })),
  });
  assert.ok(context.requests.includes("/api/air-quality?id=2"));
  const airCard = () => context.window.document.querySelectorAll(".lc-card")[1];
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
  assert.match(airCard().textContent, /unavailable/);
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
    assert.match(context.window.document.querySelectorAll(".lc-card")[1].textContent,
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
      const card = context.window.document.querySelectorAll(".lc-card")[1];
      assert.equal(card.querySelector(".lc-air").textContent, category);
      assert.equal(card.querySelector(".lc-air__dot").style.backgroundColor, colour);
      assert.equal(card.querySelector(".lc-air__dot").getAttribute("aria-hidden"), "true");
      assert.doesNotMatch(card.textContent, /Poor|999/);
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
      const card = context.window.document.querySelectorAll(".lc-card")[1];
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
      assert.match(context.window.document.querySelectorAll(".lc-card")[1].textContent, /unavailable/);
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
  assert.equal(cards.getAttribute("aria-busy"), "true");
  resolveWorker(response("", false));
  await settle();
  assert.match(cards.textContent, /0 Index/);
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
    assert.match(context.window.document.querySelectorAll(".lc-card")[1].textContent, /unavailable/);
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
    assert.match(context.window.document.querySelectorAll(".lc-card")[1].textContent,
      new RegExp(station.IndexValue + " Index"));
    assert.match(context.window.document.querySelectorAll(".lc-card")[2].textContent, /unavailable/);
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
  assert.match(context.window.document.querySelectorAll(".lc-card")[1].textContent, /0 Index/);
  assert.match(context.window.document.querySelectorAll(".lc-card")[2].textContent, /36 °C/);
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
  assert.match(context.window.document.querySelectorAll(".lc-card")[1].textContent, /90 Index/);
  selectLocation(context, "epa-1");
  await settle();
  assert.match(context.window.document.querySelectorAll(".lc-card")[1].textContent, /0 Index/);
  assert.equal(context.requests.filter((url) => url === "./?a=1657186").length, 3);
});

test("production uses the Matrix asset and restores saved or legacy selections", async () => {
  const context = await widget({ url: "https://example.com/conditions", saved: "alice-springs" });
  assert.equal(context.requests[0], "./?a=1657184");
  assert.equal(context.select.value, "015590");
  assert.equal(context.window.localStorage.getItem("securent.localConditions.location"), "015590");
  assert.match(context.requests[2], /location=alice-springs/);
  const saved = await widget({ saved: "014253" });
  assert.equal(saved.select.value, "014253");
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

test("geolocation reports when no stations have usable coordinates", async () => {
  const geolocation = { getCurrentPosition: (success) => success({ coords: { latitude: 0, longitude: 0 } }) };
  const feed = '<product><observations><station bom-id="missing" description="Missing coordinates" /></observations></product>';
  const context = await widget({ geolocation, feed });
  context.window.document.querySelector(".lc-use-location").click();
  assert.equal(context.select.value, "missing");
  assert.match(context.window.document.querySelector(".lc-status").textContent, /No locations with coordinates/);
});

test("invalid or empty feeds leave controls disabled and report a failure", async () => {
  for (const feed of ["not xml", "<product><observations /></product>"]) {
    const context = await widget({ feed });
    assert.equal(context.select.disabled, true);
    assert.equal(context.select.options.length, 0);
    assert.match(context.window.document.querySelector(".lc-status").textContent, /locations are currently unavailable/);
  }
});