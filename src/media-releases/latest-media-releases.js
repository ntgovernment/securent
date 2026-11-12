import { curateFeeds } from "./curation.mjs";
import { fetchMediaReleaseFeeds } from "./feeds.mjs";
import { renderCard } from "./media-release-card.js";

const listing = document.querySelector("[data-latest-media-releases]");

if (listing) {
  const results = listing.querySelector("[data-results]");
  const status = listing.querySelector("[data-results-status]");
  const feedNote = listing.querySelector("[data-feed-note]");
  const isLocalPreview = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);

  results.setAttribute("aria-busy", "true");
  status.textContent = "Loading current warnings...";
  fetchMediaReleaseFeeds(fetch, (source) => isLocalPreview ? `/${source.id}.json` : source.endpoint)
    .then(({ feeds, failedSources }) => {
      const items = curateFeeds(feeds).slice(0, 3);
      results.replaceChildren(...items.map((item) => renderCard(item, { compact: true })));
      status.textContent = items.length ? "" : "There are no current warnings.";
      feedNote.hidden = failedSources.length === 0;
      feedNote.textContent = failedSources.length ? `Some feeds are unavailable: ${failedSources.join(", ")}.` : "";
    })
    .catch((error) => {
      results.replaceChildren();
      status.textContent = "Current warnings are temporarily unavailable. Please try again later.";
      feedNote.hidden = false;
      feedNote.textContent = "No source feeds could be loaded.";
      console.error("Unable to load current warnings", error);
    })
    .finally(() => results.setAttribute("aria-busy", "false"));
}