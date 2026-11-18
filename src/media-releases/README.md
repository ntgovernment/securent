# Current Warnings Filters

## Current Warnings Listing

During initial feed loading, the full listing shows ten animated skeleton
cards that match the warning-card layout, plus checkbox placeholders in each
filter group. It announces loading through a separate polite status. Results
are marked busy and listing controls remain inert until the feeds finish.
Skeletons are replaced by warning cards, an empty state, or the existing
error message when loading completes. Reduced-motion preferences disable the
shimmer. For first-paint skeletons, Matrix must output ten
`.media-releases__skeleton` elements inside `[data-results][aria-busy="true"]`
and placeholder rows inside the filter groups. Load `media-releases.css` in
the document head, after the theme stylesheet. JavaScript preserves these
placeholders, creating them only when absent for older templates. Existing
`[data-loading-status]` markup is reused and moved outside the inert content;
otherwise the script creates it. Empty result statuses take up no space, and
empty/error messages are unhidden even if the CMS initially hides the status.
Publish the rebuilt CSS and JavaScript together with their shared dependencies.

### Deploying and verifying first-paint skeletons

1. Keep the CMS skeletons in the initial response: ten full-list cards on
   Current warnings and three featured cards on the homepage. Preserve any
   CMS-provided filter skeleton rows; their counts do not need to match the
   JavaScript fallback counts.
2. Publish `dist/media-releases.css`, `dist/media-releases.js`, and
   `dist/latest-media-releases.js` together through the Matrix Git File Bridge.
   Keep their existing shared dependencies available. Refresh the bridge/page
   caches and the CSS/module cache references on both pages, including the
   stylesheet links in the document head.
3. Delay the entry module download, not just feed responses. Skeletons must
   already be visible before JavaScript executes, then remain the same DOM
   elements while the feeds load.
4. Verify populated, empty, and failed responses remove the card/filter
   placeholders, clear busy states, and release the full listing's inert
   controls. Empty/error messages must be visible. Check mobile overflow and
   reduced-motion behavior.

Run `npm run build`, then
`node --test src/media-releases/media-releases.test.mjs`. The targeted tests
cover CMS-provided and legacy loading markup, placeholder/status reuse,
successful and failed feed cleanup, and existing warning-card behavior.
Browser validation is also required for first-paint timing and CSS visibility;
happy-dom does not reliably invalidate `:empty` matching after text changes.
A Git push alone does not confirm that the CMS has refreshed its bridge assets.

## Latest Three Warnings

The homepage's latest-three featured cards combine the Bushfires NT, NTES, and
NTG agencies feeds, then apply the existing operational-warning filtering,
deduplication, source precedence, and newest-first ordering. It displays up to
three cards and does not require the full listing's search, filters, or
pagination. If a source is unavailable while others load, available warnings
are shown and the feed note identifies the failed sources. Homepage cards show
the severity icon and badge, relative publication time, title, and optional
region, without a separate **More information** action. Their publication
timestamps are stored as ISO values in the time element's `data-time`
attribute, and the relative labels refresh every minute using minutes, hours,
or days ago.

AWS hazard campaigns from the official **NT Emergency Service** sender are
operational warnings even when their subject omits words such as **warning** or
**advice**. If the source provides no warning level, they retain **Not
identified** rather than inferring a severity.

Both warning displays also request the `mapped-warnings` integration and match
its `campaignId` to the release `CampaignID`. Mapped warning titles use
**[Type] [level] for [Location]** (for example, **Storm advice for Darwin**)
when those values are available. A leading **Part of** or **Parts of** in the
location is lowercased in the title, preserving place-name capitalization; missing or
invalid fields use the existing classification, and an unavailable location
leaves the original title unchanged. Mapped regions replace inferred regions
and can include multiple regions. Official and legacy region values are
normalized to the displayed labels **Greater Darwin**, **Top End**,
**Nhulunbuy region**, **Katherine region**, **Tennant Creek region**, and
**Central Australia**. Mapped locations are searchable.
Declarations retain their existing type, filters and styling, with mapped
locations and regions where available.

Both warning displays also request the Squiz `emergency-warnings` feed and
match its `campaignId` to `CampaignID`, falling back to the normalized
`WebVersionURL` when the IDs differ. A matching `warningLevel` of
`decreasing_threat` overrides the mapped or inferred level with **Decreasing
threat**. The level is available in the Current Warnings filter and appears as
the severity badge on homepage cards. It uses the hazard-specific Advice WEBP for
its mapped emergency type and the same yellow card accent and badge colors as
Advice, while retaining the distinct **Decreasing threat** label. Advice
classifications without a matching Squiz record are unchanged.

If either mapping feed fails, returns an invalid response, or times out after
eight seconds, both pages show the existing warnings and an accessible notice;
source-feed errors remain separately reported. Production hosts must be able
to fetch the integrations from their origin, with CORS configured when
cross-origin. The localhost preview serves `mapped-warnings.preview.json` at
`/api/media-releases/mapped-warnings`; the Squiz emergency-warnings endpoint is
fetched directly so local current-warning records can be classified against
the live dataset. Unmatched records use the existing logic. Vite loads both
warning scripts from source during local development.

Featured warning titles use an `h3` styled at 20px bold with a 24px line
height. Severity badges use 12px bold Lato, 16px line height, 1px letter
spacing, and 4px by 8px padding. Emergency uses the danger background/text
tokens; Watch and act uses `#FFE4CC` / `#9E4B00`; Advice uses `#FDF4B9` /
`#716309`; Planned burn uses `#DBCDE4` / `#634578`; and General information uses
the neutral background/text tokens. Decreasing threat uses the same badge
background/text and card accent as Advice.

Include the existing site theme and icon fonts, `media-releases.css`, and the
standalone module. Deploy `dist/SecureNT_files/media-release-card.js`,
`dist/SecureNT_files/autocomplete.js`, and the generated
`dist/SecureNT_files/*.webp` icons alongside the module, preserving their
relative paths. The full listings additionally require
`dist/SecureNT_files/page-window.js`.

### Troubleshooting missing live warnings

If a Campaign Monitor record is missing from either page:

1. Check that the configured source integration returns the record's
   `CampaignID`, `Subject`, `FromName`, and `SentDate`. Compare the publication
   date with the newest displayed card.
2. Check the operational-notice rules in `curation.mjs`. A successful feed
   response does not mean every returned campaign is eligible for display.
3. Confirm that the Matrix Git File Bridge is serving the branch and commit
   containing the intended fix. A push to `dev` does not update a bridge
   configured for `main`.
4. Publish the rebuilt entry modules and shared
   `SecureNT_files/media-release-card.js` dependency together. Both warning
   displays use that dependency for curation. Refresh the bridge and page
   caches; changing only the entry script's query string does not version its
   relative module imports.
5. Reload both pages normally and verify the expected record is displayed.
   A successful local build or Git push alone does not verify CMS deployment.

The minimal embed below remains supported, but creates skeletons only after
the module loads. For immediate rendering, put the stylesheet links in the
document head and output three `.media-releases__skeleton--featured` cards
inside `[data-results][aria-busy="true"]`, matching `createCardSkeleton` in
`media-release-card.js`. Initially give the status the
`media-releases__status--loading` class and the text
`Loading current warnings...`; do not permanently hide it with `hidden`.
The script preserves the CMS cards until the feeds settle and falls back to
creating cards for older markup. A CMS-provided no-JavaScript message is
needed for visitors with scripting disabled.

```html
<link rel="stylesheet" href="./dist/theme.css">
<link rel="stylesheet" href="./dist/media-releases.css">
<section data-latest-media-releases aria-label="Latest warnings">
	<p class="media-releases__status" data-results-status role="status" aria-live="polite"></p>
	<p class="media-releases__feed-note" data-feed-note role="status" aria-live="polite" hidden></p>
	<div class="media-releases__results" data-results></div>
</section>
<script type="module" src="./dist/latest-media-releases.js"></script>
```

On localhost, the Vite development server serves `/api/media-releases/latest`
from `src/media-releases/latest-warnings.preview.json` and randomly selects
three unique records per request, including one randomly selected Decreasing
threat, Planned burn, or General information example and two warning
type/level examples. The 18 preview examples cover Bushfire, Cyclone, Flooding,
Storm, and Heatwave across Emergency warning, Watch and act, and Advice. This
keeps the homepage preview independent of the live source feeds.
The Vite preview proxies source-feed requests to the NT Government site.
Production pages request the three source feeds directly, so their origin must
allow those requests. The existing site icon font supplies the clock,
location, and arrow icons. The cards use three columns on wide screens, two below 900px,
and one below 600px. The component shows an empty message when no eligible
notices are available and reports when the endpoint is unavailable or invalid.
During loading, three placeholder cards shimmer in the results grid while an
accessible loading status is announced. The placeholders use the homepage
warning-card layout and are replaced when loading succeeds or fails.
Reduced-motion preferences disable the shimmer.

The full Current Warnings page combines emergency types and declarations in one
**Incident or notice type** filter. Filter groups appear in this order:
Warning level, Incident or notice type, Region, and Source. Selections use OR
within a group and AND across groups. Clearing filters resets pagination while
preserving the search text and sort order.

**Use location** requests the device's coordinates and searches for the NT
locality containing them. The lookup runs locally; coordinates are not sent to
a geocoding service. The button and search field are both 48px high. If
location permission is blocked, the request fails or times out, or the
coordinates have no matching NT locality, the search uses Darwin. Typing in
the search while a lookup is pending takes precedence.
The search remains a text filter, not a geographic warning-area match.

On mobile viewports, the Current warnings listing uses 16px of space above
the search bar. The **Sort and filter** control has a teal border and a subtle
hover background matching the **Use location** button and filter checkboxes.

The bundled locality boundaries are the NT subset of the Digital Atlas of
Australia's [Geoscape Administrative Boundaries localities](https://www.arcgis.com/home/item.html?id=370ff462e2c94b46995722887267f832),
retrieved in November 2026 in EPSG:4326 with coordinates rounded to five
decimal places. Incorporates or developed using Administrative Boundaries
© Geoscape Australia licensed by the Commonwealth of Australia under
[Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/).
See the [copyright and disclaimer notice](https://geoscape.com.au/legal/data-copyright-and-disclaimer/).
The subset and rounded coordinates are modifications to the original data.
Publish the generated locality-data JavaScript chunk alongside the Current
warnings bundle and its shared chunks in Matrix; it is loaded only on demand.
The Current warnings Matrix markup must also include the `data-use-location`
button, `data-location-status` live region, and `data-location-attribution`
credit from the page template. Replace the existing search block with:

```html
<div class="media-releases__search">
  <div class="media-releases__search-field">
    <label class="visually-hidden" for="media-releases-search">Search current warnings</label>
    <input id="media-releases-search" type="search" data-search
      placeholder="Search for a location, incident type or keyword">
    <span class="media-releases__search-icon" aria-hidden="true"><i class="fa-regular fa-magnifying-glass"></i></span>
    <ul id="media-releases-search-suggestions" class="search-autocomplete" data-search-suggestions hidden></ul>
  </div>
  <button type="button" class="media-releases__use-location" data-use-location>
    <i class="fa-light fa-location-dot" aria-hidden="true"></i><span>Use location</span>
  </button>
</div>
<p class="visually-hidden" data-location-status role="status" aria-live="polite"></p>
<p class="media-releases__location-attribution" data-location-attribution hidden>
  Locality boundaries © <a href="https://www.arcgis.com/home/item.html?id=370ff462e2c94b46995722887267f832">Geoscape Australia</a>,
  licensed by the Commonwealth of Australia under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.
  NT subset; coordinates rounded.
</p>
```

Publish `dist/media-releases.css`, `dist/media-releases.js`,
`dist/SecureNT_files/autocomplete.js`, and
`dist/SecureNT_files/nt-localities.js` alongside the existing shared warning
assets, preserving their relative paths. Refresh Matrix asset cache references.
Geolocation requires a secure context such as HTTPS, or localhost for testing.
Check a successful lookup, denied permission, an out-of-NT location, and typing
during a pending lookup; verify the button on desktop and mobile. A Git push
does not update Matrix markup or publish its asset references automatically.

The Incident or notice type list includes emergency types plus Fire ban,
planned burn, and boil-water declarations. It shows six options initially;
**Show all (N)** expands the remaining options, and **Show less** collapses
them again. The count in **Show all (N)** is the number of hidden options.
Options sort by result count from highest to lowest, with alphabetical order
for equal counts. **Other**, for internally **Not identified** emergency
types, always sorts last.

Checkbox labels display **Other** for values internally classified as
**Not identified**. The checkbox values remain unchanged so filtering behavior
is preserved. Cards in both listings omit the region row when the region is
not identified. Full Current warnings cards share an icon, relative
publication time, title, and optional region layout without severity badges
or a separate **More information** action. Each card stores its timestamp as
an ISO value in the time element's `data-time` attribute, and both listing
styles refresh the relative label every minute. Emergency cards retain their
AWS WEBP icons and warning-level border accents. The region uses
`fa-light fa-location-dot`
instead of a visible **Region:** prefix, while keeping an accessible region
label. The fire-ban option displays as **Fire ban notices**; its card uses the
neutral warning icon and `#343741` accent. Planned burns display as **Planned
burn advice** in the filter and use the `#865AA5` warning icon and accent.
Boil-water notices display as **Boil water notice** in the filter; fire-ban,
boil-water, other and general-information cards share the neutral icon and
accent. Homepage warning cards show the severity badge alongside their
warning icon and omit a separate **More information** action.

For Matrix markup, keep the Incident or notice type fieldset with its
`data-type-filters` list. Do not add a separate Declaration fieldset or
`data-declaration-filters` list; the renderer preserves each checkbox's
emergency-type or declaration value internally.

After changing the filter UI, run `npm run build` and
`node --test src/media-releases/media-releases.test.mjs`.