import { curateFeeds } from "./curation.mjs";
import {
  emergencyWarningsEndpoint, fetchMediaReleaseFeeds, loadEmergencyWarnings,
  loadMappedWarnings, mappedWarningsEndpoint,
} from "./feeds.mjs";
import { createCardSkeleton, renderCard, startRelativeTimeUpdates } from "./media-release-card.js";

const listing = document.querySelector("[data-latest-media-releases]");

if (listing) {
  const results = listing.querySelector("[data-results]");
  startRelativeTimeUpdates(results);
  const status = listing.querySelector("[data-results-status]");
  const feedNote = listing.querySelector("[data-feed-note]");
  const isLocalPreview = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  results.setAttribute("aria-busy", "true");
  status.hidden = false;
  status.classList.remove("hidden");
  status.classList.add("media-releases__status--loading");
  status.textContent = "Loading current warnings...";
  if (!results.querySelector(".media-releases__skeleton")) {
    results.replaceChildren(...Array.from({ length: 3 }, () => createCardSkeleton({ featured: true })));
  }
  const releases = isLocalPreview
    ? fetch("/api/media-releases/latest", { headers: { Accept: "application/json" }, credentials: "same-origin" })
      .then((response) => {
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        return response.json();
      })
      .then((records) => {
        if (!Array.isArray(records)) throw new TypeError("Warnings endpoint returned an unsupported response shape");
        return { feeds: [{ source: "Merged", items: records }], failedSources: [] };
      })
    : fetchMediaReleaseFeeds(fetch);
  Promise.all([
    releases,
    loadMappedWarnings(fetch, isLocalPreview ? "/api/media-releases/mapped-warnings" : mappedWarningsEndpoint),
    loadEmergencyWarnings(fetch, emergencyWarningsEndpoint),
  ])
    .then(([{ feeds, failedSources }, { mappedWarnings, mappingFailed }, { emergencyWarnings, emergencyWarningsFailed }]) => {
      const items = curateFeeds(feeds, mappedWarnings, emergencyWarnings).slice(0, 3);
      results.replaceChildren(...items.map((item) => renderCard(item, { featured: true })));
      status.textContent = items.length ? "" : "There are no current warnings.";
      const notes = [];
      if (failedSources.length) notes.push(`Some feeds are unavailable: ${failedSources.join(", ")}.`);
      if (mappingFailed) notes.push("Mapped warning details are unavailable; existing warning details are shown.");
      if (emergencyWarningsFailed) notes.push("Decreasing threat warning levels are unavailable; existing warning levels are shown.");
      feedNote.hidden = notes.length === 0;
      feedNote.textContent = notes.join(" ");
    })
    .catch((error) => {
      results.replaceChildren();
      status.textContent = "Current warnings are temporarily unavailable. Please try again later.";
      feedNote.hidden = false;
      feedNote.textContent = "The warnings feed could not be loaded.";
      console.error("Unable to load current warnings", error);
    })
    .finally(() => {
      results.setAttribute("aria-busy", "false");
      status.classList.remove("media-releases__status--loading");
    });
}