import { curateFeeds } from "./curation.mjs";
import { latestMediaReleaseEndpoint } from "./feeds.mjs";
import { createCardSkeleton, renderCard, startRelativeTimeUpdates } from "./media-release-card.js";

const listing = document.querySelector("[data-latest-media-releases]");

if (listing) {
  const results = listing.querySelector("[data-results]");
  startRelativeTimeUpdates(results);
  const status = listing.querySelector("[data-results-status]");
  const feedNote = listing.querySelector("[data-feed-note]");
  const isLocalPreview = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  results.setAttribute("aria-busy", "true");
  status.classList.add("media-releases__status--loading");
  status.textContent = "Loading current warnings...";
  results.replaceChildren(...Array.from({ length: 3 }, () => createCardSkeleton({ compact: true })));
  fetch(isLocalPreview ? "/api/media-releases/latest" : latestMediaReleaseEndpoint,
    { headers: { Accept: "application/json" }, credentials: "same-origin" })
    .then((response) => {
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      return response.json();
    })
    .then((records) => {
      if (!Array.isArray(records)) throw new TypeError("Warnings endpoint returned an unsupported response shape");
      const items = curateFeeds([{ source: "Merged", items: records }]).slice(0, 3);
      results.replaceChildren(...items.map((item) => renderCard(item, { compact: true })));
      status.textContent = items.length ? "" : "There are no current warnings.";
      feedNote.hidden = true;
      feedNote.textContent = "";
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