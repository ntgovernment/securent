export const mediaReleaseSources = [
  {
    id: "bushfires-nt",
    name: "Bushfires NT",
    endpoint: "https://securent.nt.gov.au/_design/integration-points/socials/media-releases-bushfiresnt/_nocache",
  },
  {
    id: "ntes",
    name: "NTES",
    endpoint: "https://securent.nt.gov.au/_design/integration-points/socials/media-releases-ntes/_nocache",
  },
  {
    id: "securent",
    name: "SecureNT",
    endpoint: "https://securent.nt.gov.au/_design/integration-points/socials/media-releases-securent/_nocache",
  },
  {
    id: "wog",
    name: "WoG",
    endpoint: "https://securent.nt.gov.au/_design/integration-points/socials/campaign-monitor-api-wog-departments-v3.3/_nocache",
  },
];

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
    const response = await fetcher(endpointFor(source), {
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

  if (!feeds.length) throw new Error("All emergency update feeds are unavailable");
  return { feeds, failedSources, incompleteSources };
}
