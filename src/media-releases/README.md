# Current Warnings Filters

## Current Warnings Listing

During initial feed loading, the full listing shows ten animated skeleton
cards in the results area and announces loading through a separate polite
status. Results are marked busy and listing controls remain inert until the
feeds finish. Skeletons are replaced by warning cards, an empty state, or the
existing error message when loading completes. Reduced-motion preferences
disable the shimmer. No additional Matrix markup is required; publish the
rebuilt CSS and JavaScript together with their shared dependencies.

## Latest Three Warnings

The compact listing requests the merged `campaign-monitor` endpoint and
applies the existing operational-warning filtering, deduplication, and
newest-first ordering to its JSON array. It displays up to three cards and
does not require the full listing's search, filters, or pagination. The
endpoint does not identify individual source failures or preserve source
precedence for duplicate campaigns.

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

On localhost, the Vite development server proxies `/api/media-releases/latest`
to `https://cmsexternal.nt.gov.au/securent/_design/integrations/campaign-monitor`;
other hosts request that URL directly and require CORS permission if they are
on a different origin. The existing site icon font supplies the clock, location, and
arrow icons. The cards use three columns on wide screens, two below 900px,
and one below 600px. The component shows an empty message when no eligible
notices are available and reports when the endpoint is unavailable or invalid.
During loading, three placeholder cards shimmer in the results grid while an
accessible loading status is announced. Reduced-motion preferences disable
the shimmer. The placeholders are replaced when loading succeeds or fails.

The Current Warnings page combines emergency types and declarations in one
**Incident or notice type** filter. Filter groups appear in this order:
Warning level, Incident or notice type, Region, and Source. Selections use OR
within a group and AND across groups. Clearing filters resets pagination while
preserving the search text and sort order.

The Incident or notice type list includes emergency types plus Fire ban,
planned burn, and boil-water declarations. It shows six options initially;
**Show all (N)** expands the remaining options, and **Show less** collapses
them again. The count in **Show all (N)** is the number of hidden options.

Checkbox labels display **Other** for values internally classified as
**Not identified**. The checkbox values remain unchanged so filtering behavior
is preserved. Cards in both listings omit the region row when the region is
not identified. The fire-ban option displays as **Fire ban notices**; its card
badge is singular (**Fire ban notice**) and uses the dark-blue `#1f1f5f` accent.
Planned burns display as **Planned burn advice** in the filter and **Planned
burn** on the card. Boil-water notices display as **Boil water notice** in the
filter; declaration cards otherwise use the **General information** badge.

For Matrix markup, keep the Incident or notice type fieldset with its
`data-type-filters` list. Do not add a separate Declaration fieldset or
`data-declaration-filters` list; the renderer preserves each checkbox's
emergency-type or declaration value internally.

After changing the filter UI, run `npm run build` and
`node --test src/media-releases/media-releases.test.mjs`.