// Fetch-handler proxy (Cloudflare Workers style): GET ?location=<key> -> JSON for the Local conditions cards.
// BOM and NT EPA send no CORS headers, so the browser cannot call them directly.

import { FIRE_AREA_CODES, FIRE_DANGER_URL, readFireDanger } from "./fire-danger.mjs";

const BOM_API = "https://api.weather.bom.gov.au/v1";
const NTEPA_URL = "http://ntepa.webhop.net/NTEPA/Default.ltr.aspx";
const USER_AGENT = "SecureNT-local-conditions/1.0";
const CACHE_SECONDS = 900;

// epaStation: row name in the NT EPA table (only these towns have monitors).
const LOCATIONS = {
  darwin: { name: "Darwin", search: "Darwin", epaStation: "Winnellie" },
  palmerston: { name: "Palmerston", search: "Palmerston", epaStation: "Palmerston" },
  "alice-springs": { name: "Alice Springs", search: "Alice Springs" },
  katherine: { name: "Katherine", search: "Katherine", epaStation: "Katherine" },
  "tennant-creek": { name: "Tennant Creek", search: "Tennant Creek" },
  nhulunbuy: { name: "Nhulunbuy", search: "Nhulunbuy" },
  yulara: { name: "Yulara", search: "Yulara" },
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

async function getBomForecast(search) {
  const found = await getJson(
    `${BOM_API}/locations?search=${encodeURIComponent(search)}`,
  );
  const match = (found.data || []).find((l) => l.state === "NT");
  if (!match) return null;
  const geohash = match.geohash.slice(0, 6);
  const daily = await getJson(`${BOM_API}/locations/${geohash}/forecasts/daily`);
  const today = (daily.data || [])[0];
  if (!today) return null;

  return {
    temperature: {
      min: today.temp_min ?? null,
      max: today.temp_max ?? null,
    },
  };
}

async function getFireDanger(areaCode) {
  return readFireDanger(await getJson(FIRE_DANGER_URL), areaCode);
}

async function getAirQuality(station) {
  if (!station) return null;
  const res = await fetch(NTEPA_URL, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) return null;
  const html = await res.text();

  const rows = html.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  for (const row of rows) {
    const cells = (row.match(/<td[\s\S]*?<\/td>/gi) || []).map((c) =>
      c.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim(),
    );
    // Columns: station, time, CO, NO2, O3, SO2, PM10, PM2.5, category
    if (cells[0] === station && cells.length >= 9) {
      return {
        category: cells[8],
        pm25: cells[7] === "" ? null : Number(cells[7]),
        time: cells[1],
        station,
      };
    }
  }
  return null;
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    const key = new URL(request.url).searchParams.get("location");
    const loc = LOCATIONS[key];
    if (!loc) {
      return Response.json({ error: "Unknown location" }, { status: 400, headers: CORS });
    }

    const cache = caches.default;
    const cached = await cache.match(request);
    if (cached) return cached;

    const [bom, air, fire] = await Promise.allSettled([
      getBomForecast(loc.search),
      getAirQuality(loc.epaStation),
      getFireDanger(FIRE_AREA_CODES[key]),
    ]);

    const body = {
      location: loc.name,
      updated: new Date().toISOString(),
      temperature: bom.status === "fulfilled" ? bom.value?.temperature ?? null : null,
      fireDanger: fire.status === "fulfilled" ? fire.value : null,
      airQuality: air.status === "fulfilled" ? air.value : null,
    };

    const response = Response.json(body, {
      headers: { ...CORS, "Cache-Control": `public, max-age=${CACHE_SECONDS}` },
    });
    await cache.put(request, response.clone());
    return response;
  },
};
