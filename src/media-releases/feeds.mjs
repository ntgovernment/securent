export const mediaReleaseSources = [
  {
    id: "bushfires-nt",
    name: "Bushfires NT",
    endpoint: "/_design/integrations/campaign-monitor-bushfires-nt",
  },
  {
    id: "ntes",
    name: "NTES",
    endpoint: "/_design/integrations/campaign-monitor-ntes",
  },
  {
    id: "ntg-agencies",
    name: "NTG agencies",
    endpoint: "/_design/integrations/campaign-monitor-all-agencies",
  },
];

export function resolveMediaReleaseEndpoint(source, pageUrl) {
  const page = new URL(pageUrl);
  const prefix = page.hostname === "cmsexternal.nt.gov.au" ? "/securent" : "";
  return new URL(`${prefix}${source.endpoint}`, page.origin).href;
}

export function parseFeedPayload(payload, source) {
  if (Array.isArray(payload)) return { source: source.name, items: payload };
  if (payload && Array.isArray(payload.Results)) {
    return {
      source: source.name,
      items: payload.Results,
    };
  }
  throw new TypeError(`${source.name} feed has an unsupported response shape`);
}

export async function fetchMediaReleaseFeeds(fetcher = fetch, endpointFor = (source) => source.endpoint) {
  const settled = await Promise.allSettled(mediaReleaseSources.map(async (source) => {
    const endpoint = endpointFor(source);
    if (typeof endpoint !== "string" || !endpoint.trim()) {
      throw new Error(`Missing feed URL for ${source.name}`);
    }
    const response = await fetcher(endpoint, {
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    return parseFeedPayload(await response.json(), source);
  }));

  const feeds = [];
  const failedSources = [];
  settled.forEach((result, index) => {
    const source = mediaReleaseSources[index];
    if (result.status === "rejected") {
      failedSources.push(source.name);
      return;
    }
    feeds.push(result.value);
  });

  if (!feeds.length) {
    throw new AggregateError(
      settled.filter((result) => result.status === "rejected").map((result) => result.reason),
      "All emergency update feeds are unavailable",
    );
  }
  return { feeds, failedSources };
}
