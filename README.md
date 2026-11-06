# securent

Source and build tooling for the **SecureNT** NT Government site (`https://cmsexternal.nt.gov.au/securent`).

## Project structure

```
securent/
├── src/
│   ├── alerts-listing/
│   │   ├── alerts-listing.js          # Alert rendering, search, filters, and pagination
│   │   ├── alerts-listing.css         # Alerts page listing styles
│   │   └── alerts-listing.local.json  # Local development fixture
│   ├── hero-banners/
│   │   ├── homepage-hero.css         # Purple-light homepage variant and homepage conditions overlap
│   │   ├── landing-hero.css          # Alt landing variant, breadcrumbs and optional CTA
│   │   └── hero-banners.js           # Landing-only breadcrumb relocation and optional CTA enhancement
│   ├── css/
│   │   ├── main.css                  # CSS entry point — add @imports here
│   │   └── components/
│   │       ├── alert.css             # Global alert banner styles: information (#FFC72C yellow, dark text AAA), warning (#D6410A orange, white AA), critical (#FC4141 red, white AA large text only); 24×24 close button anchored top-right
│   │       ├── buttons.css           # Button overrides: primary bg Charcoal (#343741), secondary outline Charcoal + white bg, hover Territory orange (#D6410A)
│   │       ├── mainmenu-dropdown.css # Navigation dropdown styles; charcoal hover/active states, responsive link padding, zero desktop link gap
│   │       ├── header-footer.css     # Header/footer brand colour overrides; background: Charcoal (#343741)
│   │       ├── homepage-featured-content.css # CMS homepage feature cards: responsive image/text layout and CTA styling
│   │       ├── statistics.css        # Statistics section styles
│   │       └── main.css              # General page overrides: display-card icon colours, card-title colour + animated arrow; homepage-news section styles
│   └── js/
│       ├── main.js                   # JS entry point — click-to-open dropdowns, hamburger toggle
│       ├── homepage-news.js          # Runtime JS for homepage news cards (tag transformation)
│       └── display-cards.js          # Runtime JS — swaps FA 5 `fal` icons to FA 6 `fa-solid` in display cards
├── dist/                             # Committed build output for the Squiz Matrix file bridge
│   ├── alerts-listing.css
│   ├── alerts-listing.js
│   ├── print.css
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

The homepage capture (`SecureNT.html`) and shared `SecureNT_files/` assets are excluded from Git. The event capture uses those shared local assets, hazard icons from `assets/hazard-icons/`, the built theme in `dist/theme.css`, and event-specific styles from `src/events/event.css`; it no longer has a separate asset folder. Both captures use the same two-row header: `.header-top` holds the logo, emergency contacts, and desktop search, while `.header-navigation` holds the primary navigation. The separate mobile search banner remains below the header. `vite.config.mjs` includes `SecureNT.html` as the build HTML entry when that optional capture exists; the event preview does not change production build inputs. The `dist/` files are tracked because they are consumed by the Squiz Matrix file bridge.

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
The homepage links `src/css/main.css` and loads `src/js/main.js` directly for in-memory CSS imports and HMR. The event capture uses the built theme at `dist/theme.css` and links its page-specific styles from `src/events/event.css`.

The Alerts and warnings capture loads its standalone listing scripts and styles from `dist/alerts-listing.js` and `dist/alerts-listing.css`, alongside `dist/theme.css` and the source theme entry points `src/css/main.css` and `src/js/main.js` for local preview. On localhost, the listing fetches `src/alerts-listing/alerts-listing.local.json`; on the deployed CMS page, it requests the listing endpoint configured in the page markup. The capture keeps the supplied CMS content and navigation destinations, while shared dependencies use the local `SecureNT_files/` assets.

## Build

```bash
npm run build
```

Outputs to `dist/`:

- `theme.css` — compiled, minified CSS imported by `src/css/main.css`, including `src/hero-banners/` styles
- `theme.js` — compiled JS imported by `src/js/main.js`, including the landing hero initializer
- `alerts-listing.css` and `alerts-listing.js` — standalone assets for the Alerts and warnings page
- `print.css` — print stylesheet

`theme.css`, `theme.js`, `alerts-listing.css`, `alerts-listing.js`, and `print.css` are referenced in Squiz Matrix via the git file bridge.

The build excludes the captured homepage's reference to the previous `dist/theme.css` so generated styles are not imported back into the next bundle. The current source styles remain the authority.

Theme CSS enters the build through the optional, gitignored `SecureNT.html` capture. Keep that capture and its local dependencies available when rebuilding the complete theme; a successful build without it does not verify that `dist/theme.css` was generated. After building, confirm both theme assets exist before committing file-bridge updates.

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
| `mainmenu-dropdown.css` | Main nav background & behaviour                                                           | Desktop nav uses `#424550` with white links; mobile nav uses white with black text; hover, focus, active, current, and open top-level items use charcoal `#343741` with white text and no underline; link colours use `!important` to override PROD's global anchor rule; level-3 menus hidden |
| `statistics.css`        | Statistics section                                                                        | Sand `#D9DED4` background; black text and icons                                                                                                                                                                                                                                                                                      |
| `main.css`              | Display card icons                                                                        | Icons use `fa-solid` (FA 6); default colour `#f4551a` (orange), hover colour `#c84c01` (darker orange)                                                                                                                                                                                                                               |
| `main.css`              | Display card titles                                                                       | Title colour `#343741` (Charcoal); orange long-arrow-right (`→`) appended via `::after`, slides 4 px right on hover; title uses flexbox row layout                                                                                                                                                                                   |
| `main.css`              | `.homepage-news .text-ntg-sky-blue`                                                       | Blue utility class overridden to black (`#000`) within the news section                                                                                                                                                                                                                                                              |
| `main.css`              | `.homepage-news .card-title`                                                              | Title colour set to Charcoal `#343741`; turns orange `#c84c01` on hover                                                                                                                                                                                                                                                              |
| `main.css`              | `.homepage-news .card`                                                                    | Border radius removed from news cards                                                                                                                                                                                                                                                                                                |
| `main.css`              | `.homepage-news .card-header`                                                             | Bottom border removed from card header                                                                                                                                                                                                                                                                                               |
| `main.css`              | `.homepage-news .card-tag`                                                                | Category label styled as a tag (design system default variant: white bg, `#1f1e27` text, `#d3d3d7` border)                                                                                                                                                                                                                           |

### Header navigation

Desktop navigation wrappers and top-level links stretch through the full 56px minimum-height bar. The link list has zero flex gap: each link, including the first, has `1rem` horizontal padding per side at widths of 1200px and above, or `0.5rem` from 768px to below 1200px. The `--menu-item-padding` property on `nav.nav-masthead` controls both link padding and an equal negative nav left margin, keeping the first label aligned with the header content edge.

Both header rows use the hero's 1280px maximum content width. At 768–991px their 64px content inset matches the hero; from 992px up their 102px inset matches the desktop hero heading. The mobile header keeps its compact 16px gutter.

Emergency contacts uses white text and no underline with `!important` to withstand the production cascade. Its hover, keyboard-focus, and active states use `#424550`, and its desktop/tablet horizontal padding matches the menu. Main navigation states use `#343741`. Menu links retain the same bottom-border width between normal and hovered states so vertically centred text does not jump; keyboard focus outlines remain available.

The header overrides upstream bottom padding with `padding-bottom: 0 !important`, removing the extra 30px grey strip between navigation and the page accent bar. Desktop dropdown panels retain a thin neutral border instead of an orange left accent. Dropdown links fill the entire item width and height, including their padding; hover, focus, and active/current states use `#444855` with white text. These dropdown state colours are separate from the top-level navigation colours.

After changing header styles, run `npm run build` and commit `dist/theme.css` alongside the source CSS so the Squiz Matrix file bridge receives the updates. Check desktop and tablet padding, first-label alignment, full-height highlights, and unchanged text bounds on hover in the local preview. The captured page's external links can navigate to the CMS rather than demonstrate dropdown toggling; test `.open` styling separately when that happens.

### Homepage Latest Events

The homepage Latest Events section is styled in `src/css/components/homepage-latest-events.css`, imported by `src/css/main.css`. Each card uses `data-warning-level="advice"`, `"watch_act"`, or `"emergency_warning"` to select the shared `--clr-status-advice`, `--clr-status-watch-act`, or `--clr-status-emergency-warning` accent and tag tint. When `data-warning-level` is absent or empty, `data-emergency-type="storm"`, `"flooding"`, or `"flood"` selects the default alert orange, `--clr-status-warning` (`#d6410a`). Unrecognised status or hazard values remain neutral; `data-location` does not affect colour. Tags use a 14% tint of the selected accent, except Advice tags which use solid `#FBE032`.

Latest Events uses a pale-grey container capped at 1280px, 32px desktop container padding, and square cards with 24px padding, 240px minimum height, and 3px accent borders. The grid changes from three columns to two below 992px and one below 576px. Metadata can wrap, and cards expand for longer descriptions rather than clipping text. Tag text follows its warning accent, with Advice using dark yellow `#716309` for legibility. The “View all warnings” and “Find out more” links keep fixed padding while their arrows shift 2px right on hover without vertical layout movement.

### Homepage featured content

Homepage featured-content cards use `src/css/components/homepage-featured-content.css`, imported by `src/css/main.css`. The stylesheet targets the CMS `.ntg-featured-content-small` markup and styles its visible `.card-link` as the orange CTA; card copy, destinations, and photos remain CMS-managed. The pale-teal card is inset 52px at tablet widths and 56px on desktop to align with the homepage content column. Cards use a text/image split at those sizes, while narrow layouts stack the image below the text. The `ntg-featured-content-small--image-left` modifier retains image-first ordering on desktop.

The local `SecureNT.html` capture is gitignored. For local preview, its feature-card image URLs can point to matching files in the also-gitignored `SecureNT_files/` directory; production CMS image URLs are unchanged. After changing featured-content styles, run `npm run build` and deploy the updated `dist/theme.css` with the source CSS.

### Hero banners

Hero CSS and JavaScript are isolated in `src/hero-banners/`. Both stylesheets are imported by `src/css/main.css`; `hero-banners.js` is imported by `src/js/main.js`. They ship in the existing `dist/theme.css` and `dist/theme.js` bundles, with no separate CMS asset includes.

`homepage-hero.css` targets `.hero-banner.intro-section.bg-ntg-background-purple-light`; retain the CMS `bg-ntg-background-home` class. It preserves the charcoal background, white 42px desktop heading, 14px copy and orange Incident map action. The overlapping `#current-conditions` panel is scoped to `main.ntg-body--homepage`: 49px desktop overlap, 34px tablet and 24px below 576px. The gitignored homepage capture now uses the supplied purple-light classes; any corresponding CMS template correction must be made separately.

`landing-hero.css` targets `.hero-banner.intro-section.bg-ntg-background-alt`. It uses a pale-grey `#E7E7EA` background, dark text, 40px/44px desktop heading, 18px/20px copy and a 604px maximum content column. Below 576px the heading is 32px/36px. Content stays in document flow, wraps and grows without a fixed hero height. Breadcrumbs and an optional orange CTA receive their own scoped styles and keyboard focus outlines.

The landing initializer moves the existing preceding CMS `.breadcrumb-container` into the hero, preserving its navigation and links. It also supports a breadcrumb already inside the hero, and can hide an immediately preceding title-only container only when its H1 exactly matches the hero H1. If the copy contains an `.intro-text-link`, it is moved below the copy and receives one decorative Font Awesome external-link icon. Initialization is repeat-safe; absent breadcrumbs, absent CTAs and unrelated content are left alone. No new link or copy is generated, and homepage heroes are not mutated.

The Alerts and warnings capture uses the supplied PROD structure with the updated incident-map copy and Incident map CTA: one hero heading and an external breadcrumb before enhancement. Its captured alerts are replaced by the existing localhost listing fixture at runtime. Local assets and source entry points remain wired for preview. Without JavaScript, the breadcrumb stays outside the hero and the CTA remains in its original copy; all text and links remain available.

After changing hero sources, run `npm run build` and deploy the updated theme CSS and JS with their source files. Check both variants at mobile, tablet and desktop widths, including breadcrumb placement, wrapping and unchanged homepage overlap.

### More updates

The Alerts and warnings capture uses the PROD `.ntg-display-cards` markup inside `#more_updates_1657034`. It contains six title-only cards: SecureNT, Bushfire NT, Power and water, Road report NT, BOM and NT Fire services. Each card uses an H3 title and a stretched link with a visually hidden `Go to ...` label. The supplied markup has no separate section heading or briefcase icons.

Bootstrap's `row-cols-1 row-cols-md-2 row-cols-lg-3 g-3` classes produce one column on mobile, two from 768px and three from 992px. Existing display-card rules in `src/css/components/main.css` provide the charcoal titles and orange arrow; no additional stylesheet or script is required. Preserve CMS-managed link destinations when refreshing the capture, and verify all six labels, responsive columns and text wrapping in the local preview.

The latest warning banner uses `.warning-banner` markup with `role="alert"`, `data-warning-level`, `data-emergency-type`, and `data-location`. Set `data-warning-level` to `advice`, `watch_act`, or `emergency_warning`; it controls the banner's accent border and subtle background tint through the shared status colour tokens. Use an icon image matching both the hazard and warning level, with a 24px height. Unknown or missing levels use a neutral accent. The local `SecureNT.html` capture is ignored by Git; production warning markup is managed in the CMS and must be updated there separately. After changing warning styles, run `npm run build` and deploy `dist/theme.css` with the source CSS.

### Local conditions

The local-conditions widget renders three cards for fire danger, air quality, and temperature. If a request fails or an individual value is unavailable, the cards remain visible and show `Data is currently unavailable. Try again later.` in place of the unavailable data. The page-level status remains available for loading and location messages.

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
