import { get } from "node:https";

function fetchStationPage(url, options) {
  return new Promise((resolve, reject) => {
    const request = get(url, options, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("error", reject);
      response.on("end", () => resolve({
        ok: response.statusCode >= 200 && response.statusCode < 300,
        status: response.statusCode,
        text: async () => Buffer.concat(chunks).toString("utf8"),
      }));
    });
    request.on("error", reject);
  });
}

export function parseAirQualityStations(data) {
  if (!Array.isArray(data?.d)) throw new Error("Invalid EPA station feed");
  const stations = [];
  for (const row of data.d) {
    if (!row || !Number.isInteger(row.serialCode) || row.serialCode < 1 || row.serialCode > 4 ||
        typeof row.name !== "string" || !row.name.trim() ||
        stations.some((station) => station.id === row.serialCode)) continue;
    stations.push({
      id: row.serialCode,
      name: row.name.trim(),
      index: Number.isFinite(row.IndexValue) && row.IndexValue >= 0 ? row.IndexValue : null,
      colour: typeof row.IndexColorStrHex === "string" && /^#[0-9a-f]{6}$/i.test(row.IndexColorStrHex)
        ? row.IndexColorStrHex : null,
      category: typeof row.IndexColorDescription === "string" ? row.IndexColorDescription.trim() : null,
    });
  }
  return stations;
}

export async function fetchAirQualityStations(fetcher = fetchStationPage) {
  const response = await fetcher(
    "https://api.brainiumlabs.com.au/ntepa/stationindex.json",
    { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000) },
  );
  if (!response.ok) throw new Error(`EPA station request failed: ${response.status}`);
  return parseAirQualityStations(JSON.parse(await response.text()));
}

export async function fetchAirQuality(id, fetcher = fetchStationPage) {
  if (!/^[1-4]$/.test(String(id))) throw new RangeError("Invalid EPA station ID");
  const stations = await fetchAirQualityStations(fetcher);
  const station = stations.find((item) => item.id === Number(id));
  if (!station) throw new Error("Missing EPA station");
  return { index: station.index, colour: station.colour, category: station.category };
}