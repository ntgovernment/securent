import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Window } from "happy-dom";

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

async function settle() {
  await new Promise((resolve) => setImmediate(resolve));
}

async function widget({ url = "http://localhost:5173/", saved, feed = fixture, worker, geolocation } = {}) {
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
  assert.equal(context.select.options.length, 6);
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
  assert.equal(context.requests.length, 2);
});

test("the checked-in BOM snapshot populates every station", async () => {
  const context = await widget({ feed: xml });
  const document = new context.window.DOMParser().parseFromString(xml, "application/xml");
  const stations = Array.from(document.querySelectorAll("observations > station"));
  assert.ok(stations.length > 0);
  assert.equal(context.select.options.length, stations.length);
  assert.deepEqual(
    Array.from(context.select.options, (option) => option.value).sort(),
    stations.map((station) => station.getAttribute("bom-id")).sort(),
  );
});

test("production uses the Matrix asset and restores saved or legacy selections", async () => {
  const context = await widget({ url: "https://example.com/conditions", saved: "alice-springs" });
  assert.equal(context.requests[0], "./?a=1657184");
  assert.equal(context.select.value, "015590");
  assert.equal(context.window.localStorage.getItem("securent.localConditions.location"), "015590");
  assert.match(context.requests[1], /location=alice-springs/);
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