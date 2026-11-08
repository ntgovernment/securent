# securent

Source and build tooling for the **SecureNT** NT Government site (`https://cmsexternal.nt.gov.au/securent`).

## Project structure

```
securent/
├── src/
│   ├── alerts-listing/
│   │   ├── alerts-listing.js          # Alert rendering, responsive filters, sorting, and pagination
│   │   ├── alerts-listing.css         # Alerts page listing styles
│   │   ├── alerts-pagination.css      # Standalone pagination styles and list marker reset
│   │   ├── more-updates-cards.css     # Alerts page bottom-card styles
│   │   ├── sorting.mjs               # Stable alert sorting and CMS timestamp parsing
│   │   ├── sorting.test.mjs          # Built-in Node sorting regression tests
│   │   └── alerts-listing.local.json  # Local development fixture
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
│   │       ├── mainmenu-dropdown.css # Content-width desktop mega-menu and mobile drawer styles
│   │       ├── header-footer.css     # Header/footer brand colour overrides; background: Charcoal (#343741)
│   │       ├── homepage-featured-content.css # CMS homepage feature cards: responsive image/text layout and CTA styling
│   │       ├── statistics.css        # Statistics section styles
│   │       └── main.css              # General page overrides: display-card icon colours, card-title colour + animated arrow; homepage-news section styles
│   ├── data/
│   │   └── navigation.js             # Shared navigation labels, destinations, and optional descriptions
│   └── js/
│       ├── main.js                   # JS entry point — desktop mega-menu and mobile drawer
│       ├── homepage-news.js          # Runtime JS for homepage news cards (tag transformation)
│       └── display-cards.js          # Runtime JS — swaps FA 5 `fal` icons to FA 6 `fa-solid` in display cards
├── dist/                             # Committed build output for the Squiz Matrix file bridge
│   ├── alerts-listing.css
│   ├── alerts-listing.js
│   ├── alerts-pagination.css
│   ├── more-updates-cards.css
│   ├── event.css
│   ├── print.css
│   ├── social-share.css
│   ├── social-share.js
│   ├── local-conditions.js
│   ├── theme.css
│   └── theme.js
├── assets/hazard-icons/              # Shared hazard alert pictograms
├── SecureNT.html                     # Local page capture (gitignored)
├── SecureNT_files/                   # Local page assets (gitignored)
├── alerts-and-warnings.html          # Alerts and warnings page capture
├── Severe Storm – Alice Springs _ SecureNT.html   # Secondary development event capture
├── vite.config.mjs
└── package.json
```

The homepage capture (`SecureNT.html`) and shared `SecureNT_files/` assets are excluded from Git. All local HTML captures reference built assets from `dist/`, not source files from `src/`. The event capture uses the shared local assets, hazard icons from `assets/hazard-icons/`, and the standalone `dist/event.css`, `dist/social-share.css`, and `dist/social-share.js` assets; it no longer has a separate asset folder. On desktop, the share panel aligns with the first content section after the event H1. Both captures use the same two-row header: `.header-top` holds the logo, emergency contacts, and desktop search, while `.header-navigation` holds the primary navigation. The separate mobile search banner remains below the header. `vite.config.mjs` includes `SecureNT.html` as the build HTML entry when that optional capture exists; its production HTML transform removes references to the two local WEBP photos so they are not emitted in `dist/`, while development preview retains them. The event preview does not change production build inputs. The `dist/` files are tracked because they are consumed by the Squiz Matrix file bridge.

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

Vite starts a local dev server and opens `/`, serving the Alerts and warnings capture in `alerts-and-warnings.html`. The homepage capture remains available at `/SecureNT.html`, and the event capture remains available at `/Severe%20Storm%20%E2%80%93%20Alice%20Springs%20_%20SecureNT.html`. The development middleware in `vite.config.mjs` serves the Alerts and warnings and event captures through Vite's HTML transforms and serves saved `.js.download` dependencies as JavaScript. External navigation links still point to the CMS, and externally hosted fonts and favicons require network access. These captures are development snapshots, not live emergency feeds.
The HTML captures link stylesheets and scripts from `dist/`. Run `npm run build` after source changes so the updated assets are available for local preview.

Existing Vite servers and browser tabs can cache built assets even after rebuilding. When changing the theme, increment the `?v=` values on the `dist/theme.css` and `dist/theme.js` references in all three local captures, including the gitignored homepage, then verify a normal reload without temporary test URLs. The current versions are CSS `35` and JavaScript `25`; the homepage's standalone `dist/local-conditions.js` reference is version `3`. Update equivalent CMS asset references separately when deploying.

To select a different port on Windows without npm dropping the forwarded flags, launch Vite directly:

```powershell
node node_modules/vite/bin/vite.js --port 5175 --strictPort
```

The Alerts and warnings capture loads its listing script and standalone listing, pagination, and bottom-card styles from `dist/alerts-listing.js`, `dist/alerts-listing.css`, `dist/alerts-pagination.css`, and `dist/more-updates-cards.css`, alongside `dist/theme.css` and `dist/theme.js`. On localhost, the listing fetches `src/alerts-listing/alerts-listing.local.json`; level, region, and topic facets are rendered as combined filters. On the deployed CMS page, it requests the listing endpoint configured in the page markup. The capture keeps the supplied CMS content and navigation destinations, while shared dependencies use the local `SecureNT_files/` assets.

Below 768px, an initially collapsed **Filter and sort** disclosure appears between search and results. It expands the existing controls inline; desktop keeps the sidebar expanded. Checkbox selections, sort choice, and mobile expansion preference survive breakpoint changes. The native button exposes its expanded state and hides collapsed controls from keyboard navigation. Without JavaScript, the captured filters remain visible.

The Level filter uses severity order: Emergency warning, Watch and act, Advice, then Decreasing threat, with unknown levels last. This order applies whether levels come from feed facets or are derived from alert items; counts and selected values are unchanged. The local capture uses the same order without JavaScript. CMS wrappers matching `section.alerts-page` receive `margin-top: -1.5em`; this rule does not target the capture's `body.alerts-page`.

The shared **Sort by** dropdown offers Current order (the default feed order), Warning level, Newest updated, Location A-Z, and Title A-Z. Sorting applies to combined search/filter matches before pagination; changing sort resets to page 1. Equal values retain feed order. Warning levels sort Emergency warning, Watch and act, Advice, then Decreasing threat, with unknown levels last. Empty locations and invalid or missing update dates sort last. Timezone-less CMS `updatedAt` timestamps are interpreted as Northern Territory time (UTC+09:30); ISO timestamps with explicit offsets retain their offsets. Confirm this timezone assumption against the production endpoint before rollout.

The controls enhance existing `.alerts-listing__filters` markup automatically, so no extra CMS control markup is needed. Rebuild and refresh the listing CSS/JS asset versions in both the local capture and CMS references after changes. The local listing references currently use CSS version `13` and JavaScript version `7`. Run focused sorting regressions with `node --test src/alerts-listing/sorting.test.mjs`.

## Build

```bash
npm run build
```

Outputs to `dist/`:

- `theme.css` — compiled, minified CSS imported by `src/css/main.css`, including `src/hero-banners/` styles
- `theme.js` — compiled JS imported by `src/js/main.js`, including the landing hero initializer
- `alerts-listing.css` and `alerts-listing.js` — standalone assets for the Alerts and warnings page
- `alerts-pagination.css` — standalone pagination styling and list-marker overrides
- `more-updates-cards.css` — styles for the bottom update cards on the Alerts and warnings page
- `event.css` and `social-share.css` — standalone event page and share nester styles
- `social-share.js` — standalone event share popup and copy-link behavior
- `local-conditions.js` — standalone location catalog and condition-card behavior; its CSS is included in `theme.css`
- `print.css` — print stylesheet

`theme.css`, `theme.js`, `alerts-listing.css`, `alerts-listing.js`, `alerts-pagination.css`, `more-updates-cards.css`, `event.css`, `social-share.css`, `social-share.js`, `local-conditions.js`, and `print.css` are referenced in Squiz Matrix via the git file bridge. Reference `dist/social-share.css` from the Squiz share nester after the global theme; it remains a standalone asset rather than part of `dist/theme.css`.

The build excludes the captured homepage's reference to the previous `dist/theme.css` so generated styles are not imported back into the next bundle. The current source styles remain the authority.

Theme CSS has an explicit `theme-styles` entry pointing to `src/css/main.css` in `vite.config.mjs`; the optional, gitignored homepage capture is not required to generate the theme bundle. Keep that capture and its local dependencies available when building or previewing the captured homepage. After building, confirm both theme assets exist before committing file-bridge updates.

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

### CMS accordions

Shared CMS accordion styles live in `src/css/components/accordion.css` and are imported through `src/css/main.css` into `dist/theme.css`. Styles are scoped to `.ntg-accordion` and `.ntg-accordion-toggler`, leaving unrelated Bootstrap accordions unchanged. Headers use grey collapsed and expanded states with teal labels and chevrons; expanded content uses a white panel. Accordion surfaces and controls have square corners. The `.ntg-accordion-container.container-xl` wrapper fills its containing column without the default max-width or horizontal gutters, keeping the rows, panel and open/close-all controls aligned with the content.

Keep the CMS Bootstrap collapse markup and controls intact. After changing accordion styles, run `npm run build`, increment the theme CSS query version in all local captures, and verify collapsed and expanded states, keyboard and open/close-all behavior, and content-column alignment at mobile, tablet and desktop widths.

### Header navigation

Desktop navigation wrappers and top-level links stretch through the full 56px minimum-height bar. The link list has zero flex gap: each link, including the first, has `1rem` horizontal padding per side at widths of 1200px and above, or `0.5rem` from 768px to below 1200px. The nav's responsive negative left margin matches the first link's padding, keeping its label aligned with the header content edge despite the upstream theme's default nav margin.

Both header rows use the hero's 1280px maximum content width. At 768–991px their 64px content inset matches the hero; from 992px up their 102px inset matches the desktop hero heading. The mobile header keeps its compact 16px gutter.

Emergency contacts uses white text and no underline with `!important` to withstand the production cascade. Its hover, keyboard-focus, and active states use `#424550`, and its desktop/tablet horizontal padding matches the menu. Desktop main navigation states use `#343741`. Desktop menu links retain the same bottom-border width between normal and hovered states so vertically centred text does not jump; keyboard focus outlines remain available.

The header overrides upstream bottom padding with `padding-bottom: 0 !important`, removing the extra 30px grey strip between navigation and the page accent bar. Desktop navigation uses content-width mega-menu panels with section overview links and grouped child links from `src/data/navigation.js`. Groups are packed into three columns on desktop and two at 768–991px, with headings and child links kept together where possible. Overview descriptions use the navigation data when provided, otherwise optional `data-description` attributes on the original top-level menu item or its link. Panels scroll when needed and close on Escape, focus leaving the menu, or an outside click. The mobile drawer retains its nested accordion.

After changing navigation styles or scripts, run `npm run build` so the Squiz Matrix file bridge receives the updated `dist/theme.css` and `dist/theme.js`. Check panel alignment, keyboard interaction, and the mobile drawer in the local preview.

### Mobile navigation

Below 768px, every menu item with children has a destination link on the left and a separate 40 by 40px chevron button on the right. The left link navigates to the unchanged CMS destination and closes the drawer; it does not expand the submenu. The button expands or collapses children without navigating, exposes `aria-controls` and `aria-expanded`, and updates its accessible label and tooltip. This applies at every nesting level; leaf items remain ordinary links.

The drawer preserves its accordion behavior: opening a sibling closes the previous sibling and its descendants, and collapsing a parent resets its descendants. Menu links and chevron buttons have no separator borders, including in hover and expanded states. The charcoal `#343741` background and white text remain; hover, keyboard focus, and expanded states use `#444855`. Hover effects apply independently to each control. Focus outlines are retained for keyboard accessibility.

Top-level links use 16px left padding, level 2 links use 36px, and level 3 links use 48px. Parent rows use a flexible link column and a fixed 40px button column; long labels wrap without moving or resizing the button, and child lists span both columns. Mobile submenu selectors override inherited link padding and borders, and expanded lists explicitly override the captured `alt.css` rule that otherwise hides them.

Tab reaches the link before its chevron button; Enter and Space toggle focused buttons. The menu's Escape keydown handler closes the drawer and returns focus to the menu trigger. The captured upstream `ntgbase-components.min.js` also binds Escape keyup to Quick Exit, which opens `nt.gov.au` and redirects to Google. Preserve that safety behavior; test the menu keydown handler separately when checking focus return.

After rebuilding and updating asset versions, verify normal reloads on the alerts, homepage, and event captures. Check all four border widths on links, buttons, list items, and child lists in closed, expanded, and hover states; check 320px and 375px layouts for wrapped labels, and the 767px/768px transition for drawer cleanup and unchanged desktop mega-menus.

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

The local-conditions widget renders three cards for fire danger, air quality, and temperature. Its styles live in `src/local-conditions/local-conditions.css`, imported by `src/css/main.css` into the shared `dist/theme.css` bundle. Below 576px, location controls stack at full width and condition cards use outlined panels with 32px separation. If a request fails or an individual value is unavailable, the cards remain visible and show `Data is currently unavailable. Try again later.` in place of the unavailable data. The page-level status remains available for loading and location messages.

On the homepage, Local conditions forms a separate lower panel immediately after Latest events within the current-conditions frame. A full-width top border separates the sections, with 40px spacing on either side of the divider and content aligned to the frame's responsive gutters.

Temperature readings keep each caret icon, number and Celsius unit together without line breaks. When both readings do not fit side by side, the maximum wraps above the minimum.

The location list, coordinates, and running observed minimum and maximum temperatures come from the BOM Northern Territory observations XML. Temperatures are rounded to whole degrees for display. Local development uses the checked-in `public/IDD60920.xml` snapshot, so its values are not live; refresh it from `https://www.bom.gov.au/fwo/IDD60920.xml` when needed. Production requests the same-origin Matrix asset `./?a=1657184`. The fire and air-quality service supports only matched locations; other stations show those cards as unavailable. Run `node --test src/local-conditions/local-conditions.test.mjs` for widget tests, and `npm run build` to update `dist/local-conditions.js` and `dist/theme.css` for deployment.

Air quality displays the NT EPA station-level `IndexValue`, not a pollutant concentration or an inferred category. Localhost proxies `https://api.brainiumlabs.com.au/ntepa/stationindex.json`: `/api/air-quality` returns the station catalog, and `/api/air-quality?id=<id>` returns the matching index. The JSON feed's `d` array identifies stations by `serialCode`: 1 (Palmerston), 2 (Winnellie), 3 (Stokes Hill), and 4 (Katherine). Darwin Airport uses Winnellie, and Darwin Harbour uses Stokes Hill. Missing EPA locations are added to the dropdown in both environments; existing locations match by name and retain their BOM keys, coordinates, and temperatures. EPA-only entries use stable `epa-<id>` keys, have no invented coordinates, and show temperatures as unavailable. Missing or negative sentinel indices show unavailable data, not zero.

The air-quality badge uses the station's `IndexColorStrHex` for its dot and `IndexColorDescription` for text such as Good or Fair; it does not infer a category from the numeric index. Missing or invalid colours use a neutral dot, and missing descriptions omit the badge without hiding a valid index.

When a valid AQI is available, its source line includes the EPA station name and reading date/time in `Australia/Darwin` (ACST), with a machine-readable `time` element. The feed has no station-level timestamp: use the latest valid `Date` among pollutants whose `IndexValue` matches the station AQI. Missing timestamps are omitted rather than replaced with the fetch time. Unavailable AQI keeps the plain NTEPA source link without station or time details.

Production requests `./?a=1657186`, which returns the same JSON feed with a Matrix cache expiry of 900 seconds. No station query parameter or cache-busting parameter is added; the widget selects the station from the response by `serialCode`. Catalog failures leave the original BOM dropdown usable. Air quality loads independently of the fire-danger worker; the widget ignores the worker's old air-quality payload. Either request failing does not erase successful readings from the other source or BOM temperatures. Local fire-danger values remain mocked; the production worker is unchanged.

The BOM and EPA catalogs load concurrently with independent 30-second browser timeouts, including response body reading. Each usable catalog populates the dropdown immediately without waiting for the other request. Later arrivals merge locations and update available temperatures while preserving the user's chosen location and existing readings when its service mappings are unchanged. A saved location that arrives later is restored only if the user has not already chosen a location. A failed, invalid or empty BOM feed does not prevent EPA locations and AQI from loading; temperatures remain unavailable for EPA-only locations. If neither catalog provides usable locations after both requests finish or time out, the controls remain disabled and the status reports that locations are unavailable. Late timed-out responses cannot replace the catalog.

#### Matrix Feed Setup and Verification

Asset `1657184` must return raw BOM XML with a `product` root and `observations > station` entries; asset `1657186` must return raw EPA JSON with a `d` array. Remove or override inherited site designs and paint layouts on integration endpoints so they do not wrap feeds in SecureNT HTML. Use an XML content type for BOM and `application/json` for EPA only after the response bodies are correct. Forwarding upstream headers alone does not remove HTML wrappers. Follow the normal publishing workflow and verify read permissions for the intended audience.

An integration's successful HTTP test confirms upstream access, not its frontend output. On the homepage, inspect the actual requests for `./?a=1657184` and `./?a=1657186`, including redirects, status, content type and response body. A raw `/_nocache` integration response does not establish that the widget's asset-ID URL serves the same payload. HTML login/error pages and site-wrapped feeds remain invalid even with HTTP 200. Do not change the widget to parse HTML as a fallback.

Load `dist/local-conditions.js` after the widget markup with `type="module"`, and load the shared `dist/theme.css`. Remove empty or query-only stylesheet references such as `href="?h=..."`, which request the current HTML page as CSS. Publish source and rebuilt artifacts together through the Git bridge and refresh its asset references. Keep the separately deployed fire-danger worker URL in the widget's `data-endpoint`; the `/api/local-conditions` default is a development mock route, not a CMS deployment endpoint.

Before release, run `node --test src/local-conditions/local-conditions.test.mjs` and `npm run build`. Check successful feeds, BOM failure with EPA fallback, EPA failure with BOM fallback, both catalogs unavailable, and delayed catalog responses in both arrival orders. Confirm the first usable catalog enables the dropdown before the other finishes, late arrivals preserve explicit user choices, and matching EPA locations gain BOM temperatures without duplicate options. Confirm saved selection, AQI attribution, temperature wrapping, the section divider, and coordinate-based control availability in desktop and mobile previews.

Verify the ordinary published production homepage as well as any `/_nocache` diagnostic route: their rendering and cache behavior can differ. The 30-second browser catalog timeout does not change Matrix's upstream request timeout or its 900-second feed cache; configure those separately in the integration asset Details screen.

Each location option exposes its latitude and longitude as `data-coordinates="latitude,longitude"`; an empty value means the station has no valid coordinates and is excluded from geolocation matching. Use location selects the nearest station by great-circle distance.

Use location is disabled when no available locations have valid coordinates; the dropdown remains usable for EPA-only locations.

Each card has a source link beneath it: Bushfires NT links to the NT incident map, NTEPA links to its homepage, and the temperature card links to BOM's Northern Territory observations. The current worker obtains fire-danger data from the BOM forecast API, not Bushfires NT; the incident-map link does not change that data source. Air-quality data comes from NTEPA, and failed or unsupported requests do not prevent BOM temperatures from displaying.

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
