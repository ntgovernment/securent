# Current Warnings Filters

## Current Warnings Listing

During initial feed loading, the full listing shows ten animated skeleton
cards that match the warning-card layout, plus checkbox placeholders in each
filter group. It announces loading through a separate polite status. Results
are marked busy and listing controls remain inert until the feeds finish.
Skeletons are replaced by warning cards, an empty state, or the existing
error message when loading completes. Reduced-motion preferences disable the
shimmer. Loading skeletons require no additional Matrix markup; publish the
rebuilt CSS and JavaScript together with their shared dependencies.

## Latest Three Warnings

The homepage's latest-three featured cards request the merged `campaign-monitor`
endpoint and apply the existing operational-warning filtering,
deduplication, and newest-first ordering to its JSON array. It displays up to
three cards and does not require the full listing's search, filters, or
pagination. The endpoint does not identify individual source failures or
preserve source precedence for duplicate campaigns. Homepage cards show the
severity icon and badge, relative publication time, title, and optional
region, without a separate **More information** action. Their publication
timestamps are stored as ISO values in the time element's `data-time`
attribute, and the relative labels refresh every minute using minutes, hours,
or days ago.

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
the severity badge on homepage cards. Its icon uses the generic
`fa-triangle-exclamation` treatment used for Other, not a hazard-specific Advice
image. Its badge and card accent use the same neutral colors as Other. Advice
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
`#716309`; Planned burn uses `#DBCDE4` / `#634578`; and General information and
Decreasing threat use the neutral background/text tokens.

Include the existing site theme and icon fonts, `media-releases.css`, and the
standalone module. Deploy `dist/SecureNT_files/media-release-card.js`,
`dist/SecureNT_files/autocomplete.js`, and the generated
`dist/SecureNT_files/*.webp` icons alongside the module, preserving their
relative paths. The full listings additionally require
`dist/SecureNT_files/page-window.js`.

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
keeps the homepage preview independent of the live merged feed; the production
page still requests the merged Campaign Monitor endpoint.
The individual source endpoints still proxy to the NT Government site; other
hosts request the merged endpoint directly and require CORS permission if they
are on a different origin. The existing site icon font supplies the clock,
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