# securent

Source and build tooling for the **SecureNT** NT Government site. The temporary site is `https://cmsexternal.nt.gov.au/securent`; its final public URL is `https://securent.nt.gov.au`.

## Project structure

```
securent/
├── src/
│   ├── alerts-listing/
│   │   ├── alerts-listing.js          # Alert rendering, responsive filters, sorting, and pagination
│   │   ├── alerts-listing.css         # Alerts page listing styles
│   │   ├── more-updates-cards.css     # Alerts page bottom-card styles
│   │   ├── sorting.mjs               # Stable alert sorting and CMS timestamp parsing
│   │   ├── sorting.test.mjs          # Built-in Node sorting regression tests
│   │   └── alerts-listing.local.json  # Local development fixture
│   ├── media-releases/
│   │   ├── curation.mjs               # Emergency notice filtering, deduplication and source precedence
│   │   ├── curation.test.mjs          # Curation regression tests
│   │   ├── feeds.mjs                  # Three-source feed loading and failure reporting
│   │   ├── feeds.test.mjs             # Feed parsing and error-state tests
│   │   ├── aws-icons.mjs               # AWS hazard and warning-level icon mapping
│   │   ├── aws-icons.test.mjs          # AWS icon mapping and fallback tests
│   │   ├── media-releases.js          # Search, filters, cards and result pagination
│   │   ├── latest-media-releases.js   # Standalone latest-three warnings listing
│   │   ├── media-release-card.js      # Shared full and compact warning card renderer
│   │   ├── media-releases.test.mjs    # Built-bundle listing and loading regression tests
│   │   └── media-releases.css         # Standalone listing styles
│   ├── pagination/
│   │   ├── pagination.css             # Shared Alerts and Current warnings pagination styles
│   │   ├── page-window.mjs            # Compact page-number window with ellipses
│   │   └── page-window.test.mjs       # Pagination window regression tests
│   ├── hero-banners/
│   │   ├── homepage-hero.css         # Purple-light homepage hero and responsive conditions alignment
│   │   ├── landing-hero.css          # Alt landing variant, breadcrumbs and optional CTA
│   │   └── hero-banners.js           # Landing-only breadcrumb relocation and optional CTA enhancement
│   ├── local-conditions/
│   │   ├── local-conditions.js       # Independent BOM/EPA catalogs and condition cards
│   │   ├── local-conditions.css      # Conditions panel and responsive reading styles
│   │   ├── local-conditions.test.mjs # Widget, fallback, timeout and EPA regression tests
│   │   ├── air-quality.mjs           # Node HTTPS proxy and EPA station parsing
│   │   ├── worker.js                 # Production fire-danger proxy
│   │   └── wrangler.toml             # Worker deployment configuration
│   ├── social-share/
│   │   ├── social-share.css          # Standalone styles for the Squiz share nester
│   │   └── social-share.js           # Share popups and copy-link behavior
│   ├── css/
│   │   ├── main.css                  # CSS entry point — add @imports here
│   │   └── components/
│   │       ├── accordion.css         # CMS accordion styling, states and content-width alignment
│   │       ├── alert.css             # Global alert banner styles: information (#FFC72C yellow, dark text AAA), warning (#D6410A orange, white AA), critical (#FC4141 red, white AA large text only); 24×24 close button anchored top-right
│   │       ├── buttons.css           # Button overrides: primary bg Charcoal (#343741), secondary outline Charcoal + white bg, hover Territory orange (#D6410A)
│   │       ├── content-page.css      # Content page body alignment when no in-page navigation is present
│   │       ├── mainmenu-dropdown.css # Content-width desktop mega-menu and mobile drawer styles
│   │       ├── header-footer.css     # Header/footer brand colour overrides; background: Charcoal (#343741)
│   │       ├── homepage-featured-content.css # CMS homepage feature cards: responsive image/text layout and CTA styling
│   │       ├── statistics.css        # Statistics section styles
│   │       └── main.css              # Breadcrumbs, side-nav colours, editorial links/bullets, display cards and homepage-news overrides
│   ├── data/
│   │   └── navigation.js             # Legacy menu data; no longer imported by the shared theme
│   ├── navigation/
│   │   └── README.md                 # Matrix Main, Level 2 and Level 3 listing templates and publication steps
│   └── js/
│       ├── main.js                   # JS entry point — desktop mega-menu and mobile drawer
│       ├── navigation.test.mjs       # CMS link preservation, listing-template and interaction regressions
│       ├── homepage-news.js          # Runtime JS for homepage news cards (tag transformation)
│       └── display-cards.js          # Runtime JS — swaps FA 5 `fal` icons to FA 6 `fa-solid` in display cards
├── dist/                             # Committed build output for the Squiz Matrix file bridge
│   ├── alerts-listing.css
│   ├── alerts-listing.js
│   ├── pagination.css
│   ├── media-releases.css
│   ├── media-releases.js
│   ├── latest-media-releases.js
│   ├── SecureNT_files/autocomplete.js # Shared search, sorting and date dependency
│   ├── SecureNT_files/media-release-card.js # Shared warning cards, feeds and curation
│   ├── SecureNT_files/page-window.js  # Shared pagination dependency
│   ├── SecureNT_files/*.webp          # Generated AWS hazard pictograms for media-release cards
│   ├── more-updates-cards.css
│   ├── event.css
│   ├── social-share.css
│   ├── social-share.js
│   ├── local-conditions.js
│   ├── theme.css
│   └── theme.js
├── assets/hazard-icons/              # Shared hazard alert pictograms
├── SecureNT.html                     # Local page capture (gitignored)
├── SecureNT_files/                   # Local page assets (gitignored)
├── Content page _ SecureNT.html      # Local emergency-plans content capture (gitignored)
├── alerts-and-warnings.html          # Alerts and warnings page capture
├── media-releases.html                # Current warnings preview page
├── Severe Storm – Alice Springs _ SecureNT.html   # Secondary development event capture
├── vite.config.mjs
└── package.json
```

The homepage capture (`SecureNT.html`), emergency-plans content capture (`Content page _ SecureNT.html`), and shared `SecureNT_files/` assets are excluded from Git. Local captures use built page-specific styles and scripts from `dist/`; captured upstream dependencies and static assets may remain in `SecureNT_files/`. The event capture uses shared local assets, hazard icons from `assets/hazard-icons/`, and standalone `dist/event.css`, `dist/social-share.css`, and `dist/social-share.js` assets; it no longer has a separate asset folder. The content-page capture uses the same standalone event and share assets. On desktop, the event share panel aligns with the first content section after the event H1; on content pages, `content-page.css` aligns the first content block with the share panel when there is no in-page navigation. The local captures share the same two-row header: `.header-top` holds the logo, emergency contacts, and desktop search, while `.header-navigation` holds the primary navigation. The separate mobile search banner remains below the header. `vite.config.mjs` includes `SecureNT.html` as the build HTML entry when that optional capture exists; its production HTML transform removes references to the two local WEBP photos so they are not emitted in `dist/`, while development preview retains them. The event preview does not change production build inputs. The `dist/` files are tracked because they are consumed by the Squiz Matrix file bridge.

Primary navigation is rendered by Squiz Matrix, not rebuilt from `src/data/navigation.js`. Use the [Main, Level 2 and Level 3 asset-listing templates](src/navigation/README.md), preserving `%asset_short_name_linked%` and the existing dynamic-root nesting calls. `src/js/main.js` binds the `.cms-main-nav` tree without replacing links or changing URLs. Publish the matching listing markup, `dist/theme.js` and `dist/theme.css` together and refresh their CMS cache versions. Older captures without `.cms-main-nav` retain their original links in a static fallback instead of receiving hard-coded replacements.

## Prerequisites

- Node.js ≥ 18
- npm

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Vite starts a local dev server and opens `/`, serving the shelter capture in `Find an emergency shelter _ SecureNT.html`. The Current warnings capture remains available at `/Current%20warnings%20_%20SecureNT.html`, the Alerts and warnings capture at `/alerts-and-warnings.html`, the standalone Current warnings page at `/media-releases.html`, and the event capture at `/Severe%20Storm%20%E2%80%93%20Alice%20Springs%20_%20SecureNT.html`. The homepage capture remains available at `/SecureNT.html` when its local capture is present. The development middleware in `vite.config.mjs` serves the shelter, Current warnings and event captures through Vite's HTML transforms, including the shelter's direct capture URL. External navigation links still point to the CMS, and externally hosted fonts and favicons require network access. These captures are development snapshots, not live emergency feeds.
Generated application styles and scripts load from `dist/`; captured vendor dependencies and static assets load from the shared, gitignored `SecureNT_files/` directory. Run `npm run build` after source changes so updated generated assets are available for local preview.

Existing Vite servers and browser tabs can cache built assets even after rebuilding. Refresh the `?v=` references in each capture being verified, then check a normal reload without temporary test URLs. Older captures reference `dist/theme.css?v=47`; the migrated alerts capture uses `dist/theme.js?v=31`. The shelter capture loads `dist/theme.css?v=48` and the generated theme script, event and social-share assets from `dist/`, uses the shared vendor assets and print stylesheet, and leaves its in-page list empty for the legacy NTG script to populate once. Its redundant capture-specific asset directory has been removed; keep local vendor and logo references pointed at `SecureNT_files/`. Older captures retain their existing script references and need the Matrix navigation markup applied before testing the enhanced menu. The homepage's standalone `dist/local-conditions.js` reference is version `3`. Update equivalent CMS asset references separately when deploying. Publish the three listing templates and matching theme assets together. Keep the theme stylesheet in the document head; panels stay collapsed while JavaScript loads, and the expanded fallback applies only when browser scripting is disabled.

The shared theme guards the legacy `quickExit()` function through `src/js/quick-exit.mjs`: redirects run only while a `#quickexit` element exists on the page. Presence is checked on every invocation, including after component insertion or removal. A hidden component still counts as present. When present, Escape and component clicks retain the existing behavior: open `https://nt.gov.au` in a new tab and replace the current page with `https://www.google.com`. Other Escape handlers are unaffected; the guard does not remove keyboard listeners or modify the vendor bundle.

For deployment, publish the rebuilt `dist/theme.js` through the Git file bridge, refresh the CMS script cache reference, and load it after the NTG components bundle so the guard can wrap its global function. If that function is not available when the theme runs, the guard does nothing. Pages without the shared theme do not receive this guard.

Run `node --test src/js/quick-exit.test.mjs src/search/autocomplete.test.mjs` to verify component presence/removal, preservation of the original function, legacy Escape/click bindings, and search keyboard behavior. After deployment, verify a normal reload on pages both with and without `#quickexit`. Without it, Escape must not navigate away or open a tab; with it, both Escape and the quick-exit control must still work. Use disposable test tabs because a working quick exit replaces the current page.

To select a different port on Windows without npm dropping the forwarded flags, launch Vite directly:

```powershell
node node_modules/vite/bin/vite.js --port 5175 --strictPort
```

The Alerts and warnings capture loads its listing script and standalone listing, pagination, and bottom-card styles from `dist/alerts-listing.js`, `dist/alerts-listing.css`, `dist/pagination.css`, and `dist/more-updates-cards.css`, alongside `dist/theme.css` and `dist/theme.js`. On localhost, the listing fetches `src/alerts-listing/alerts-listing.local.json`; level, region, and topic facets are rendered as combined filters. On the deployed CMS page, it requests the listing endpoint configured in the page markup. The capture keeps the supplied CMS content and navigation destinations, while shared dependencies use the local `SecureNT_files/` assets.
Each Alerts suggestion shows a decorative magnifying-glass icon; selecting one fills the search and filters the current listing. The local listing assets are now CSS `19` and JavaScript `11`.

Below 768px, an initially collapsed **Filter and sort** disclosure appears between search and results. It expands the existing controls inline; desktop keeps the sidebar expanded. Checkbox selections, sort choice, and mobile expansion preference survive breakpoint changes. The native button exposes its expanded state and hides collapsed controls from keyboard navigation. Without JavaScript, the captured filters remain visible.

The Level filter uses severity order: Emergency warning, Watch and act, Advice, then Decreasing threat, with unknown levels last. This order applies whether levels come from feed facets or are derived from alert items; counts and selected values are unchanged. The local capture uses the same order without JavaScript. CMS wrappers matching `section.alerts-page` receive `margin-top: -1.5em`; this rule does not target the capture's `body.alerts-page`.

The shared **Sort by** dropdown offers Current order (the default feed order), Warning level, Newest updated, Location A-Z, and Title A-Z. Sorting applies to combined search/filter matches before pagination; changing sort resets to page 1. Equal values retain feed order. Warning levels sort Emergency warning, Watch and act, Advice, then Decreasing threat, with unknown levels last. Empty locations and invalid or missing update dates sort last. Timezone-less CMS `updatedAt` timestamps are interpreted as Northern Territory time (UTC+09:30); ISO timestamps with explicit offsets retain their offsets. Confirm this timezone assumption against the production endpoint before rollout.

The controls enhance existing `.alerts-listing__filters` markup automatically, so no extra CMS control markup is needed. Rebuild and refresh the listing CSS/JS asset versions in both the local capture and CMS references after changes. The local listing references currently use CSS version `19` and JavaScript version `11`. Run focused sorting regressions with `node --test src/alerts-listing/sorting.test.mjs`.

### Current Warnings

Region inference uses [nt-suburbs-by-government-region.json](src/media-releases/nt-suburbs-by-government-region.json), a 270-locality working map compiled from the NT Government regions map, the Australia Post NT locality list, and Geoscape locality boundaries. Exact locality matches in notice titles, names, and structured place fields take precedence over conflicting legacy aliases; broader area names such as Tanami and Lasseter remain as fallbacks. The source label “Greater Darwin, Palmerston and Litchfield” is presented as the existing **Greater Darwin** filter value. The source describes the six-region classification as a map rather than an authoritative locality table, so boundary localities may need spatial validation; do not treat these inferred regions as authoritative emergency boundaries.

The standalone **Current warnings** page ([media-releases.html](media-releases.html)) combines the NTES, Bushfires NT and NTG agencies Campaign Monitor feeds defined in [feeds.mjs](src/media-releases/feeds.mjs). It curates operational emergency notices rather than showing all government news. Matching `CampaignID` values are deduplicated with Bushfires NT > NTES > NTG agencies precedence; source labels remain available for filtering and curation. Warning/action language and the approved NTES duty-officer email in `FromName` identify operational items. General awards, recruitment, ceremonies, outlooks and corporate announcements are excluded unless operational warning language takes precedence. [curation.mjs](src/media-releases/curation.mjs) owns these rules.

The separate latest-three listing requests the merged `campaign-monitor` endpoint and displays up to three eligible warnings, newest first, in responsive cards without search or filters. It applies the existing curation rules to the returned records, but the merged response cannot identify individual source failures or preserve source precedence for duplicates. See [the media-releases guide](src/media-releases/README.md) for embed markup, assets, localhost proxy, and cross-origin requirements. It does not replace the full listing or automatically add itself to a page.

Run `npm run build` and start `npm run dev` to preview the captured Current warnings page at `/Current%20warnings%20_%20SecureNT.html`. The standalone shell at `/media-releases.html` remains available and may normalize to `/media-releases`. The page heading is **Current warnings** and the search placeholder is **Search current warnings**. Suggestions include terms from notice titles and available town, street, suburb, locality, and address fields, as well as inferred regions; each option shows a decorative magnifying-glass icon. Selecting a suggestion filters the listing. Generated styles, scripts, and hazard icons load from `dist/`; captured vendor dependencies and static assets load from shared, gitignored `SecureNT_files/`. Refresh versioned asset references after rebuilding: the warnings capture currently uses media-release CSS `33` and JavaScript `48`; the standalone shell uses CSS `32` and JavaScript `48`.
Original notice titles remain unchanged. This mapping applies only to Current warnings, not the existing Alerts and warnings listing.

During initial feed loading, ten animated skeleton cards appear in the results area and a separate polite status announces progress. The results are marked busy and listing controls are temporarily inert; the header, footer and page scrolling remain usable. Skeletons are replaced by warning cards, an empty state, or the existing error message when loading completes. Reduced-motion preferences disable the shimmer. Search, filtering, sorting and pagination do not trigger a loading state. JavaScript creates the placeholders and status automatically, so no additional Matrix markup is required; publish the matching rebuilt CSS and JS together and refresh their cache references.

A **Filters** heading and text-only **Clear all filters** button appear below Sort by. Clearing unchecks all four filter groups and returns to page 1, preserving search text and sort order. Filter fieldsets are separated by spacing, not divider lines; the divider below Sort by remains. Include the heading and `data-clear-filters` button from the preview when updating Matrix listing markup. Both controls appear inside the mobile **Sort and filter** disclosure. Current filter behavior is documented in [the media-releases guide](src/media-releases/README.md); follow it where the legacy filter details below differ.

Warning level, Emergency type, Declaration, Region and Source filters appear in that order. Declaration offers **Fire ban declaration**, **Planned burn advice**, and **Boil water notice** for matching wording in campaign names or subjects. All three are declaration-only notices: emergency type is omitted, warning level is **Not identified**, and their cards omit the emergency-type/warning-level line and AWS icon. They do not appear in the Emergency type or Warning level **Not identified** facets; ordinary notices with unidentified values remain filterable there. Fire ban cards use a **General information** badge with a `#1f1f5f` accent while the filter remains **Fire ban declaration**; planned burn advice uses a **Planned burn** badge with `#865aa5`; all other declarations and unrecognized warning levels use a **General information** badge with a `#1f1f5f` accent; Emergency, Watch and act, Advice and Decreasing threat retain their specific badge labels. Fire danger periods alone do not qualify as declarations. Boil/boiling-water wording is classified as a declaration rather than **Health emergency**; other health alerts, health emergencies and water alerts retain their existing classifications. Declaration options and counts are derived from loaded notices, with no **Not identified** option for notices without a declaration. Include the `data-declaration-filters` fieldset from the preview in the Matrix listing markup when publishing the updated script. The Source filter always lists configured sources, including a zero count when a source has no curated notices. Region, type and level are best-effort inferences, not authoritative warning metadata. Region matching considers campaign names, subjects and available structured place fields, using the locality map and broader aliases described above; Darwin, Palmerston and Litchfield matches use the **Greater Darwin** label, and notices can match multiple regions or emergency types. A displayed title containing `BushfiresNT` maps to the existing **Bushfire** emergency type. Unmatched values remain available under **Not identified**, without guessing from agency sender names or long highway names. Warning levels prefer the displayed subject over the internal campaign name and do not treat a generic cyclone/flood warning as an AWS Emergency warning. Decreasing-threat, reduced-threat and all-clear classifications map to Advice for card labels, filter counts and severity sorting; there is no separate Decreasing threat filter option. Original notice titles remain unchanged. This mapping applies only to Current warnings, not the existing Alerts and warnings listing.

Selections use OR within a filter group and AND across groups, combined with search. Filter checkboxes use a square 2px outline with no border radius, a teal checked fill and white checkmark, and an `#ecf0f0` hover fill while unchecked. **Sort by** appears at the top of the sidebar and offers Newest first (default), Oldest first, Warning level (severity order), and Title A-Z. Filtering and sorting happen before ten-item pagination and reset to page 1. Missing or invalid dates sort last in either date order. Warning cards present a severity or declaration badge, original title, publication time, region and **More information** action. Decreasing-threat notices remain classified and filtered as Advice, but their badge reads **Decreasing threat**. The entire card is one focusable outbound link when its feed URL is safe; otherwise it is not clickable. The card accent follows warning level (Advice yellow, Watch and act orange, Emergency warning red, otherwise neutral gray), except for declaration-specific accents documented above. An AWS hazard pictogram appears on the left when both hazard type and warning level are identified. It uses the first matched hazard type in classifier order; identified types without a dedicated pictogram use **Other**, while **Not identified** types or levels show no pictogram. Region uses a map-pin icon. Agency, source and separate classification details are omitted from card content; source values remain available in filters. Hover applies an exterior `0 4px 16px rgba(15, 15, 47, 0.15)` shadow, underlines the title and **More information** label, and shifts only its arrow 3px to the right without moving the card; reduced-motion preferences disable the arrow shift. On mobile, the sidebar moves above the results and a **Sort and filter** disclosure contains the sort control and facets.

Both full and latest-three warning cards omit the region row when no region is identified. The full listing's **Other** region filter remains available for these warnings.

On Current warnings, the search and Sort by controls use the checkbox hover fill (`#ecf0f0`) only while idle. Their default, focused, and active states stay white, and the search remains white when populated. Verify the built styles with `npm run build` followed by `node --test src/media-releases/media-releases.test.mjs`.

Both listings share pagination styles and page-window logic. Up to five pages are shown in full; longer lists show the first page, nearby pages, the last page, and ellipses for omitted ranges.

On localhost, the warnings loader reads the checked-in JSON snapshots [bushfires-nt.json](public/bushfires-nt.json), [ntes.json](public/ntes.json) and [ntg-agencies.json](public/ntg-agencies.json), selected by each source ID. This keeps preview behavior independent of live-feed availability and cross-origin access. Outside localhost, the loader uses the absolute production integration URLs defined in [feeds.mjs](src/media-releases/feeds.mjs).

| Source | Integration Path |
| --- | --- |
| Bushfires NT | `/_design/integrations/campaign-monitor-bushfires-nt` |
| NTES | `/_design/integrations/campaign-monitor-ntes` |
| NTG agencies | `/_design/integrations/campaign-monitor-ntg-agencies` |

The data-source URLs are `https://cmsexternal.nt.gov.au/securent/_design/integrations/campaign-monitor-bushfires-nt`, `https://cmsexternal.nt.gov.au/securent/_design/integrations/campaign-monitor-ntes`, and `https://cmsexternal.nt.gov.au/securent/_design/integrations/campaign-monitor-ntg-agencies`. Publish the three integration assets at those paths.

Matrix keyword attributes are no longer required or read. Remove the old `data-feed-*` attributes from the paint layout when convenient; the updated script ignores stale values. The opening listing tag is:

```html
<section class="media-releases__listing" data-media-releases aria-label="Current warnings">
```

Each integration URL must return raw JSON (an array or an object containing a `Results` array), not a site-wrapped page or login response. Production requests stay on the page's origin; redirects to another origin may still require CORS permission. Available sources still render if another source fails, with a partial-feed notice; total feed failure shows an unavailable state and logs an `AggregateError` containing the underlying failures. Expand its `errors` list in DevTools to distinguish HTTP failures and invalid JSON. Feed page metadata is ignored; the page status reports the number of curated media releases available in the loaded results.

This HTML is a local preview shell, not a Vite production HTML entry. For Matrix integration, use the listing markup and built media-release CSS/JS alongside the shared theme and pagination CSS. Include the listing script once with `type="module"`. Publish `dist/SecureNT_files/autocomplete.js` and `dist/SecureNT_files/page-window.js` with both full listing bundles. Publish `dist/SecureNT_files/media-release-card.js` and all generated `dist/SecureNT_files/*.webp` AWS pictograms with the current-warnings and latest-three bundles. Preserve the relative paths of these shared assets. The ignore rules keep captured assets excluded while allowing these generated dependencies to be tracked. Rebuild and refresh the page and CMS asset versions together when shipping changes.

Validation checklist:

- Run `npm run build` before `node --test src/search/autocomplete.test.mjs src/pagination/page-window.test.mjs src/media-releases/*.test.mjs src/alerts-listing/sorting.test.mjs` for autocomplete, pagination, AWS icon tiers/fallbacks, extraction, precedence, combined filters, sorting, date parsing, feed failures and loading skeleton cleanup. The loading DOM tests use happy-dom, the preview HTML and the built media-release module; rebuild after source changes so they exercise the current implementation.
- Run `npm run build` and publish the standalone assets, shared `autocomplete.js` dependency, and generated AWS WEBP icons with their source changes.
- Check that Fire ban counts are based on deduplicated notices, including singular/plural wording in campaign names and subjects. Fire bans must appear in Incident or notice type as **Fire ban notices**, not as Bushfire or Advice; their cards use the **Fire ban notice** badge and omit the emergency-type/warning-level line and AWS icon. Ordinary warning cards must retain their classifications and icons.
- Check that **Clear all filters** unchecks Warning level, Incident or notice type, Region and Source, resets pagination to page 1, and preserves search text and sort order. Confirm that the text-only button and Filters heading fit on desktop/mobile and no fieldset divider lines remain.
- Manually inspect excluded candidates after curation changes, especially borderline operational announcements. Keep this review in validation; do not add a public exclusions section or generated review report.
- Check desktop/mobile search, combined filters, sidebar sorting, page resets, collapsed filter accessibility, and partial/all-source failures. Live feeds may stall; controlled browser fixtures can isolate UI checks without changing production feed configuration.
- For the latest-three listing, delay the merged endpoint response and verify that three responsive skeleton cards appear, the loading status remains accessible, reduced-motion disables the shimmer, and placeholders clear for successful, empty, invalid, and failed responses.
- Delay feed responses and check the ten in-results skeleton cards, polite loading announcement, blocked listing controls, usable header/footer and reduced-motion behavior at desktop/mobile widths. Confirm placeholders are replaced or cleared after populated or empty results, partial/total feed failure and rendering errors. The automated DOM checks cover these cleanup paths.

## Build

```bash
npm run build
```

Outputs to `dist/`:

- `theme.css` — compiled, minified CSS imported by `src/css/main.css`, including `src/hero-banners/` styles
- `theme.js` — compiled JS imported by `src/js/main.js`, including the landing hero initializer
- `alerts-listing.css` and `alerts-listing.js` — standalone assets for the Alerts and warnings page
- `media-releases.css` and `media-releases.js` — standalone assets for the Current warnings page
- `latest-media-releases.js` — standalone latest-three warnings listing, using `media-releases.css`
- `SecureNT_files/autocomplete.js` — shared autocomplete, sorting and date dependency
- `SecureNT_files/media-release-card.js` — shared warning-card rendering, feeds and curation dependency
- `SecureNT_files/page-window.js` — shared pagination dependency for the full listing bundles
- `SecureNT_files/*.webp` — generated AWS hazard pictograms imported by the Media releases bundle
- `pagination.css` — shared pagination styling and list-marker overrides for both listing pages
- `more-updates-cards.css` — styles for the bottom update cards on the Alerts and warnings page
- `event.css` and `social-share.css` — standalone event page and share nester styles
- `social-share.js` — standalone event share popup and copy-link behavior
- `local-conditions.js` — standalone location catalog and condition-card behavior; its CSS is included in `theme.css`

`theme.css`, `theme.js`, `alerts-listing.css`, `alerts-listing.js`, `pagination.css`, `more-updates-cards.css`, `event.css`, `social-share.css`, `social-share.js`, and `local-conditions.js` are referenced in Squiz Matrix via the git file bridge. Reference `dist/social-share.css` from the Squiz share nester after the global theme; it remains a standalone asset rather than part of `dist/theme.css`. Captured HTML uses `SecureNT_files/print.css` for local print preview; Vite does not generate it under `dist/`.

The build excludes the captured homepage's reference to the previous `dist/theme.css` so generated styles are not imported back into the next bundle. The current source styles remain the authority.

Theme CSS has an explicit `theme-styles` entry pointing to `src/css/main.css` in `vite.config.mjs`; the optional, gitignored homepage capture is not required to generate the theme bundle. Keep that capture and its local dependencies available when building or previewing the captured homepage. After building, confirm both theme assets exist before committing file-bridge updates.

## Shared Theme Overrides

[src/css/components/main.css](src/css/components/main.css) owns the shared breadcrumb, side-navigation and editorial colour overrides compiled into `dist/theme.css`:

- Native `select` and `.form-select` controls use the shared outlined 16px chevron, positioned 16px from the right edge, with the native arrow hidden and 48px of right padding. The rule applies site-wide; specialized select styles should preserve the chevron and leave room for its label text.
- `.ntg-callout__content` uses an 8px left border site-wide, with its existing color and remaining border unchanged.
- Breadcrumbs under `.ntg-breadcrumbs` use Lato 14px/400 with a 20px line height, 8px spacing, underlined `#174C4E` links, and current-page text in `var(--clr-text-default, #1F1E27)`. Right chevrons use the existing Font Awesome 6 Pro font in 12px slots and `var(--clr-text-emphasis, #C33826)`. Trails wrap with automatic height. The landing-hero stylesheet retains positioning only; it shares these visual rules with standard pages.
- `.ntg-sidenav` title and item links use `#174C4E`; active-item text uses `var(--clr-text-default, #1F1E27)`. Existing indicators and the active left border use `var(--clr-text-emphasis, #C33826)`. Typography, indentation and active-state structure are preserved. Breadcrumb and side-nav links have visible teal keyboard-focus outlines.
- `[data-component="ntg-inpage-nav"]` receives the shared `src/js/on-this-page.mjs` enhancement after its legacy links are available. On desktop (768px and wider), it sticks 16px from the viewport top, stays inside its sidebar and scrolls internally if taller than the available viewport. Its solid white background and `z-index: 3` keep neighboring active sidebar items from showing over the panel. Smaller screens retain normal document flow. The linked visible heading nearest the top reference is active, including headings below it, with `aria-current="location"` and a 3px `#F4551A` orange inset indicator flush against the inner edge of the unchanged gray rail, with no gap. `--ntg-on-this-page-offset` controls the reference and desktop sticky offset in pixels. Scroll, resize, restored-page, hash and content-size changes recalculate the selection without moving focus or changing link destinations. The separate `.ntg-sidenav` site hierarchy remains unchanged. Run `node --test src/js/on-this-page.test.mjs src/js/navigation.test.mjs` and `npm run build` after edits.
- Ordinary editorial links under `main#content` use `#1F1E27`, including visited and interactive states, without changing their underline or focus treatment. Navigation, pagination, sharing controls, buttons, hero CTAs, cards, feedback and status-alert components retain their own styling and contrast requirements.
- Editorial unordered-list bullets use `#343741`, including nested lists. The theme covers both the legacy `::before` icon bullets and native `::marker` bullets without changing list text or ordered-list numbering. Navigation and specialised components are excluded.

Keep the CMS list/link markup and destinations unchanged; these are CSS overrides, not replacement templates. Do not replace the scoped rules with a global anchor or list-item colour rule. The current-page breadcrumb override deliberately beats the legacy stylesheet's `!important` colour.

After changes, run `npm run build`, commit the rebuilt `dist/theme.css`, and refresh local and Matrix stylesheet cache references. Ignored homepage/content captures can be updated locally but should not be force-added to Git.

Validate ordinary and hero breadcrumbs, side-nav title/active/nested links, editorial links, and nested bullets at desktop and mobile widths (1440px, 375px and 320px). Check hover, keyboard focus, wrapping, unchanged navigation/status colours, and a normal reload. Earlier editorial overrides were checked with headless Chrome against four saved captures and local legacy plus compiled CSS. The shelter in-page navigation was also verified in the integrated browser at 1440px, 768px, 375px and 320px: nearest-heading selection in both scroll directions, footer containment, layout-change updates, tall-menu scrolling, normal mobile flow and print hiding. Desktop overlap checks confirmed an opaque panel and zero gap between the accent and rail after a normal reload. The shelter capture's existing footer logo row still overflows at narrow mobile widths; this is unrelated to the in-page navigation. Live CMS integration and externally hosted font availability remain separate checks. Use a real browser for complex selector exclusions: the current happy-dom version does not reliably match ancestor selectors inside `:where()`.

## Adding new CSS component files

1. Create a new file in `src/css/components/`, e.g. `src/css/components/hero-banner.css`
2. Add an `@import` line to `src/css/main.css`:

   ```css
   @import "./components/hero-banner.css";
   ```

3. Run `npm run dev` to preview, or `npm run build` to compile.

Feature-specific styles can live beside their component scripts, as in `src/hero-banners/`; import those styles through `src/css/main.css` using their relative paths rather than introducing a second theme bundle.

## Adding new JS modules

1. Create a new file in `src/js/`, e.g. `src/js/my-feature.js`
2. Add an import to `src/js/main.js`:

   ```js
   import "./my-feature.js";
   ```

3. Vite will include it in `dist/theme.js` on build. No HTML changes needed.

Feature-specific scripts outside `src/js/`, such as `src/hero-banners/hero-banners.js`, are included the same way through an import in `src/js/main.js`.

## Customisations

Overrides of the upstream `ntgbase.min.css` theme are isolated in `src/css/components/` and feature folders such as `src/hero-banners/`, then imported through `src/css/main.css` so they take cascade precedence.

| File                    | What it overrides                                                                         | Detail                                                                                                                                                                                                                                                                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `alert.css`             | `.alert-warning`, `.alert-info`, `.alert-information`, `.alert-danger`, `.alert-critical` | Global alert banners matching the Level 2–4 emergency response framework: information `#FFC72C` (yellow, `#212529` dark text ≈11.6:1 AAA), warning `#D6410A` (orange, white ≈5.0:1 AA), critical `#FC4141` (red, white ≈3.5:1 — AA large text only); 20px bold title `!important`, 16px body `!important` (forces override of PROD cascade); 24×24 close button absolutely positioned at `top: 16px; right: 16px` — dark icon on yellow, white icon on orange/red |
| `buttons.css`           | `.btn.ntg-btn` (primary)                                                                  | Background changed from navy `#1f1f5f` to Charcoal `#343741`; active state also updated                                                                                                                                                                                                                                              |
| `buttons.css`           | `.btn.ntg-btn--secondary` (outline)                                                       | Text and border colour changed from navy `#1f1f5f` to Charcoal `#343741`; white background; active state also updated                                                                                                                                                                                                                |
| `buttons.css`           | `.btn.ntg-btn--secondary:hover`                                                           | Background and border colour changed to Territory orange `#D6410A` (was `#2d2d8a`)                                                                                                                                                                                                                                                   |
| `buttons.css`           | `.homepage-news .btn.ntg-btn`                                                             | Border radius removed from the "View all" button                                                                                                                                                                                                                                                                                     |
| `buttons.css`           | `.cta-button.btn.ntg-btn--primary`                                                        | Border radius removed from primary CTA links                                                                                                                                                                                                                                                                                           |
| `header-footer.css`     | Two-row header, footer, and mobile search banner                                          | `.header-top` uses charcoal `#343741`; `.header-navigation` uses `#424550`; the desktop search is expanded in the top row; the mobile search banner uses charcoal `#343741`                                                                                                                                                             |
| `header-footer.css`     | Mobile search banner background                                                           | `.mobile-banner` overridden from navy `#1f1f5f` to Charcoal `#343741`                                                                                                                                                                                                                                                                |
| `mainmenu-dropdown.css` | Main navigation styles                                                                    | Desktop navigation has content-width mega-menu panels with grouped links; mobile navigation uses a charcoal nested drawer. |
| `statistics.css`        | Statistics section                                                                        | Sand `#D9DED4` background; black text and icons                                                                                                                                                                                                                                                                                      |
| `main.css`              | Display card icons                                                                        | Icons use `fa-solid` (FA 6); default colour `#f4551a` (orange), hover colour `#c84c01` (darker orange)                                                                                                                                                                                                                               |
| `main.css`              | Display card titles                                                                       | Title colour `#343741` (Charcoal); orange long-arrow-right (`→`) appended via `::after`, slides 4 px right on hover; title uses flexbox row layout                                                                                                                                                                                   |
| `main.css`              | `.homepage-news .text-ntg-sky-blue`                                                       | Blue utility class overridden to black (`#000`) within the news section                                                                                                                                                                                                                                                              |
| `main.css`              | `.homepage-news .card-title`                                                              | Title colour set to Charcoal `#343741`; turns orange `#c84c01` on hover                                                                                                                                                                                                                                                              |
| `main.css`              | `.homepage-news .card`                                                                    | Border radius removed from news cards                                                                                                                                                                                                                                                                                                |
| `main.css`              | `.homepage-news .card-header`                                                             | Bottom border removed from card header                                                                                                                                                                                                                                                                                               |
| `main.css`              | `.homepage-news .card-tag`                                                                | Category label styled as a tag (design system default variant: white bg, `#1f1e27` text, `#d3d3d7` border)                                                                                                                                                                                                                           |
| `content-page.css`      | Content pages with a share panel and no in-page navigation                               | At widths of 768px and above, offsets the first content block to align with the share panel; mobile layout is unchanged                                                                                                                                                                                                              |

### CMS accordions

Shared CMS accordion styles live in `src/css/components/accordion.css` and are imported through `src/css/main.css` into `dist/theme.css`. Styles are scoped to `.ntg-accordion` and `.ntg-accordion-toggler`, leaving unrelated Bootstrap accordions unchanged. Headers use grey collapsed and expanded states with teal labels and chevrons; expanded content uses a white panel. Accordion surfaces and controls have square corners. The `.ntg-accordion-container.container-xl` wrapper fills its containing column without the default max-width or horizontal gutters, keeping the rows, panel and open/close-all controls aligned with the content.

Keep the CMS Bootstrap collapse markup and controls intact. After changing accordion styles, run `npm run build`, increment the theme CSS query version in all local captures, and verify collapsed and expanded states, keyboard and open/close-all behavior, and content-column alignment at mobile, tablet and desktop widths.

### Header navigation

Desktop navigation wrappers and top-level links stretch through the full 56px minimum-height bar. The link list has zero flex gap: each link, including the first, has `1rem` horizontal padding per side at widths of 1200px and above, or `0.5rem` from 768px to below 1200px. The nav's responsive negative left margin matches the first link's padding, keeping its label aligned with the header content edge despite the upstream theme's default nav margin.

Both header rows use the hero's 1280px maximum content width. At 768–991px their 64px content inset matches the hero; from 992px up their 102px inset matches the desktop hero heading. The mobile header keeps its compact 16px gutter.

Emergency contacts uses white text and no underline with `!important` to withstand the production cascade. Its hover, keyboard-focus, and active states use `#424550`, and its desktop/tablet horizontal padding matches the menu. Desktop main navigation states use `#343741`. Desktop menu links retain the same bottom-border width between normal and hovered states so vertically centred text does not jump; keyboard focus outlines remain available.

On the Current warnings page, the header search sits beside Emergency contacts from 768px up, and the search banner below the navigation is used below 768px. The two forms are switched with `d-md-flex d-none` and `d-md-none`; keep those breakpoint utilities in sync when changing the responsive behavior. Both forms share the same 296px width and 48px height.

The header overrides upstream bottom padding with `padding-bottom: 0 !important`, removing the extra 30px grey strip between navigation and the page accent bar. Matrix renders one `.ntg-main-nav__links.cms-main-nav` tree for both desktop and mobile using the [three listing templates](src/navigation/README.md). Desktop uses content-width mega-menu panels with CMS-rendered overview links and groups, packed into three columns or two at 768–991px. Each desktop parent has one native label-and-chevron disclosure button and one keyboard stop; its destination remains available through the overview link. Mobile retains separate destination links and arrow buttons. Items without children remain ordinary links on both viewports. Overview titles use styled non-heading elements so the menu does not add heading levels to the page outline. Descriptions come directly from HTML-escaped `page-description` metadata, not JavaScript data or JSON attributes. Panels scroll when needed and close on Escape, focus leaving the menu, or an outside click. JavaScript binds existing controls, assigns accessible state and never replaces or rewrites menu anchors. The mobile drawer retains its nested accordion; without JavaScript, links remain visible in normal flow.

After changing navigation styles or scripts, run `node --test src/js/navigation.test.mjs src/js/quick-exit.test.mjs src/search/autocomplete.test.mjs` and `npm run build` so the Squiz Matrix file bridge receives the updated `dist/theme.css` and `dist/theme.js`. The navigation tests expand the documented HTML divisions, preserve literal `href` attributes and anchor identity, and exercise empty results, repeat initialization, desktop disclosure, mobile sibling resets and breakpoint cleanup. Check panel alignment, keyboard interaction, and the mobile drawer in the local preview. Matrix keyword expansion, permissions, root scoping and published-page caching still require CMS verification.

### Mobile navigation

Below 768px, every menu item with children has a destination link on the left and a separate 40 by 40px chevron button on the right. The left link navigates to the unchanged CMS destination and closes the drawer; it does not expand the submenu. The button expands or collapses children without navigating, exposes `aria-controls` and `aria-expanded`, and updates its accessible label and tooltip. This applies at every nesting level; leaf items remain ordinary links.

The drawer preserves its accordion behavior: opening a sibling closes the previous sibling and its descendants, and collapsing a parent resets its descendants. Menu links and chevron buttons have no separator borders, including in hover and expanded states. The charcoal `#343741` background and white text remain; hover, keyboard focus, and expanded states use `#444855`. Hover effects apply independently to each control. Focus outlines are retained for keyboard accessibility.

Top-level links use 16px left padding, level 2 links use 36px, and level 3 links use 48px. Parent rows use a flexible link column and a fixed 40px button column; long labels wrap without moving or resizing the button, and child lists span both columns. Mobile submenu selectors override inherited link padding and borders, and expanded lists explicitly override the captured `alt.css` rule that otherwise hides them.

Tab reaches the link before its chevron button; Enter and Space toggle focused buttons. The menu's Escape keydown handler closes the drawer and returns focus to the menu trigger. The captured upstream `ntgbase-components.min.js` also binds Escape keyup to Quick Exit, which opens `nt.gov.au` and redirects to Google. Preserve that safety behavior; test the menu keydown handler separately when checking focus return.

After applying the listing markup, rebuilding and updating asset versions, verify normal reloads on each migrated capture. The alerts capture is the three-level reference; older captures retain a static fallback until migrated. Check all four border widths on links, buttons, list items, and child lists in closed, expanded, and hover states; check 320px and 375px layouts for wrapped labels, and the 767px/768px transition for drawer cleanup and unchanged desktop mega-menus. Emergency contacts inside the mobile drawer must be supplied by the CMS rather than copied from the header by JavaScript; see the listing guide.

### Homepage Latest Events

The homepage Latest Events section is styled in `src/css/components/homepage-latest-events.css`, imported by `src/css/main.css`. Each card uses `data-warning-level="advice"`, `"watch_act"`, or `"emergency_warning"` to select the shared `--clr-status-advice`, `--clr-status-watch-act`, or `--clr-status-emergency-warning` accent and tag tint. When `data-warning-level` is absent or empty, `data-emergency-type="storm"`, `"flooding"`, or `"flood"` selects the default alert orange, `--clr-status-warning` (`#d6410a`). Unrecognised status or hazard values remain neutral; `data-location` does not affect colour. Tags use a 14% tint of the selected accent, except Advice tags which use solid `#FBE032`.

Latest Events uses a pale-grey container capped at 1280px, 32px desktop container padding, and square cards with 24px padding, 240px minimum height, and 3px accent borders. The grid changes from three columns to two below 992px and one below 576px. Metadata can wrap, and cards expand for longer descriptions rather than clipping text. Tag text follows its warning accent, with Advice using dark yellow `#716309` for legibility. On mobile, the heading and card copy use the larger homepage type scale, event cards are separated by 32px, and “View all warnings” is hidden. The “Find out more” link keeps fixed padding while its arrow shifts 2px right on hover without vertical layout movement.

### Homepage featured content

Homepage featured-content cards use `src/css/components/homepage-featured-content.css`, imported by `src/css/main.css`. The stylesheet targets the CMS `.ntg-featured-content-small` markup and styles its visible `.card-link` as the orange CTA; card copy, destinations, and photos remain CMS-managed. The pale-teal card is inset 52px at tablet widths and 56px on desktop to align with the homepage content column. Cards use a text/image split at those sizes, while narrow layouts stack the image below the text. The `ntg-featured-content-small--image-left` modifier retains image-first ordering on desktop.

The local `SecureNT.html` capture is gitignored. For local preview, its feature-card image URLs can point to matching files in the also-gitignored `SecureNT_files/` directory; production CMS image URLs are unchanged. After changing featured-content styles, run `npm run build` and deploy the updated `dist/theme.css` with the source CSS.

### Footer

The shared mobile footer styles live in `src/css/components/header-footer.css`. Below 768px, footer columns have 40px of vertical separation, and social links remain on one horizontal row with wrapping disabled. Keep the footer labels, links, and social destinations in the CMS markup.

### Hero banners

Hero CSS and JavaScript are isolated in `src/hero-banners/`. Both stylesheets are imported by `src/css/main.css`; `hero-banners.js` is imported by `src/js/main.js`. They ship in the existing `dist/theme.css` and `dist/theme.js` bundles, with no separate CMS asset includes.

`homepage-hero.css` targets `.hero-banner.intro-section.bg-ntg-background-purple-light`; retain the CMS `bg-ntg-background-home` class. It preserves the charcoal background, white 42px desktop heading, 14px copy and orange Incident map action. The `#current-conditions` panel is scoped to `main.ntg-body--homepage`: 49px desktop overlap and 34px tablet overlap; below 576px it has no overlap and fills the available width. Mobile hero text uses a 32px heading and 18px copy. The gitignored homepage capture now uses the supplied purple-light classes; any corresponding CMS template correction must be made separately.

`landing-hero.css` targets `.hero-banner.intro-section.bg-ntg-background-alt`. It uses a pale-grey `#E7E7EA` background, dark text, 40px/44px desktop heading, 18px/20px copy and a 604px maximum content column. Below 576px the heading is 32px/36px. Content stays in document flow, wraps and grows without a fixed hero height. Breadcrumbs and an optional orange CTA receive their own scoped styles and keyboard focus outlines.

The landing initializer moves the existing preceding CMS `.breadcrumb-container` into the hero, preserving its navigation and links. It also supports a breadcrumb already inside the hero, and can hide an immediately preceding title-only container only when its H1 exactly matches the hero H1. If the copy contains an `.intro-text-link`, it is moved below the copy and receives one decorative Font Awesome external-link icon. Initialization is repeat-safe; absent breadcrumbs, absent CTAs and unrelated content are left alone. No new link or copy is generated, and homepage heroes are not mutated.

The Alerts and warnings capture uses the supplied PROD structure with the updated incident-map copy and Incident map CTA: one hero heading and an external breadcrumb before enhancement. Its captured alerts are replaced by the existing localhost listing fixture at runtime. Local assets and source entry points remain wired for preview. Without JavaScript, the breadcrumb stays outside the hero and the CTA remains in its original copy; all text and links remain available.

After changing hero sources, run `npm run build` and deploy the updated theme CSS and JS with their source files. Check both variants at mobile, tablet and desktop widths, including breadcrumb placement, wrapping and unchanged homepage overlap.

### More updates

The Alerts and warnings capture uses the PROD `.ntg-display-cards` markup inside `#more_updates_1657034`. It contains six title-only cards: SecureNT, Bushfire NT, Power and water, Road report NT, BOM and NT Fire services. Each card uses an H3 title and a stretched link with a visually hidden `Go to ...` label. The supplied markup has no separate section heading or briefcase icons.

Bootstrap's `row-cols-1 row-cols-md-2 row-cols-lg-3 g-3` classes produce one column on mobile, two from 768px and three from 992px. Existing display-card rules in `src/css/components/main.css` provide the charcoal titles and orange arrow; no additional stylesheet or script is required. Preserve CMS-managed link destinations when refreshing the capture, and verify all six labels, responsive columns and text wrapping in the local preview.

The latest warning banner uses `.warning-banner` markup with `role="alert"`, `data-warning-level`, `data-emergency-type`, and `data-location`. Set `data-warning-level` to `advice`, `watch_act`, or `emergency_warning`; it controls the banner's accent border and subtle background tint through the shared status colour tokens. Use an icon image matching both the hazard and warning level, with a 24px height. Unknown or missing levels use a neutral accent. The local `SecureNT.html` capture is ignored by Git; production warning markup is managed in the CMS and must be updated there separately. After changing warning styles, run `npm run build` and deploy `dist/theme.css` with the source CSS.

### Local conditions

The local-conditions widget renders cards for fire danger, air quality, and temperature when usable data is available. Its styles live in `src/local-conditions/local-conditions.css`, imported by `src/css/main.css` into the shared `dist/theme.css` bundle. Below 576px, location controls stack at full width and condition cards use outlined panels with 32px separation. A card and its source line are omitted when its value is unavailable; pending requests use skeleton placeholders, while other available cards remain visible. The bushfire card includes the feed's issue date when valid. Its gauge has five categories across six units, with a gray Not rated band at the left and the selected rating band twice the width of the others. Loading is communicated with the busy state rather than a loading message.

On the homepage, Local conditions forms a separate lower panel immediately after Latest events within the current-conditions frame. A full-width top border separates the sections, with 40px spacing on either side of the divider and content aligned to the frame's responsive gutters.

Temperature readings keep each caret icon, number and Celsius unit together without line breaks. When both readings do not fit side by side, the maximum wraps above the minimum.

The location list, coordinates, and running observed minimum and maximum temperatures come from the BOM Northern Territory observations XML. Temperatures are rounded to whole degrees for display. Local development uses the checked-in `public/IDD60920.xml` snapshot, so its values are not live; refresh it from `https://www.bom.gov.au/fwo/IDD60920.xml` when needed. Production requests the same-origin Matrix asset `./?a=1657184`. The fire and air-quality service supports only matched locations; groups without usable readings are omitted. Run `node --test src/local-conditions/local-conditions.test.mjs` for Local Conditions tests, and `npm run build` to update `dist/local-conditions.js` and `dist/theme.css` and copy public fixtures into `dist/` for deployment.

Air quality displays the NT EPA station-level `IndexValue`, not a pollutant concentration or an inferred category. Localhost proxies `https://api.brainiumlabs.com.au/ntepa/stationindex.json`: `/api/air-quality` returns the station catalog, and `/api/air-quality?id=<id>` returns the matching index. The JSON feed's `d` array identifies stations by `serialCode`: 1 (Palmerston), 2 (Winnellie), 3 (Stokes Hill), and 4 (Katherine). Darwin Airport uses Winnellie, and Darwin Harbour uses Stokes Hill. Missing EPA locations are added to the dropdown in both environments; existing locations match by name and retain their BOM keys, coordinates, and temperatures. EPA-only entries use stable `epa-<id>` keys and have no invented coordinates; their temperature group is omitted when readings are unavailable. Missing or negative sentinel indices omit the AQI group; zero is a valid index.

The air-quality badge uses the station's `IndexColorStrHex` for its dot and `IndexColorDescription` for text such as Good or Fair; it does not infer a category from the numeric index. Missing or invalid colours use a neutral dot, and missing descriptions omit the badge without hiding a valid index.

When a valid AQI is available, its source line includes the EPA station name and reading date/time in `Australia/Darwin` (ACST), with a machine-readable `time` element. The feed has no station-level timestamp: use the latest valid `Date` among pollutants whose `IndexValue` matches the station AQI. Missing timestamps are omitted rather than replaced with the fetch time. If AQI is unavailable, both its card and NTEPA source line are omitted.

Production requests `./?a=1657186`, which returns the same JSON feed with a Matrix cache expiry of 900 seconds. No station query parameter or cache-busting parameter is added; the widget selects the station from the response by `serialCode`. Catalog failures leave the original BOM dropdown usable. Air quality loads independently of fire danger; either request failing does not erase successful readings from the other source or BOM temperatures. In production, the widget fetches fire-danger JSON directly from the same-origin integration at `https://cmsexternal.nt.gov.au/securent/_design/integrations/fire-danger-ratings`, so it does not depend on a worker URL in CMS markup. It selects by forecast area code: Darwin and Palmerston (`NT_FW001`), Alice Springs (`NT_FW014`), Katherine (`NT_FW007`), Tennant Creek (`NT_FW012`), Nhulunbuy (`NT_FW006`), and Yulara (`NT_FW018`, Lasseter East). The selected severity is displayed from No Rating (level 0) through Catastrophic (level 4). The Vite localhost endpoint reads `public/fire-danger-ratings.json` and applies the same mapping and severity normalization.

The BOM and EPA catalogs load concurrently with independent 30-second browser timeouts, including response body reading. Each usable catalog populates the dropdown immediately without waiting for the other request. Later arrivals merge locations and update available temperatures while preserving the user's chosen location and existing readings when its service mappings are unchanged. A saved location that arrives later is restored only if the user has not already chosen a location. A failed, invalid or empty BOM feed does not prevent EPA locations and AQI from loading; the temperature group is omitted for EPA-only locations. If neither catalog provides usable locations after both requests finish or time out, the controls remain disabled and the status reports that locations are unavailable. Late timed-out responses cannot replace the catalog.

#### Matrix Feed Setup and Verification

Asset `1657184` must return raw BOM XML with a `product` root and `observations > station` entries; asset `1657186` must return raw EPA JSON with a `d` array. Remove or override inherited site designs and paint layouts on integration endpoints so they do not wrap feeds in SecureNT HTML. Use an XML content type for BOM and `application/json` for EPA only after the response bodies are correct. Forwarding upstream headers alone does not remove HTML wrappers. Follow the normal publishing workflow and verify read permissions for the intended audience.

An integration's successful HTTP test confirms upstream access, not its frontend output. On the homepage, inspect the actual requests for `./?a=1657184` and `./?a=1657186`, including redirects, status, content type and response body. A raw `/_nocache` integration response does not establish that the widget's asset-ID URL serves the same payload. HTML login/error pages and site-wrapped feeds remain invalid even with HTTP 200. Do not change the widget to parse HTML as a fallback.

Load `dist/local-conditions.js` after the widget markup with `type="module"`, and load the shared `dist/theme.css`. Remove empty or query-only stylesheet references such as `href="?h=..."`, which request the current HTML page as CSS. Publish source and rebuilt artifacts together through the Git bridge and refresh its asset references. `/api/local-conditions` is a localhost development route, not a CMS deployment endpoint; the production widget reads fire danger from the same-origin CMS integration directly.

Before release, run `node --test src/local-conditions/local-conditions.test.mjs` and `npm run build`. Check successful feeds, BOM failure with EPA fallback, EPA failure with BOM fallback, both catalogs unavailable, and delayed catalog responses in both arrival orders. Confirm the first usable catalog enables the dropdown before the other finishes, late arrivals preserve explicit user choices, and matching EPA locations gain BOM temperatures without duplicate options. Confirm saved selection, AQI attribution, temperature wrapping, the section divider, and coordinate-based control availability in desktop and mobile previews.

Verify the ordinary published production homepage as well as any `/_nocache` diagnostic route: their rendering and cache behavior can differ. The 30-second browser catalog timeout does not change Matrix's upstream request timeout or its 900-second feed cache; configure those separately in the integration asset Details screen.

Each location option exposes its latitude and longitude as `data-coordinates="latitude,longitude"`; an empty value means the station has no valid coordinates and is excluded from geolocation matching. Use location selects the nearest station by great-circle distance.

Use location is disabled when no available locations have valid coordinates; the dropdown remains usable for EPA-only locations.

Each card has a source link beneath it: Bushfires NT links to the NT incident map, NTEPA links to its homepage, and the temperature card links to BOM's Northern Territory observations. Fire-danger data comes from the CMS fire-danger ratings integration through the server-side worker; the incident-map link is an attribution link, not the data endpoint. Air-quality data comes from NTEPA, and failed or unsupported requests do not prevent BOM temperatures from displaying.

### Homepage news JS (`src/js/homepage-news.js`)

Runs at page load to transform the CMS-rendered category label markup into tag elements:

- Removes `inline-block float-start` classes, adds `card-tag`
- Strips the Font Awesome icon (`<i>`) from the label

Imported by `src/js/main.js` and bundled into `dist/theme.js` on build.

### Display cards JS (`src/js/display-cards.js`)

Runs at page load to fix Font Awesome icon classes inside `.ntg-display-cards`:

- Replaces `fal` (FA 5 Light) with `fa-solid` (FA 6) on all `<i>` elements
- Needed because the CMS still renders the legacy FA 5 class while the site uses the FA 6 Pro kit

Imported by `src/js/main.js` and bundled into `dist/theme.js` on build.

## Deployment

The `deploy-to-dev.prompt.md` prompt targets the `dev` branch. The `securent` remote currently uses `main`; use the repository's configured branch when committing and pushing unless a `dev` deployment is intended.

## Favicons

The icon-only source is `assets/secure-nt-favicon.svg`. Its shield artwork keeps the white and orange mark over a Charcoal (`#343741`) fill. The PNG exports in `public/` are the 180×180 Apple touch icon and 32×32 and 16×16 favicons. `npm run build` copies them to `dist/`; publish those files at the site root with the updated page HTML so the root-relative icon links resolve.

## Brand colours

Source: _Accessible Colours — Brand Guidelines, May 2025_

### Primary

| Name      | HEX       | Accessible HEX | Accessible with |
| --------- | --------- | -------------- | --------------- |
| Territory | `#F4551A` | `#D6410A`      | White text      |
| Charcoal  | `#343741` | `#343741`      | White text      |

### Secondary

| Name      | HEX       | Accessible HEX | Accessible with |
| --------- | --------- | -------------- | --------------- |
| Sand      | `#D9DED4` | `#D9DED4`      | Black text      |
| Monsoon   | `#003251` | `#003251`      | White text      |
| Coastline | `#2E979C` | `#288186`      | White text      |
| Savannah  | `#566C30` | `#566C30`      | White text      |
| Ranges    | `#552855` | `#552855`      | White text      |

### Regional

| Name              | HEX       | Accessible HEX | Accessible with     |
| ----------------- | --------- | -------------- | ------------------- |
| Darwin            | `#76BA43` | `#398600`      | Black or white text |
| Top End           | `#009DC1` | `#00819E`      | Black or white text |
| East Arnhem       | `#D1DD26` | `#D1DD26`      | Black text          |
| Big Rivers        | `#FCB414` | `#FCB414`      | Black text          |
| Barkly            | `#F05A24` | `#D2430F`      | White text          |
| Central Australia | `#ED164E` | `#A8114B`      | White text          |
