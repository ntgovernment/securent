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
│   │   ├── curation.mjs               # Warning curation and mapped detail enrichment
│   │   ├── curation.test.mjs          # Curation regression tests
│   │   ├── feeds.mjs                  # Source and mapped-warning feed loading
│   │   ├── feeds.test.mjs             # Feed parsing and error-state tests
│   │   ├── aws-icons.mjs               # AWS hazard and warning-level icon mapping
│   │   ├── aws-icons.test.mjs          # AWS icon mapping and fallback tests
│   │   ├── locality-lookup.mjs         # Browser-side locality boundary lookup
│   │   ├── locality-lookup.test.mjs    # Locality geometry regression tests
│   │   ├── nt-localities.json         # Licensed NT locality boundary subset
│   │   ├── media-releases.js          # Search, filters, cards and result pagination
│   │   ├── latest-media-releases.js   # Standalone latest-three warnings listing
│   │   ├── media-release-card.js      # Shared full and compact warning card renderer
│   │   ├── latest-warnings.preview.json # Local warning-card preview combinations
│   │   ├── mapped-warnings.preview.json # Local mapped warning examples
│   │   ├── preview-warnings.mjs       # Random selection for localhost previews
│   │   ├── preview-warnings.test.mjs  # Preview combinations and randomization tests
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
│   │   ├── fire-danger.mjs           # Fire-area codes and rating normalization
│   │   ├── worker.js                 # Production fire-danger proxy
│   │   └── wrangler.toml             # Worker deployment configuration
│   ├── social-share/
│   │   ├── social-share.css          # Standalone styles for the Squiz share nester
│   │   └── social-share.js           # Share popups, native sharing and copy fallback
│   ├── search/
│   │   ├── README.md                 # Coveo presentation, CMS script order and publication
│   │   ├── results.css               # Scoped result cards, controls and pagination styling
│   │   ├── results.ts                # JSON-title breadcrumbs and updated-date enhancement
│   │   ├── results-entry.ts          # Standalone search presentation entry point
│   │   ├── results.test.mjs          # Search rendering and title-lookup regressions
│   │   └── autocomplete.mjs          # Shared listing autocomplete helper
│   ├── css/
│   │   ├── main.css                  # CSS entry point — add @imports here
│   │   └── components/
│   │       ├── accordion.css         # CMS accordion styling, states and content-width alignment
│   │       ├── alert.css             # Global alert banner styles: information (#FFC72C yellow, dark text AAA), warning (#D6410A orange, white AA), critical (#FC4141 red, white AA large text only); 24×24 close button anchored top-right
│   │       ├── back-to-top.css       # Fixed charcoal circular back-to-top control
│   │       ├── buttons.css           # Button overrides: primary bg Charcoal (#343741), secondary outline Charcoal + white bg, hover Territory orange (#D6410A)
│   │       ├── content-page.css      # Content page body alignment when no in-page navigation is present
│   │       ├── mainmenu-dropdown.css # Content-width desktop mega-menu and mobile drawer styles
│   │       ├── header-footer.css     # Header/footer brand colour overrides; background: Charcoal (#343741)
│   │       ├── homepage-featured-content.css # CMS homepage feature cards: responsive image/text layout and CTA styling
│   │       ├── homepage-latest-events.css # Homepage warning banners (20px headings, 24px icon boxes) and event cards
│   │       ├── active-recovery.css   # Homepage Active recovery programs card layout and interaction styling
│   │       ├── statistics.css        # Statistics section styles
│   │       └── main.css              # Breadcrumbs, side-nav colours, editorial links/bullets, display cards and homepage-news overrides
│   ├── data/
│   │   └── navigation.js             # Legacy menu data; no longer imported by the shared theme
│   ├── navigation/
│   │   └── README.md                 # Matrix Main, Level 2 and Level 3 listing templates and publication steps
│   └── js/
│       ├── back-to-top.mjs           # Scroll-triggered, accessible site-wide back-to-top control
│       ├── back-to-top.test.mjs      # Scroll visibility, accessibility and scroll behavior tests
│       ├── main.js                   # JS entry point — navigation, back-to-top and shared enhancements
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
│   ├── search-results.js             # Search-page-only Coveo presentation enhancer
│   ├── *.json                        # Copied public feed snapshots and generated Wrangler config
│   ├── theme.css
│   └── theme.js
├── assets/hazard-icons/              # Shared hazard alert pictograms
├── SecureNT.html                     # Local page capture (gitignored)
├── SecureNT_files/                   # Local page assets (gitignored)
├── Content page _ SecureNT.html      # Local emergency-plans content capture (gitignored)
├── alerts-and-warnings.html          # Alerts and warnings page capture
├── media-releases.html                # Current warnings preview page
├── Search _ SecureNT.html            # Archived search-page browser capture
├── Search _ SecureNT_files/          # Dependencies retained with the search capture
├── Severe Storm – Alice Springs _ SecureNT.html   # Default development event capture
├── vite.config.mjs
└── package.json
```

The homepage capture (`SecureNT.html`), emergency-plans content capture (`Content page _ SecureNT.html`), and shared `SecureNT_files/` assets are excluded from Git. Local captures use built page-specific styles and scripts from `dist/`; captured upstream dependencies and static assets may remain in `SecureNT_files/`. The event capture uses shared local assets, hazard icons from `assets/hazard-icons/`, and standalone `dist/event.css`, `dist/social-share.css`, and `dist/social-share.js` assets; it no longer has a separate asset folder. The content-page capture uses the same standalone event and share assets. On desktop, the event share panel aligns with the first content section after the event H1; on content pages, `content-page.css` aligns the first content block with the share panel when there is no in-page navigation. The local captures share the same two-row header: `.header-top` holds the logo, emergency contacts, and desktop search, while `.header-navigation` holds the primary navigation. The separate mobile search banner remains below the header. `vite.config.mjs` includes `SecureNT.html` as the build HTML entry when that optional capture exists; its production HTML transform removes references to the two local WEBP photos so they are not emitted in `dist/`, while development preview retains them. The event preview does not change production build inputs. The `dist/` files are tracked because they are consumed by the Squiz Matrix file bridge.

The tracked search capture and its companion assets are archived browser snapshots, not production build entries. They retain the original captured theme and template rather than automatically loading the new search enhancer. See [the search guide](src/search/README.md) for the live CMS integration and validation steps. Captured vendor files retain their existing license notices.

The JSON feed files in `dist/` are build copies of the tracked snapshots in `public/`; edit the source snapshots, not the copies. They are not evidence of current emergency conditions. `dist/wrangler.json` is generated from `wrangler.jsonc` and can contain machine-specific source paths; regenerate it with the build rather than editing it manually.

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

Vite starts a local dev server and opens `/`, serving the homepage capture in `SecureNT.html`. That gitignored local capture must be present to preview the homepage; it is also available at `/SecureNT.html`. The Severe Storm - Alice Springs event capture remains available at `/Severe%20Storm%20%E2%80%93%20Alice%20Springs%20_%20SecureNT.html`. The Current warnings capture remains available at `/Current%20warnings%20_%20SecureNT.html`; the Alerts and warnings capture remains at `/alerts-and-warnings.html`, and the standalone Current warnings page at `/media-releases.html`. The development middleware in `vite.config.mjs` serves available homepage, Current warnings, and event captures through Vite's HTML transforms. External navigation links still point to the CMS, and externally hosted fonts require network access. These captures are development snapshots, not live emergency feeds.
In development, Vite rewrites captured `dist/theme.css` links to `src/css/main.css` and warning-listing scripts to their `src/media-releases/` modules, so those changes update directly from source without rebuilding. Other generated application styles and scripts still load from `dist/`; run `npm run build` after changing sources and before deployment. Captured vendor dependencies and static assets load from the shared, gitignored `SecureNT_files/` directory.
The build rewrites the legacy logo URL in the captured `ntgbase.min.css` to `/mysource_files/ntg-primary-mono.svg`; keep the matching public SVG at `public/mysource_files/ntg-primary-mono.svg` so Vite can copy it into `dist/`.

Existing Vite servers and browser tabs can cache built assets even after rebuilding. Refresh the `?v=` references in each capture being verified, then check a normal reload without temporary test URLs. The tracked Current warnings, shelter, Alerts and warnings, and standalone warnings captures reference `dist/theme.js?v=35`; the event capture uses `dist/theme.js?v=36`. The Current warnings capture references `dist/theme.css?v=49`, and the event capture loads `dist/event.css?v=5`. Event templates with `main[data-event-page]` get a sticky in-page menu on tablet and desktop. Standard CMS accordion titles appear alongside H2 headings in page order, and navigation links and direct heading URLs open their matching panels. The active section changes when the next heading reaches the viewport top, not merely when it becomes visible. Repeated heading labels receive unique anchors, and visible anchor destinations remain selected when scrolling is clamped at the page bottom. Other page types are unchanged. See [event navigation](src/events/README.md#on-this-page) for markup, targeted tests and browser verification. Older navigation markup still needs the Matrix listing templates applied before testing the enhanced main menu. The homepage's standalone `dist/local-conditions.js` reference is version `3`. Update equivalent CMS asset references separately when deploying. Publish the three listing templates and matching theme assets together. Keep the theme stylesheet in the document head; panels stay collapsed while JavaScript loads, and the expanded fallback applies only when browser scripting is disabled.

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

Decreasing threat retains its own level label and filter value but uses the same yellow border as Advice. The local Santa Teresa decreasing-threat fixture keeps its hazard-specific Advice WEBP.

The shared **Sort by** dropdown offers Current order (the default feed order), Warning level, Newest updated, Location A-Z, and Title A-Z. Sorting applies to combined search/filter matches before pagination; changing sort resets to page 1. Equal values retain feed order. Warning levels sort Emergency warning, Watch and act, Advice, then Decreasing threat, with unknown levels last. Empty locations and invalid or missing update dates sort last. Timezone-less CMS `updatedAt` timestamps are interpreted as Northern Territory time (UTC+09:30); ISO timestamps with explicit offsets retain their offsets. Confirm this timezone assumption against the production endpoint before rollout.

The controls enhance existing `.alerts-listing__filters` markup automatically, so no extra CMS control markup is needed. Rebuild and refresh the listing CSS/JS asset versions in both the local capture and CMS references after changes. The local listing references currently use CSS version `19` and JavaScript version `11`. Run focused sorting regressions with `node --test src/alerts-listing/sorting.test.mjs`.

### Site search

The [search guide](src/search/README.md) covers the Coveo presentation patch and its required CMS script ordering. Cards use Lato, teal title links, subtle separators and responsive padding, followed by JSON-title breadcrumb paths, existing descriptions and last-updated metadata. The patch also styles search controls and any existing pagination.

Publish `dist/theme.css` and `dist/search-results.js` together, refresh their CMS cache references, and replace the old inline initialization with the guide's module import plus initialization block. Adding an independent module script beside the old classic initialization can run too late. Searching, corrections, filtering, result destinations and the existing 200-results-per-page setting remain owned by the CMS controller; no pagination is activated by this patch.

Run `node --test src/search/results.test.mjs` with a Node.js release supporting native TypeScript stripping (Node.js 22.18+ or 24+), then `npm run build`. The focused regressions cover title lookups and caching, missing metadata, lookup failures and stale async responses. Deployment verification should include keyboard focus, type filtering and 375px, 768px and 1280px layouts. A local build or Git push does not update the CMS initialization markup or cache references automatically.

### Current Warnings

When mapped regions are unavailable, region inference uses [nt-suburbs-by-government-region.json](src/media-releases/nt-suburbs-by-government-region.json), a 270-locality working map compiled from the NT Government regions map, the Australia Post NT locality list, and Geoscape locality boundaries. Exact locality matches in notice titles, names, and structured place fields take precedence over conflicting legacy aliases; broader area names such as Tanami and Lasseter remain as fallbacks. The source label “Greater Darwin, Palmerston and Litchfield” is presented as the existing **Greater Darwin** filter value. The source describes the six-region classification as a map rather than an authoritative locality table, so boundary localities may need spatial validation; do not treat these inferred regions as authoritative emergency boundaries.

The standalone **Current warnings** page ([media-releases.html](media-releases.html)) combines the NTES, Bushfires NT and NTG agencies Campaign Monitor feeds defined in [feeds.mjs](src/media-releases/feeds.mjs). It curates operational emergency notices rather than showing all government news. Matching `CampaignID` values are deduplicated with Bushfires NT > NTES > NTG agencies precedence; source labels remain available for filtering and curation. Warning/action language and the approved NTES duty-officer email in `FromName` identify operational items. AWS hazard campaigns from the official **NT Emergency Service** sender are also included when their subject omits words such as **warning** or **advice**; if a warning level is missing, it remains **Not identified**. General awards, recruitment, ceremonies, outlooks and corporate announcements are excluded unless operational warning language takes precedence. [curation.mjs](src/media-releases/curation.mjs) owns these rules.

The separate latest-three listing displays up to three eligible warnings, newest first, in responsive featured cards without search or filters. In production it requests the Bushfires NT, NTES, and NTG agencies feeds independently, applies the same curation and source-precedence rules as the full listing, and reports unavailable sources while showing warnings from feeds that succeeded. The localhost preview uses the merged `/api/media-releases/latest` proxy backed by the checked-in snapshots. See [the media-releases guide](src/media-releases/README.md) for embed markup, assets, preview behavior, and cross-origin requirements. It does not replace the full listing or automatically add itself to a page.

Both displays match `CampaignID` to `campaignId` in the mapped-warnings integration. Valid mapped hazard, warning level, location and regions enrich the existing curated notice; ordinary titles use **[Type] [level] for [Location]**, such as **Storm advice for Darwin**, when those values are available. A leading **Part of** or **Parts of** in a location is lowercased in the title without changing place-name capitalization. Mapped regions may contain multiple values and support the existing region filters and search. Missing or invalid fields use the existing classification, and an unavailable location leaves the original title unchanged. Declarations retain their type and styling while using mapped locations and regions. Mapping failures or timeouts preserve the existing warnings and show an accessible notice; source-feed errors are reported separately.

Featured warning titles use an `h3` with 20px bold text and a 24px line height. Severity tags use 12px bold Lato with 16px line height, 1px letter spacing, and the Emergency, Watch and act, Advice, Planned burn, and General information colors documented in [the media-releases guide](src/media-releases/README.md). On localhost, the latest-three proxy returns one randomly selected Decreasing threat, Planned burn, or General information example plus two randomized warning type/level examples from [latest-warnings.preview.json](src/media-releases/latest-warnings.preview.json). Production loads the three source feeds independently; their origin must allow those requests.

Run `npm run build` and start `npm run dev` to preview the homepage at `/` and the captured Current warnings page at `/Current%20warnings%20_%20SecureNT.html`. The standalone shell at `/media-releases.html` remains available and may normalize to `/media-releases`. Its search placeholder is **Search for a location, incident type or keyword**. Suggestions include terms from notice titles, mapped locations, available town, street, suburb, locality, and address fields, and regions; each option shows a decorative magnifying-glass icon. Selecting a suggestion filters the listing. Vite serves the warning modules from source during local development; built assets are used for deployment. Captured vendor dependencies and static assets load from shared, gitignored `SecureNT_files/`. Refresh versioned asset references after rebuilding: the Current warnings capture currently uses media-release CSS `36` and JavaScript `54`; the standalone shell uses CSS `35` and JavaScript `54`. Mapped warning enrichment does not alter the existing Alerts and warnings listing.

**Use location** resolves device coordinates against the bundled NT locality boundaries locally and searches for the locality name; denied, failed, timed-out, and out-of-NT lookups use Darwin. It does not transmit coordinates to a geocoding service or perform geographic warning-area matching. User edits during a pending lookup take precedence. See [the media-releases guide](src/media-releases/README.md) for attribution, Matrix markup, deployment, and verification.

During initial feed loading, ten animated skeleton cards match the warning-card layout, filter groups show checkbox placeholders, and a separate polite status announces progress. The results are marked busy and listing controls are temporarily inert; the header, footer and page scrolling remain usable. Skeletons are replaced by warning cards, an empty state, or the existing error message when loading completes. Reduced-motion preferences disable the shimmer. Search, filtering, sorting and pagination do not trigger a loading state. JavaScript creates the placeholders and status automatically, so no additional Matrix markup is required; publish the matching rebuilt CSS and JS together and refresh their cache references.

A **Filters** heading and text-only **Clear all filters** button appear below Sort by. Clearing unchecks all four filter groups and returns to page 1, preserving search text and sort order. Filter fieldsets are separated by spacing, not divider lines; the divider below Sort by remains. Include the heading and `data-clear-filters` button from the preview when updating Matrix listing markup. Both controls appear inside the mobile **Sort and filter** disclosure. Current filter behavior is documented in [the media-releases guide](src/media-releases/README.md); follow it where the legacy filter details below differ.

Warning level, Incident or notice type, Region and Source filters appear in that order. Incident or notice type combines emergency types and declarations, including **Fire ban notices**, **Planned burn advice**, and **Boil water notice**. Declarations retain their own filtering and card styles even if mapped as a hazard and warning level. The Source filter always lists configured sources, including zero-count sources. For unmapped fields, classifications are inferred from campaign names, subjects and available structured place fields; missing values remain available under **Not identified** (displayed as **Other**). Inferred region matching uses the locality map and broader aliases described above, and can match multiple regions or emergency types. Warning-level inference prefers the subject over the campaign name and does not treat a generic warning as an AWS Emergency warning. Inferred decreasing-threat, reduced-threat and all-clear classifications map to Advice unless a matching Squiz emergency-warning record explicitly supplies `decreasing_threat`. Those matched records retain a distinct **Decreasing threat** filter value and label while reusing the hazard-specific Advice WEBP, yellow card accent, and Advice badge colors. See [the media-releases guide](src/media-releases/README.md) for feed matching and styling details.

Warning accordions and event-page header accents also use Advice yellow for `decreasing_threat`. CMS accordion markup must retain the **Decreasing threat** label and use the matching hazard's Advice WEBP; see [the event guide](src/events/README.md#warning-accordion-paint-layout). Publish the rebuilt `dist/media-releases.css`, `dist/SecureNT_files/media-release-card.js`, `dist/alerts-listing.css`, `dist/warning-accordion.css`, and `dist/event.css` with their sources, preserve the generated WEBP dependencies, and refresh the corresponding CMS cache references. A Git push alone does not update CMS markup or cache references.

Selections use OR within a filter group and AND across groups, combined with search. Filter checkboxes use a square 2px outline with no border radius, a teal checked fill and white checkmark, and an `#ecf0f0` hover fill while unchecked. **Sort by** appears at the top of the sidebar and offers Newest first (default), Oldest first, Warning level (severity order), and Title A-Z. Filtering and sorting happen before ten-item pagination and reset to page 1. Missing or invalid dates sort last in either date order.

Full Current warnings cards use a shared layout of an icon, relative publication time, mapped or original title, and optional regions; they omit severity badges and the **More information** action. Each card stores its timestamp as an ISO value in the time element's `data-time` attribute, and both the full listing and homepage featured cards refresh relative labels every minute using minutes, hours, or days ago. Cards with identified emergency types and warning levels retain their AWS WEBP icons and warning-level accent colors. Planned burns use a warning icon and left border in `#865AA5`; **Other**, fire ban notice, and General information cards use a warning icon and left border in `#343741`. The region row uses `fa-light fa-location-dot` instead of a visible **Region:** prefix; the region label remains available to assistive technology. The entire card is one focusable outbound link when its feed URL is safe; otherwise it is not clickable. Agency, source, and separate classification details are omitted from card content; source values remain available in filters. Homepage latest-three cards use the featured layout, with a severity badge beside the warning icon and no separate **More information** action.

The card accent follows warning level (Advice yellow, Watch and act orange, Emergency warning red), except for the declaration and general-information accents documented above. AWS hazard pictograms use the first matched hazard type in classifier order; identified types without a dedicated pictogram use **Other**, while **Not identified** types or levels show no pictogram. Hover applies an exterior `0 4px 16px rgba(15, 15, 47, 0.15)` shadow and underlines the title. On mobile, the sidebar moves above the results and a **Sort and filter** disclosure contains the sort control and facets.

Both full and latest-three warning cards omit the region row when no region is identified. The full listing's **Other** region filter remains available for these warnings.

On Current warnings, the search and Sort by controls use the checkbox hover fill (`#ecf0f0`) only while idle. Their default, focused, and active states stay white, and the search remains white when populated. Verify the built styles with `npm run build` followed by `node --test src/media-releases/media-releases.test.mjs`.

Both listings share pagination styles and page-window logic. Up to five pages are shown in full; longer lists show the first page, nearby pages, the last page, and ellipses for omitted ranges.

On localhost, the warnings loader reads the checked-in JSON snapshots [bushfires-nt.json](public/bushfires-nt.json), [ntes.json](public/ntes.json) and [ntg-agencies.json](public/ntg-agencies.json), selected by each source ID. Both displays use [mapped-warnings.preview.json](src/media-releases/mapped-warnings.preview.json) through `/api/media-releases/mapped-warnings`; unmatched examples retain their original logic. This keeps preview behavior independent of live-feed availability and cross-origin access. Outside localhost, the loader uses the absolute production integration URLs defined in [feeds.mjs](src/media-releases/feeds.mjs).

| Source | Integration Path |
| --- | --- |
| Bushfires NT | `/_design/integrations/campaign-monitor-bushfires-nt` |
| NTES | `/_design/integrations/campaign-monitor-ntes` |
| NTG agencies | `/_design/integrations/campaign-monitor-ntg-agencies` |
| Mapped warnings | `/_design/integrations/mapped-warnings` |

The data-source URLs are `https://cmsexternal.nt.gov.au/securent/_design/integrations/campaign-monitor-bushfires-nt`, `https://cmsexternal.nt.gov.au/securent/_design/integrations/campaign-monitor-ntes`, and `https://cmsexternal.nt.gov.au/securent/_design/integrations/campaign-monitor-ntg-agencies`. Publish the three integration assets at those paths.

Matrix keyword attributes are no longer required or read. Remove the old `data-feed-*` attributes from the paint layout when convenient; the updated script ignores stale values. The opening listing tag is:

```html
<section class="media-releases__listing" data-media-releases aria-label="Current warnings">
```

Source integrations must return raw JSON (an array or an object containing a `Results` array), while the mapped-warnings integration must return a JSON array, not a site-wrapped page or login response. Production requests use the configured absolute URLs and require CORS permission if the page origin differs. Available sources still render if another source fails, with a partial-feed notice; total feed failure shows an unavailable state and logs an `AggregateError` containing the underlying failures. Expand its `errors` list in DevTools to distinguish HTTP failures and invalid JSON. Feed page metadata is ignored; the listing reports when no warnings match.

This HTML is a local preview shell, not a Vite production HTML entry. For Matrix integration, use the listing markup and built media-release CSS/JS alongside the shared theme and pagination CSS. Include the listing script once with `type="module"`. Publish `dist/SecureNT_files/autocomplete.js` and `dist/SecureNT_files/page-window.js` with both full listing bundles, and `dist/SecureNT_files/nt-localities.js` with the Current warnings bundle. Publish `dist/SecureNT_files/media-release-card.js` and all generated `dist/SecureNT_files/*.webp` AWS pictograms with the current-warnings and latest-three bundles. Preserve the relative paths of these shared assets. The ignore rules keep captured assets excluded while allowing these generated dependencies to be tracked. Rebuild and refresh the page and CMS asset versions together when shipping changes.

Validation checklist:

- If a new Campaign Monitor record is missing on the live pages, compare its source data with the curation rules, then verify the Matrix bridge branch, published shared module, and caches. See [missing live warnings troubleshooting](src/media-releases/README.md#troubleshooting-missing-live-warnings). Pushing a fix to a different branch or updating only an entry-script query string does not update the shared curation module.
- Run `npm run build` before `node --test src/search/autocomplete.test.mjs src/pagination/page-window.test.mjs src/media-releases/*.test.mjs src/alerts-listing/sorting.test.mjs` for autocomplete, pagination, AWS icon tiers/fallbacks, extraction, precedence, combined filters, sorting, date parsing, feed failures and loading skeleton cleanup. The loading DOM tests use happy-dom, the preview HTML and the built media-release module; rebuild after source changes so they exercise the current implementation.
- Run `npm run build` and publish the standalone assets, shared `autocomplete.js` dependency, and generated AWS WEBP icons with their source changes.
- Check that Fire ban counts are based on deduplicated notices, including singular/plural wording in campaign names and subjects. Fire bans must appear in Incident or notice type as **Fire ban notices**, not as Bushfire or Advice; their full-listing cards use the General information layout, neutral warning icon and `#343741` left border, and omit the emergency-type/warning-level line and AWS icon. Ordinary emergency cards must retain their AWS WEBP icons and warning-level accent colors.
- Check that **Clear all filters** unchecks Warning level, Incident or notice type, Region and Source, resets pagination to page 1, and preserves search text and sort order. Confirm that the text-only button and Filters heading fit on desktop/mobile and no fieldset divider lines remain.
- Manually inspect excluded candidates after curation changes, especially borderline operational announcements. Keep this review in validation; do not add a public exclusions section or generated review report.
- Check desktop/mobile search, combined filters, sidebar sorting, page resets, collapsed filter accessibility, and partial/all-source failures. Live feeds may stall; controlled browser fixtures can isolate UI checks without changing production feed configuration.
- For the latest-three listing, delay the local merged proxy response and verify that three responsive skeleton cards appear, the loading status remains accessible, reduced-motion disables the shimmer, and placeholders clear for successful, empty, invalid, and failed responses. In production, verify that available source feeds still show warnings and identify failed sources in the feed note.
- Delay feed responses and check the ten in-results skeleton cards, polite loading announcement, blocked listing controls, usable header/footer and reduced-motion behavior at desktop/mobile widths. Confirm placeholders are replaced or cleared after populated or empty results, partial/total feed failure and rendering errors. The automated DOM checks cover these cleanup paths.

## Build

```bash
npm run build
```

Outputs to `dist/`:

- `theme.css` — compiled, minified CSS imported by `src/css/main.css`, including `src/hero-banners/` styles
- `theme.js` — compiled JS imported by `src/js/main.js`, including the landing hero initializer and event navigation; wrapped in a function so classic CMS script tags cannot shadow legacy globals such as jQuery's `$`
- `alerts-listing.css` and `alerts-listing.js` — standalone assets for the Alerts and warnings page
- `media-releases.css` and `media-releases.js` — standalone assets for the Current warnings page
- `latest-media-releases.js` — standalone latest-three warnings listing, using `media-releases.css`
- `SecureNT_files/autocomplete.js` — shared autocomplete, sorting and date dependency
- `SecureNT_files/media-release-card.js` — shared warning-card rendering, feeds and curation dependency
- `SecureNT_files/page-window.js` — shared pagination dependency for the full listing bundles
- `SecureNT_files/*.webp` — generated AWS hazard pictograms imported by the Media releases bundle
- `pagination.css` — shared pagination styling and list-marker overrides for both listing pages
- `more-updates-cards.css` — styles for the bottom update cards on the Alerts and warnings page
- `link-group-grid.css` — standalone styles for reusable groups of links
- `event.css` and `social-share.css` — standalone event page and share nester styles
- `warning-accordion.css` — standalone warning accordions with level-based accents and light gray hover shadows; see [markup and validation](src/events/README.md#warning-accordion-paint-layout)
- `social-share.js` — standalone social popups, native sharing and copy fallback
- `local-conditions.js` — standalone location catalog and condition-card behavior; its CSS is included in `theme.css`

`theme.css`, `theme.js`, `alerts-listing.css`, `alerts-listing.js`, `pagination.css`, `more-updates-cards.css`, `event.css`, `social-share.css`, `social-share.js`, and `local-conditions.js` are referenced in Squiz Matrix via the git file bridge. Reference `dist/social-share.css` from the Squiz share nester after the global theme; it remains a standalone asset rather than part of `dist/theme.css`. Captured HTML uses `SecureNT_files/print.css` for local print preview; Vite does not generate it under `dist/`.

The share button uses the Web Share API when available and copies the URL otherwise. See [social-share paint layout guidance](src/events/README.md#social-share-paint-layout) for markup, fallback behavior and deployment.

The build redirects the captured homepage's previous `dist/theme.css` reference to the generated `/theme.css`. Capture-only vendor styles are kept separate so the source theme bundle retains the expected `dist/theme.css` filename for the git file bridge.

Theme CSS has an explicit `theme-styles` entry pointing to `src/css/main.css` in `vite.config.mjs`; the optional, gitignored homepage capture is not required to generate the theme bundle. Keep that capture and its local dependencies available when building or previewing the captured homepage. After building, confirm both theme assets exist before committing file-bridge updates.

## Link group grid

Build and publish `dist/link-group-grid.css` through the Squiz Matrix git file bridge, and reference it after the existing Bootstrap/NTG and theme styles wherever the component is used:

```html
<link rel="stylesheet" href="PUBLISHED-URL-OF-link-group-grid.css">
```

The component uses `.link-group-grid`, `.link-group-grid__groups`, and `.link-group-grid__group` with the supplied Bootstrap `row`, `col-md-4`, and `list-group` markup. Three groups appear side by side from 768px; below that they stack. Links underline on hover without moving; keyboard focus remains visible. Standard links require no JavaScript.

Each component's `aria-labelledby` must match its own heading ID. For the supplied markup, use `aria-labelledby="essential-resources-and-websites"`; each group must likewise reference its own heading. Use unique IDs for all headings and their corresponding references when there are multiple components on a page. Link text and destinations remain CMS-managed.

After changes, run `npm run build`, publish the generated stylesheet, and refresh its Matrix cache reference.

The local homepage capture includes the component and its stylesheet reference, but `SecureNT.html` is Git-ignored; apply the markup and reference separately in Matrix. A build recreates JSON outputs in `dist/` from project inputs and the Cloudflare build plugin, even if those outputs have been removed from the working tree.

## Shared Theme Overrides

[src/css/components/main.css](src/css/components/main.css) owns the shared breadcrumb, side-navigation and editorial colour overrides compiled into `dist/theme.css`:

- Native `select` and `.form-select` controls use the shared outlined 16px chevron, positioned 16px from the right edge, with the native arrow hidden and 48px of right padding. The rule applies site-wide; specialized select styles should preserve the chevron and leave room for its label text.
- `.ntg-callout__content` uses an 8px left border site-wide, with its existing color and remaining border unchanged.
- Breadcrumbs under `.ntg-breadcrumbs` use Lato 14px/400 with a 20px line height, 8px spacing, underlined `#174C4E` links, and current-page text in `var(--clr-text-default)`. Right chevrons use the existing Font Awesome 6 Pro font in 12px slots and `var(--clr-text-emphasis, #C33826)`. Trails wrap with automatic height. The landing-hero stylesheet retains positioning only; it shares these visual rules with standard pages.
- `.ntg-sidenav` title and item links use `#174C4E`; active-item text uses `var(--clr-text-default)`. Existing indicators and the active left border use `var(--clr-text-emphasis, #C33826)`. Typography, indentation and active-state structure are preserved. Breadcrumb and side-nav links have visible teal keyboard-focus outlines.
- Ordinary editorial links under `main#content` use `var(--clr-text-default)`, including visited and interactive states, without changing their underline or focus treatment. Navigation, pagination, sharing controls, buttons, hero CTAs, cards, feedback and status-alert components retain their own styling and contrast requirements.
- Editorial unordered-list bullets use `#343741`, including nested lists. The theme covers both the legacy `::before` icon bullets and native `::marker` bullets without changing list text or ordered-list numbering. Navigation and specialised components are excluded.

Keep the CMS list/link markup and destinations unchanged; these are CSS overrides, not replacement templates. Do not replace the scoped rules with a global anchor or list-item colour rule. The current-page breadcrumb override deliberately beats the legacy stylesheet's `!important` colour.

After changes, run `npm run build`, commit the rebuilt `dist/theme.css`, and refresh local and Matrix stylesheet cache references. Ignored homepage/content captures can be updated locally but should not be force-added to Git.

Validate ordinary and hero breadcrumbs, side-nav title/active/nested links, editorial links, and nested bullets at desktop and mobile widths (1440px, 375px and 320px). Check hover, keyboard focus, wrapping, unchanged navigation/status colours, and a normal reload. The current changes were checked with headless Chrome against four saved captures and local legacy plus compiled CSS. Full integrated-browser preview and externally hosted font loading were not verified. Use a real browser for complex selector exclusions: the current happy-dom version does not reliably match ancestor selectors inside `:where()`.

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
| `alert.css`             | `.ntg-alert__text p` | Hazard alert message paragraphs retain 16px text with 16px spacing between paragraphs and no bottom margin on the final paragraph |
| `alert.css`             | `.alert-warning`, `.alert-info`, `.alert-information`, `.alert-danger`, `.alert-critical` | Global alert banners matching the Level 2–4 emergency response framework: information `#FFC72C` (yellow, `#212529` dark text ≈11.6:1 AAA), warning `#D6410A` (orange, white ≈5.0:1 AA), critical `#FC4141` (red, white ≈3.5:1 — AA large text only); 20px bold title `!important`, 16px body `!important` (forces override of PROD cascade); 24×24 close button absolutely positioned at `top: 16px; right: 16px` — dark icon on yellow, white icon on orange/red |
| `latest-update.css`    | `.ntg-callout__content` and its footer                                                   | Styles the Latest update callout with a light panel, readable text spacing, and an action/update-time footer that stacks on narrow screens |
| `buttons.css`           | `.btn.ntg-btn` (primary)                                                                  | Background changed from navy `#1f1f5f` to Charcoal `#343741`; active state also updated                                                                                                                                                                                                                                              |
| `buttons.css`           | `.btn.ntg-btn--secondary` (outline)                                                       | Text and border colour changed from navy `#1f1f5f` to Charcoal `#343741`; white background; active state also updated                                                                                                                                                                                                                |
| `buttons.css`           | `.btn.ntg-btn--secondary:hover`                                                           | Background and border colour changed to Territory orange `#D6410A` (was `#2d2d8a`)                                                                                                                                                                                                                                                   |
| `buttons.css`           | `.homepage-news .btn.ntg-btn`                                                             | Border radius removed from the "View all" button                                                                                                                                                                                                                                                                                     |
| `buttons.css`           | `.cta-button.btn.ntg-btn--primary`                                                        | Border radius removed from primary CTA links                                                                                                                                                                                                                                                                                           |
| `header-footer.css`     | Two-row header, footer, and mobile search banner                                          | `.header-top` uses charcoal `#343741`; `.header-navigation` uses `#424550`; the desktop search is expanded in the top row; the mobile search banner uses charcoal `#343741`                                                                                                                                                             |
| `header-footer.css`     | Mobile search banner background                                                           | `.mobile-banner` overridden from navy `#1f1f5f` to Charcoal `#343741`                                                                                                                                                                                                                                                                |
| `mainmenu-dropdown.css` | Main navigation styles                                                                    | Desktop navigation has content-width mega-menu panels with grouped links; mobile navigation uses a charcoal nested drawer. |
| `statistics.css`        | Statistics section                                                                        | Sand `#D9DED4` background; default text token and black icons                                                                                                                                                                                                                                                                       |
| `main.css`              | Display card icons                                                                        | Icons use `fa-solid` (FA 6); default colour `#f4551a` (orange), hover colour `#c84c01` (darker orange)                                                                                                                                                                                                                               |
| `main.css`              | Display card titles                                                                       | Title colour `#343741` (Charcoal); orange long-arrow-right (`→`) appended via `::after`, slides 4 px right on hover; title uses flexbox row layout                                                                                                                                                                                   |
| `main.css`              | `.homepage-news .text-ntg-sky-blue`                                                       | Blue utility class overridden to the default text token within the news section                                                                                                                                                                                                                                                     |
| `main.css`              | `.homepage-news .card-title`                                                              | Title colour set to Charcoal `#343741`; turns orange `#c84c01` on hover                                                                                                                                                                                                                                                              |
| `main.css`              | `.homepage-news .card`                                                                    | Border radius removed from news cards                                                                                                                                                                                                                                                                                                |
| `main.css`              | `.homepage-news .card-header`                                                             | Bottom border removed from card header                                                                                                                                                                                                                                                                                               |
| `main.css`              | `.homepage-news .card-tag`                                                                | Category label styled as a tag (white background, default text token, `#d3d3d7` border)                                                                                                                                                                                                                                              |
| `content-page.css`      | Content pages with a share panel and no in-page navigation                               | At widths of 768px and above, offsets the first content block to align with the share panel; mobile layout is unchanged                                                                                                                                                                                                              |

### CMS accordions

Shared CMS accordion styles live in `src/css/components/accordion.css` and are imported through `src/css/main.css` into `dist/theme.css`. Styles are scoped to `.ntg-accordion` and `.ntg-accordion-toggler`, leaving unrelated Bootstrap and warning accordions unchanged. Collapsed and expanded headers use a white background, a subtle `#dddee0` bottom border, and teal `#174c4e` labels and chevrons. Headers have 24px padding and gap, 16px bold Lato text with a 24px line height, and a 24px chevron control. Expanded content uses a white panel. Accordion surfaces and controls have square corners. The `.ntg-accordion-container.container-xl` wrapper fills its containing column without the default max-width or horizontal gutters, keeping the rows, panel and open/close-all controls aligned with the content.

Expanded panels (`.accordion-collapse.show .accordion-body`) have no left or right border, overriding upstream side borders without changing the collapsed state or header separator.

Keep the CMS Bootstrap collapse markup and controls intact. After changing accordion styles, run `npm run build`, increment the theme CSS query version in all local captures, and verify collapsed and expanded states, keyboard and open/close-all behavior, and content-column alignment at mobile, tablet and desktop widths.

### Header navigation

Desktop navigation wrappers and top-level links stretch through the full 56px minimum-height bar. The link list has zero flex gap: each link, including the first, has `1rem` horizontal padding per side at widths of 1200px and above, or `0.5rem` from 768px to below 1200px. The nav's responsive negative left margin matches the first link's padding, keeping its label aligned with the header content edge despite the upstream theme's default nav margin.

Both header rows use the hero's 1280px maximum content width. At 768–991px their 64px content inset matches the hero; from 992px up their 102px inset matches the desktop hero heading. The mobile header keeps its compact 16px gutter.

Emergency contacts uses white text and no underline with `!important` to withstand the production cascade. Its hover, keyboard-focus, and active states use `#424550`, and its desktop/tablet horizontal padding matches the menu. Desktop main navigation states use `#343741`. Desktop menu links retain the same bottom-border width between normal and hovered states so vertically centred text does not jump; keyboard focus outlines remain available.

On the Current warnings page, the header search sits beside Emergency contacts at 992px and above. From 768px to below 992px, the header search is replaced by the search icon; activating it reveals a fixed 296px-wide field anchored over the icon and expanding to the left without shifting the navigation. Below 768px the same icon is used with the mobile navigation and opens the banner below the navigation. Both compact layouts use the desktop field's 48px height (shrinking to fit very narrow screens); keep the banner visibility utilities and responsive CSS in sync when changing this behavior.

The header overrides upstream bottom padding with `padding-bottom: 0 !important`, removing the extra 30px grey strip between navigation and the page accent bar. Matrix renders one `.ntg-main-nav__links.cms-main-nav` tree for both desktop and mobile using the [three listing templates](src/navigation/README.md). Desktop uses content-width mega-menu panels with CMS-rendered overview links and groups, packed into three columns or two at 768–991px. Each desktop parent has one native label-and-chevron disclosure button and one keyboard stop; its destination remains available through the overview link. Mobile retains separate destination links and arrow buttons. Items without children remain ordinary links on both viewports. Overview titles use styled non-heading elements so the menu does not add heading levels to the page outline. Descriptions come directly from HTML-escaped `page-description` metadata, not JavaScript data or JSON attributes. Panels scroll when needed and close on Escape, focus leaving the menu, or an outside click. JavaScript binds existing controls, assigns accessible state and never replaces or rewrites menu anchors. The mobile drawer retains its nested accordion; without JavaScript, links remain visible in normal flow.

After changing navigation styles or scripts, run `node --test src/js/navigation.test.mjs src/js/quick-exit.test.mjs src/search/autocomplete.test.mjs` and `npm run build` so the Squiz Matrix file bridge receives the updated `dist/theme.css` and `dist/theme.js`. The navigation tests expand the documented HTML divisions, preserve literal `href` attributes and anchor identity, and exercise empty results, repeat initialization, desktop disclosure, mobile sibling resets and breakpoint cleanup. Check panel alignment, keyboard interaction, and the mobile drawer in the local preview. Matrix keyword expansion, permissions, root scoping and published-page caching still require CMS verification.

### Mobile navigation

Below 768px, every menu item with children has a destination link on the left and a separate chevron button with a minimum 44 by 44px target on the right. The left link navigates to the unchanged CMS destination and closes the drawer; it does not expand the submenu. The button expands or collapses children without navigating, exposes `aria-controls` and `aria-expanded`, and updates its accessible label and tooltip. This applies at every nesting level; leaf items remain ordinary links.

The drawer preserves its accordion behavior: opening a sibling closes the previous sibling and its descendants, and collapsing a parent resets its descendants. Menu links and chevron buttons have no separator borders, including in hover and expanded states. The charcoal `#343741` background and white text remain; hover, keyboard focus, and expanded states use `#444855`. Hover effects apply independently to each control. Focus outlines are retained for keyboard accessibility.

Top-level links use 16px left padding, level 2 links use 36px, and level 3 links use 48px. Parent rows use a flexible link column and a fixed 44px button column; long labels wrap without moving or resizing the button, and child lists span both columns. Mobile submenu selectors override inherited link padding and borders, and expanded lists explicitly override the captured `alt.css` rule that otherwise hides them.

Tab reaches the link before its chevron button; Enter and Space toggle focused buttons. The menu's Escape keydown handler closes the drawer and returns focus to the menu trigger. The captured upstream `ntgbase-components.min.js` also binds Escape keyup to Quick Exit, which opens `nt.gov.au` and redirects to Google. Preserve that safety behavior; test the menu keydown handler separately when checking focus return.

After applying the listing markup, rebuilding and updating asset versions, verify normal reloads on each migrated capture. The alerts capture is the three-level reference; older captures retain a static fallback until migrated. Check all four border widths on links, buttons, list items, and child lists in closed, expanded, and hover states; check 320px and 375px layouts for wrapped labels, and the 767px/768px transition for drawer cleanup and unchanged desktop mega-menus. Emergency contacts inside the mobile drawer must be supplied by the CMS rather than copied from the header by JavaScript; see the listing guide.

### Homepage Latest Events

Within `#latest-warnings`, warning-banner headings are 20px at every breakpoint. A direct-child Font Awesome `<i>` uses a 24px font size, line height, and box height while retaining its natural width. These source changes must ship with the rebuilt, committed `dist/theme.css`; pushing source CSS alone does not update the Matrix file bridge. Refresh the Matrix stylesheet cache reference after publishing.

The homepage Latest Events section is styled in `src/css/components/homepage-latest-events.css`, imported by `src/css/main.css`. Each card uses `data-warning-level="advice"`, `"watch_act"`, or `"emergency_warning"` to select the shared `--clr-status-advice`, `--clr-status-watch-act`, or `--clr-status-emergency-warning` accent and tag tint. When `data-warning-level` is absent or empty, `data-emergency-type="storm"`, `"flooding"`, or `"flood"` selects the default alert orange, `--clr-status-warning` (`#d6410a`). Unrecognised status or hazard values remain neutral; `data-location` does not affect colour. Tags use a 14% tint of the selected accent, except Advice tags which use solid `#FBE032`.

The homepage warning banner uses the same stylesheet but is a separate CMS asset-listing component. Its Matrix markup supplies the `event.warning-level`, `event.emergency-type`, `event.location`, `event.name`, and `event.message` metadata, plus the asset URL for **More information**. Add the warning triangle SVG with `.warning-banner__icon`, and group the two links in `.warning-banner__actions`: the filled **More information** button links to `%asset_url%`, while the outlined map button links to `%asset_metadata_event.map-button-url%`. Keep the inline SVGs decorative with `aria-hidden="true"`; the banner itself uses `role="alert"`. The map URL metadata is required for the second button. Warning levels use accessible colour pairs: Advice `#fdf4b9` / `#716309`, Watch/Act `#ffe4cc` / `#d6410a` (NTG warning orange), and Emergency `#f7e7eb` / `#a60f37`; unknown levels use neutral `#f0f0f2` / `#55545c`. Body text uses `#343741`, and banner message paragraphs remain 16px across breakpoints. All text pairings meet WCAG AA, with a minimum 4.55:1 contrast for Watch/Act text on white or white CTA text on orange. The Watch/Act accent against its tinted surface has 3.73:1 contrast, above the 3:1 requirement for non-text indicators. The CMS template markup must be updated separately. After styling changes, run `npm run build` and publish `dist/theme.css` with the source stylesheet, then refresh the Matrix cache reference.

```html
<div class="warning-banner" role="alert" data-warning-level="%asset_metadata_event.warning-level%" data-emergency-type="%asset_metadata_event.emergency-type%" data-location="%asset_metadata_event.location%">
  <svg class="warning-banner__icon" viewBox="0 0 32 32" aria-hidden="true">
    <path d="M14.2 4.8a2.1 2.1 0 0 1 3.6 0l11.1 19.3a2.1 2.1 0 0 1-1.8 3.2H4.9a2.1 2.1 0 0 1-1.8-3.2L14.2 4.8Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"></path>
    <path d="M16 11v7m0 4h.01" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
  </svg>
  <div class="warning-banner__content">
    <h3>%asset_metadata_event.name%</h3>
    %asset_metadata_event.message%
    <div class="warning-banner__actions">
      <a class="warning-banner__action warning-banner__action--primary" href="%asset_url%">
        More information
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-7 7 7-7 7"></path></svg>
      </a>
      <a class="warning-banner__action warning-banner__action--secondary" href="%asset_metadata_event.map-button-url%">
        View cyclone map
      </a>
    </div>
  </div>
</div>
```

Latest Events uses a pale-grey container capped at 1280px, 32px desktop container padding, and square cards with 24px padding, 240px minimum height, and 3px accent borders. The grid changes from three columns to two below 992px and one below 576px. Metadata can wrap, and cards expand for longer descriptions rather than clipping text. Tag text follows its warning accent, with Advice using dark yellow `#716309` for legibility. On mobile, the heading and card copy use the larger homepage type scale, event cards are separated by 32px, and “View all warnings” is hidden. The “Find out more” link keeps fixed padding while its arrow shifts 2px right on hover without vertical layout movement.

### Homepage featured content

Homepage featured-content cards use `src/css/components/homepage-featured-content.css`, imported by `src/css/main.css`. The stylesheet targets the CMS `.ntg-featured-content-small` markup and styles its visible `.card-link` as the orange CTA; card copy, destinations, and photos remain CMS-managed. The pale-teal card is inset 52px at tablet widths and 56px on desktop to align with the homepage content column. Cards use a text/image split at those sizes, while narrow layouts stack the image below the text. The `ntg-featured-content-small--image-left` modifier retains image-first ordering on desktop.

The local `SecureNT.html` capture is gitignored. For local preview, its feature-card image URLs can point to matching files in the also-gitignored `SecureNT_files/` directory; production CMS image URLs are unchanged. After changing featured-content styles, run `npm run build` and deploy the updated `dist/theme.css` with the source CSS.

### Homepage active recovery programs

The homepage Active recovery programs display cards use `src/css/components/active-recovery.css`, imported through `src/css/main.css`. The local capture uses `.active-recovery-programs`; production markup has only `.ntg-display-cards`, so its cards are selected by their descriptive `.card-text` child. This leaves the title-only More updates cards unchanged. Production cards place the title, description, and link directly in `.card-body`; keep that body as a padded flex column and the link auto-spaced to the bottom. Keep the card corners square with `border-radius: 0 !important` to override the CMS `rounded-1` utility. The section's content edges align with the featured-content card using the same 52px tablet and 56px desktop insets. Preserve the link's hover margin and padding to prevent the tallest card from resizing the section.

The card content and destinations remain CMS-managed; the gitignored `SecureNT.html` capture is for local preview only. After changing the card styles, run `npm run build` and publish `dist/theme.css` with the source CSS, then refresh its Matrix cache reference.

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

Wrap multiple banners in `.warning-grid`, which uses a single-column grid with a 16px gap. `.warning-banner__content` has `width: 100%` and can shrink beside the hazard icon. Banner links include a Font Awesome right arrow that inherits the link colour and shifts 3px on hover and keyboard focus; reduced-motion preferences disable the shift. Link and arrow colours follow the warning tag hues using accessible foreground shades: Advice `#716309`, Watch & Act `#9c3d00`, and Emergency Warning `#b0001a`. These meet the 4.5:1 normal-text contrast threshold against their tinted banner backgrounds. Unknown levels retain the teal link colour.

### Local conditions

The location label and dropdown use bold Lato at 16px, while the location button uses 14px. The label is `#174C4E`; the controls use `#267E82` on white. Controls and keyboard-focus outlines have square corners.

The local-conditions widget renders Bushfire danger rating, Air quality, and Temperature cards. Its styles live in `src/local-conditions/local-conditions.css`, imported by `src/css/main.css` into the shared `dist/theme.css` bundle. All three cards are 175px high with a `#F5F5F7` background, inset `#D3D3D7` border, and consistently placed decorative icon. Below 992px, cards stack in one column; below 576px, location controls stack at full width and cards have 32px separation. Cards remain visible when readings are unavailable and show a muted “Data not available” message; pending requests use skeleton placeholders. Source attribution and, when available, the relative timestamp share the bottom footer, with the source on the left and timestamp on the right. Both rating charts use a marker without expanding the selected segment. Loading is communicated with the busy state rather than a loading message.

On the homepage, Local conditions forms a separate lower panel immediately after Latest events within the current-conditions frame. A full-width top border separates the sections, with 40px spacing on either side of the divider and content aligned to the frame's responsive gutters.

The Bushfire danger rating chart has four equal bands: Moderate, High, Extreme, and Catastrophic. “No Rating” places the marker at the left edge. The rating label uses muted 16px bold Lato with a 24px line height. Air quality shows the station-level AQI value and status beside a five-band chart: 0–50 Good, 51–100 Fair, 101–150 Poor, 151–300 Very poor, and 301+ Extremely poor. Both color bands are 25px high and begin 64px from the card top. The AQI chart marker uses a capped 0–700 scale. Temperature readings use muted 40px bold Lato with 44px line height and 16×16px caret icons; each caret, number and Celsius unit stay together without line breaks. When both readings do not fit side by side, the maximum wraps above the minimum.

The location list, coordinates, and running observed minimum and maximum temperatures come from the BOM Northern Territory observations XML. Temperatures are rounded to whole degrees for display. Local development uses the checked-in `public/IDD60920.xml` snapshot, so its values are not live; refresh it from `https://www.bom.gov.au/fwo/IDD60920.xml` when needed. Production requests the same-origin Matrix asset `./?a=1657184`. Its `amoc > issue-time-local` timestamp (falling back to `issue-time-utc`) supplies the BOM update time; when unavailable, the card displays “Today.” Missing readings do not remove cards. Run `node --test src/local-conditions/local-conditions.test.mjs` for Local Conditions tests, and `npm run build` to update `dist/local-conditions.js` and `dist/theme.css` and copy public fixtures into `dist/` for deployment.

Air quality displays the NT EPA station-level `IndexValue`, not a pollutant concentration. The displayed category is selected from the five index bands documented above. The chart uses the corresponding five AQI colors and does not use the feed's category or color fields for display. Localhost proxies `https://api.brainiumlabs.com.au/ntepa/stationindex.json`: `/api/air-quality` returns the station catalog, and `/api/air-quality?id=<id>` returns the matching index. The JSON feed's `d` array identifies stations by `serialCode`: 1 (Palmerston), 2 (Winnellie), 3 (Stokes Hill), and 4 (Katherine). Darwin Airport uses Winnellie, and Darwin Harbour uses Stokes Hill. BOM Tindal and Knuckey Lagoon are displayed as **Katherine (Tindall)** and **Palmerston (Knuckey Lagoon)** and use EPA stations 4 and 1 respectively. Missing EPA locations are added to the dropdown in both environments; existing locations match first by EPA station ID, then by name, and retain their BOM keys, coordinates, and temperatures. EPA-only entries use stable `epa-<id>` keys and have no invented coordinates; their Temperature card shows “Data not available” when BOM readings are unavailable. Saved EPA keys restore to the corresponding BOM station after merging, including `epa-1` and `epa-4`; legacy town selections remain supported. Missing or negative sentinel indices show an unavailable AQI card; zero is a valid index.

Relative timestamps appear at the bottom right of the card with a light clock icon, opposite the source attribution: date-only values from the current Darwin date and timestamps less than a minute old show “Today”; other values show elapsed minutes, hours, or days. Times retain a machine-readable `time` element. For AQI, use the latest valid pollutant `Date` whose `IndexValue` matches the station AQI; do not include the EPA station name or substitute the fetch time when no timestamp exists. Fire timestamps come from the warning's issue time. Source attributions remain on the card's muted bottom line; unavailable readings use the “Data not available” message instead.

Production requests `./?a=1657186`, which returns the same JSON feed with a Matrix cache expiry of 900 seconds. No station query parameter or cache-busting parameter is added; the widget selects the station from the response by `serialCode`. Catalog failures leave the original BOM dropdown usable. Air quality loads independently of fire danger; either request failing does not erase successful readings from the other source or BOM temperatures. In production, the widget fetches fire-danger JSON directly from the same-origin integration at `https://cmsexternal.nt.gov.au/securent/_design/integrations/fire-danger-ratings`, so it does not depend on a worker URL in CMS markup. The `fireAreaLocations` mapping in `src/local-conditions/local-conditions.js` assigns forecast areas to BOM stations beyond the original town aliases. Examples include Darwin and Palmerston (`NT_FW001`), Alice Springs (`NT_FW014`), Katherine (`NT_FW007`), Tennant Creek (`NT_FW012`), Gove (`NT_FW006`), Bulman (`NT_FW008`), Borroloola (`NT_FW009`), and Yulara/Curtin Springs (`NT_FW017`). Unmapped stations show unavailable fire ratings rather than borrowing another area's rating. The selected severity is displayed from No Rating (level 0) through Catastrophic (level 4).

The Vite localhost `/api/local-conditions?location=<area-code>` endpoint reads `public/fire-danger-ratings.json`. Both this endpoint and the standalone worker accept `NT_FW001` through `NT_FW020`, as well as the existing town aliases in `src/local-conditions/fire-danger.mjs`. Area-code worker requests return fire danger only, with null temperature and air quality; legacy town requests retain their existing behavior. The browser continues to obtain temperatures and AQI independently from the BOM and EPA feeds.

The BOM and EPA catalogs load concurrently with independent 30-second browser timeouts, including response body reading. Each usable catalog populates the dropdown immediately without waiting for the other request. Later arrivals merge locations and update available temperatures while preserving the user's chosen location and existing readings when its service mappings are unchanged. A saved location that arrives later is restored only if the user has not already chosen a location. A failed, invalid or empty BOM feed does not prevent EPA locations and AQI from loading; the Temperature card remains and reports unavailable data for EPA-only locations. If neither catalog provides usable locations after both requests finish or time out, the controls remain disabled and the status reports that locations are unavailable. Late timed-out responses cannot replace the catalog.

#### Matrix Feed Setup and Verification

Asset `1657184` must return raw BOM XML with a `product` root and `observations > station` entries; asset `1657186` must return raw EPA JSON with a `d` array. Remove or override inherited site designs and paint layouts on integration endpoints so they do not wrap feeds in SecureNT HTML. Use an XML content type for BOM and `application/json` for EPA only after the response bodies are correct. Forwarding upstream headers alone does not remove HTML wrappers. Follow the normal publishing workflow and verify read permissions for the intended audience.

An integration's successful HTTP test confirms upstream access, not its frontend output. On the homepage, inspect the actual requests for `./?a=1657184` and `./?a=1657186`, including redirects, status, content type and response body. A raw `/_nocache` integration response does not establish that the widget's asset-ID URL serves the same payload. HTML login/error pages and site-wrapped feeds remain invalid even with HTTP 200. Do not change the widget to parse HTML as a fallback.

Load `dist/local-conditions.js` after the widget markup with `type="module"`, and load the shared `dist/theme.css`. Remove empty or query-only stylesheet references such as `href="?h=..."`, which request the current HTML page as CSS. Publish source and rebuilt artifacts together through the Git bridge and refresh its asset references. `/api/local-conditions` is a localhost development route, not a CMS deployment endpoint; the production widget reads fire danger from the same-origin CMS integration directly.

Before release, run `node --test src/local-conditions/local-conditions.test.mjs` and `npm run build`. Check successful feeds, BOM failure with EPA fallback, EPA failure with BOM fallback, both catalogs unavailable, and delayed catalog responses in both arrival orders. Confirm the first usable catalog enables the dropdown before the other finishes, late arrivals preserve explicit user choices, and matching EPA locations gain BOM temperatures without duplicate options. Verify the renamed Katherine and Palmerston options, restoration of saved EPA selections, and fire-area requests for stations outside the original towns, including Yulara's `NT_FW017` rating. Check nearest-station selection, silent Darwin Airport fallback for denied or timed-out geolocation, the unavailable message when Darwin Airport is missing, and manual selection during a pending request. Confirm saved selection, in-card source attribution and clock rows, AQI bands and markers, temperature wrapping, the section divider, and control availability in desktop and mobile previews.

Verify the ordinary published production homepage as well as any `/_nocache` diagnostic route: their rendering and cache behavior can differ. The 30-second browser catalog timeout does not change Matrix's upstream request timeout or its 900-second feed cache; configure those separately in the integration asset Details screen.

Each location option exposes its latitude and longitude as `data-coordinates="latitude,longitude"`; an empty value means the station has no valid coordinates and is excluded from geolocation matching. Use location selects the nearest available station by great-circle distance. If location access is blocked or unavailable, the request fails or times out, or no station has usable coordinates, it selects Darwin Airport when available without displaying an error message. If Darwin Airport is absent, the widget reports that it is unavailable and preserves the current selection. Manual selection during a pending request takes precedence.

Use location is disabled when neither a geolocation match nor the Darwin Airport fallback is available; the dropdown remains usable for EPA-only locations.

Each card has a source link beneath it: Bushfires NT links to the NT incident map, NTEPA links to its homepage, and the temperature card links to BOM's Northern Territory observations. Production fire-danger data comes directly from the same-origin CMS fire-danger ratings integration; the incident-map link is an attribution link, not the data endpoint. Air-quality data comes from NTEPA, and failed or unsupported requests do not prevent BOM temperatures from displaying.

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

### Back-to-top control (`src/js/back-to-top.mjs`)

The shared theme adds a fixed, circular Charcoal (`--clr-text-default`)
button with an accessible **Back to top** label and a chevron-up icon. It
appears after the page is scrolled more than 500px and returns to the top with
smooth scrolling unless the visitor prefers reduced motion. Its styles are
imported by `src/css/main.css`; publish the rebuilt `dist/theme.js` and
`dist/theme.css` together and refresh their CMS cache references.

## Deployment

The `deploy-to-dev.prompt.md` prompt targets `origin/dev`. Ensure the local
`dev` branch is based on the intended release branch before committing and
pushing; do not force-push. A Git push does not update CMS markup, published
file-bridge assets, or cache references automatically.

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

### Default text

Use the shared `--clr-text-default` custom property for dark text and headings. It is defined in `src/css/tokens.css` as `#343741`, imported by the main theme and standalone stylesheet entries, and also overrides the captured vendor stylesheet's body text color. Keep intentional semantic and brand colors separate.
