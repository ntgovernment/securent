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
    id: "pfes",
    name: "PFES",
    endpoint: "/_design/integrations/campaign-monitor-pfes",
  },
  {
    id: "securent",
    name: "SecureNT",
    endpoint: "/_design/integrations/campaign-monitor-securent",
  },
  {
    id: "wog",
    name: "WoG",
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
    const pageNumber = Number(payload.PageNumber) || 1;
    const numberOfPages = Number(payload.NumberOfPages) || pageNumber;
    return {
      source: source.name,
      items: payload.Results,
      incomplete: pageNumber < numberOfPages
        ? `${source.name} shows page ${pageNumber} of ${numberOfPages} (${payload.TotalNumberOfRecords || "more"} records).`
        : "",
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
  const incompleteSources = [];
  settled.forEach((result, index) => {
    const source = mediaReleaseSources[index];
    if (result.status === "rejected") {
      failedSources.push(source.name);
      return;
    }
    feeds.push(result.value);
    if (result.value.incomplete) incompleteSources.push(result.value.incomplete);
  });

  if (!feeds.length) {
    throw new AggregateError(
      settled.filter((result) => result.status === "rejected").map((result) => result.reason),
      "All emergency update feeds are unavailable",
    );
  }
  return { feeds, failedSources, incompleteSources };
}
