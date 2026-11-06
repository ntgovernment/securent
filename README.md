# securent

Source and build tooling for the **SecureNT** NT Government site (`https://cmsexternal.nt.gov.au/securent`).

## Project structure

```
securent/
├── src/
│   ├── css/
│   │   ├── main.css                  # CSS entry point — add @imports here
│   │   └── components/
│   │       ├── alert.css             # Global alert banner styles: information (#FFC72C yellow, dark text AAA), warning (#D6410A orange, white AA), critical (#FC4141 red, white AA large text only); 24×24 close button anchored top-right
│   │       ├── buttons.css           # Button overrides: primary bg Charcoal (#343741), secondary outline Charcoal + white bg, hover Territory orange (#D6410A)
│   │       ├── mainmenu-dropdown.css # Navigation dropdown styles; click-to-open; white bg, bold black text, #fcccbb hover accent
│   │       ├── header-footer.css     # Header/footer brand colour overrides; background: Charcoal (#343741)
│   │       ├── statistics.css        # Statistics section styles
│   │       └── main.css              # General page overrides: display-card icon colours, card-title colour + animated arrow; homepage-news section styles
│   └── js/
│       ├── main.js                   # JS entry point — click-to-open dropdowns, hamburger toggle
│       ├── homepage-news.js          # Runtime JS for homepage news cards (tag transformation)
│       └── display-cards.js          # Runtime JS — swaps FA 5 `fal` icons to FA 6 `fa-solid` in display cards
├── dist/                             # Committed build output for the Squiz Matrix file bridge
│   ├── print.css
│   ├── theme.css
│   └── theme.js
├── assets/hazard-icons/              # Shared hazard alert pictograms
├── SecureNT.html                     # Local page capture (gitignored)
├── SecureNT_files/                   # Local page assets (gitignored)
├── Severe Storm – Alice Springs _ SecureNT.html   # Default development event capture
├── vite.config.mjs
└── package.json
```

The homepage capture (`SecureNT.html`) and shared `SecureNT_files/` assets are excluded from Git. The event capture uses those shared local assets, hazard icons from `assets/hazard-icons/`, the built theme in `dist/theme.css`, and event-specific styles from `src/events/event.css`; it no longer has a separate asset folder. `vite.config.mjs` includes `SecureNT.html` as the build HTML entry when that optional capture exists; the event preview does not change production build inputs. The `dist/` files are tracked because they are consumed by the Squiz Matrix file bridge.

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

Vite starts a local dev server and opens `/`, showing the captured **Severe Storm – Alice Springs** event page. The development middleware in `vite.config.mjs` serves the capture through Vite's HTML transforms and serves saved `.js.download` dependencies as JavaScript. External navigation links still point to the CMS, and externally hosted fonts and favicons require network access. The capture is a development snapshot, not a live emergency feed.  
The optional homepage capture remains available at `/SecureNT.html` when present.  
That homepage links `src/css/main.css` and loads `src/js/main.js` directly for in-memory CSS imports and HMR. The event capture uses the built theme at `dist/theme.css` and links its page-specific styles from `src/events/event.css`.

## Build

```bash
npm run build
```

Outputs to `dist/`:

- `theme.css` — compiled, minified CSS (all `src/css/` sources merged)
- `theme.js` — compiled JS (all `src/js/` modules merged via `src/js/main.js`)
- `print.css` — print stylesheet

`theme.css`, `theme.js`, and `print.css` are referenced in Squiz Matrix via the git file bridge.

## Adding new CSS component files

1. Create a new file in `src/css/components/`, e.g. `src/css/components/hero-banner.css`
2. Add an `@import` line to `src/css/main.css`:

   ```css
   @import "./components/hero-banner.css";
   ```

3. Run `npm run dev` to preview, or `npm run build` to compile.

## Adding new JS modules

1. Create a new file in `src/js/`, e.g. `src/js/my-feature.js`
2. Add an import to `src/js/main.js`:

   ```js
   import "./my-feature.js";
   ```

3. Vite will include it in `dist/theme.js` on build. No HTML changes needed.

## Customisations

Overrides of the upstream `ntgbase.min.css` theme are isolated in `src/css/components/` and imported last so they take cascade precedence.

| File                    | What it overrides                                                                         | Detail                                                                                                                                                                                                                                                                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `alert.css`             | `.alert-warning`, `.alert-info`, `.alert-information`, `.alert-danger`, `.alert-critical` | Global alert banners matching the Level 2–4 emergency response framework: information `#FFC72C` (yellow, `#212529` dark text ≈11.6:1 AAA), warning `#D6410A` (orange, white ≈5.0:1 AA), critical `#FC4141` (red, white ≈3.5:1 — AA large text only); 20px bold title `!important`, 16px body `!important` (forces override of PROD cascade); 24×24 close button absolutely positioned at `top: 16px; right: 16px` — dark icon on yellow, white icon on orange/red |
| `buttons.css`           | `.btn.ntg-btn` (primary)                                                                  | Background changed from navy `#1f1f5f` to Charcoal `#343741`; active state also updated                                                                                                                                                                                                                                              |
| `buttons.css`           | `.btn.ntg-btn--secondary` (outline)                                                       | Text and border colour changed from navy `#1f1f5f` to Charcoal `#343741`; white background; active state also updated                                                                                                                                                                                                                |
| `buttons.css`           | `.btn.ntg-btn--secondary:hover`                                                           | Background and border colour changed to Territory orange `#D6410A` (was `#2d2d8a`)                                                                                                                                                                                                                                                   |
| `buttons.css`           | `.homepage-news .btn.ntg-btn`                                                             | Border radius removed from the "View all" button                                                                                                                                                                                                                                                                                     |
| `header-footer.css`     | Header/footer background                                                                  | Charcoal `#343741`                                                                                                                                                                                                                                                                                                                   |
| `header-footer.css`     | Mobile search banner background                                                           | `.mobile-banner` overridden from navy `#1f1f5f` to Charcoal `#343741`                                                                                                                                                                                                                                                                |
| `mainmenu-dropdown.css` | Main nav background & behaviour                                                           | White `#ffffff` bg; bold black text; click-to-open dropdowns with Font Awesome chevron icons; `#fcccbb` hover with `#f4551a` accent borders; hamburger toggle on mobile; level-3 menus hidden                                                                                                                                        |
| `statistics.css`        | Statistics section                                                                        | Sand `#D9DED4` background; black text and icons                                                                                                                                                                                                                                                                                      |
| `main.css`              | Display card icons                                                                        | Icons use `fa-solid` (FA 6); default colour `#f4551a` (orange), hover colour `#c84c01` (darker orange)                                                                                                                                                                                                                               |
| `main.css`              | Display card titles                                                                       | Title colour `#343741` (Charcoal); orange long-arrow-right (`→`) appended via `::after`, slides 4 px right on hover; title uses flexbox row layout                                                                                                                                                                                   |
| `main.css`              | `.homepage-news .text-ntg-sky-blue`                                                       | Blue utility class overridden to black (`#000`) within the news section                                                                                                                                                                                                                                                              |
| `main.css`              | `.homepage-news .card-title`                                                              | Title colour set to Charcoal `#343741`; turns orange `#c84c01` on hover                                                                                                                                                                                                                                                              |
| `main.css`              | `.homepage-news .card`                                                                    | Border radius removed from news cards                                                                                                                                                                                                                                                                                                |
| `main.css`              | `.homepage-news .card-header`                                                             | Bottom border removed from card header                                                                                                                                                                                                                                                                                               |
| `main.css`              | `.homepage-news .card-tag`                                                                | Category label styled as a tag (design system default variant: white bg, `#1f1e27` text, `#d3d3d7` border)                                                                                                                                                                                                                           |

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
