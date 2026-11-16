export const latestMediaReleaseEndpoint = "https://cmsexternal.nt.gov.au/securent/_design/integrations/campaign-monitor";
export const mappedWarningsEndpoint = "https://cmsexternal.nt.gov.au/securent/_design/integrations/mapped-warnings";

export const mediaReleaseSources = [
  {
    id: "bushfires-nt",
    name: "Bushfires NT",
    endpoint: "https://cmsexternal.nt.gov.au/securent/_design/integrations/campaign-monitor-bushfires-nt",
  },
  {
    id: "ntes",
    name: "NTES",
    endpoint: "https://cmsexternal.nt.gov.au/securent/_design/integrations/campaign-monitor-ntes",
  },
  {
    id: "ntg-agencies",
    name: "NTG agencies",
    endpoint: "https://cmsexternal.nt.gov.au/securent/_design/integrations/campaign-monitor-ntg-agencies",
  },
];

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

export async function fetchMappedWarnings(fetcher = fetch, endpoint = mappedWarningsEndpoint) {
  const controller = new AbortController();
  let timeout;
  try {
    const request = (async () => {
      const response = await fetcher(endpoint, {
        headers: { Accept: "application/json" },
        credentials: "same-origin",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Mapped warnings request failed (${response.status})`);
      const payload = await response.json();
      if (!Array.isArray(payload)) throw new TypeError("Mapped warnings feed has an unsupported response shape");
      return payload;
    })();
    return await Promise.race([request, new Promise((_, reject) => {
      timeout = setTimeout(() => {
        controller.abort();
        reject(new Error("Mapped warnings request timed out"));
      }, 8000);
    })]);
  } finally {
    clearTimeout(timeout);
  }
}

export async function loadMappedWarnings(fetcher = fetch, endpoint = mappedWarningsEndpoint) {
  try {
    return { mappedWarnings: await fetchMappedWarnings(fetcher, endpoint), mappingFailed: false };
  } catch (error) {
    console.error("Unable to load mapped warnings", error);
    return { mappedWarnings: [], mappingFailed: true };
  }
}
