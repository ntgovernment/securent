# Event page assets

This directory holds page-specific styles for event and recovery pages referenced directly by the CMS.

The event page asset is `event.css`, which controls the warning-level header accent and responsive content widths. The reusable share nester lives in `src/social-share/`: `social-share.css` contains its styles and `social-share.js` handles popups and copy-link behavior.

Reference `dist/social-share.css` from the Squiz Matrix share nester/page after the global theme, so its styles are loaded wherever that nester is used. Reference `dist/event.css` on event pages and `dist/social-share.js` for the share behavior. These assets are standalone and are not imported into the global theme bundle. On desktop, the share panel aligns with the first content section below the event H1; it stays in normal flow on smaller screens.

The local Severe Storm - Alice Springs capture loads `dist/event.css`, `dist/social-share.css`, and `dist/social-share.js` alongside the built theme. It uses the production share destinations and falls back to the embedded logo if the production image cannot be loaded. Run `npm run build` to generate these assets, then preview at `/Severe%20Storm%20%E2%80%93%20Alice%20Springs%20_%20SecureNT.html`; shared dependencies come from the gitignored `SecureNT_files/` directory.

Warning accordions use the standalone stylesheet `dist/warning-accordion.css`, built from `src/css/components/warning-accordion.css`. Publish and reference that asset on event pages wherever the warning accordion markup is used.

## Warning accordion paint layout

Use native `<details>` and `<summary>` markup so the warning summary stays unchanged and the body is revealed when expanded. Leave off the `open` attribute for the collapsed default. Replace the asset and content placeholders with the appropriate Matrix asset URLs, metadata, and WYSIWYG content. Repeat the location element for each affected location.

```html
<link rel="stylesheet" href="PUBLISHED-URL-OF-warning-accordion.css">

<details class="warning-accordion">
  <summary>
    <img class="warning-accordion__icon" src="PUBLISHED-URL-OF-WARNING-ICON" alt="">
    <span class="warning-accordion__content">
      <strong class="warning-accordion__title">[Incident type] warning: [warning level] for [location]</strong>
      <span class="warning-accordion__locations">
        <span class="warning-accordion__location">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"></path>
            <circle cx="12" cy="10" r="2.25"></circle>
          </svg>
          <span>[Location name]</span>
        </span>
      </span>
    </span>
    <span class="warning-accordion__toggle" aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d="m5 9 7 7 7-7"></path></svg>
    </span>
  </summary>

  <div class="warning-accordion__body">
    [Warning details and safety advice]
    <a href="MORE-INFORMATION-URL">
      More information
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M4 12h15m-6-6 6 6-6 6"></path>
      </svg>
    </a>
  </div>
</details>
```

Keep the stylesheet version current in local captures and CMS references whenever the standalone CSS changes.

## On This Page

The event sidebar retains its legacy in-page menu container:

```html
<div data-component="ntg-inpage-nav" class="d-print-none">
	<ul class="ntg-inpage-nav"></ul>
</div>
```

The existing NTG components script populates the empty list from H2 headings other than `.accordion-header`. The local event capture currently has one eligible H2, so its menu contains only **More information**. Do not include previously rendered links in saved captures or they will be appended a second time.

Reverting `9b3e654` removes the shared sticky-navigation initializer and its tests. The later event-template marker and event stylesheet rules remain, but the shared theme no longer adds `.ntg-on-this-page`, so these menus stay in normal flow without automatic active-heading tracking. The development server again opens Current warnings at `/`; use the explicit event URL above to preview the legacy menu.

The event capture retains theme CSS version `49`, theme JavaScript version `32`, and event CSS version `2`. Refresh cache references after rebuilding, including equivalent CMS references. Run `node --test src/js/navigation.test.mjs` and `npm run build` after shared-navigation edits.

Event breadcrumb and main content (including accordions) share the header and menu's 80rem maximum width and responsive horizontal gutters. The feedback band is styled site-wide by `src/css/components/feedback.css` in `dist/theme.css`; it extends across the viewport while its content uses the same responsive alignment. The footer retains its existing layout. Main navigation labels align with the header content edge using matching responsive offsets in `src/css/components/header-footer.css`.

The event capture uses the same border-free mobile menu as the alerts and homepage captures: parent links navigate, while separate square chevron buttons toggle children. See [Mobile navigation](../../README.md#mobile-navigation) for spacing, keyboard behavior, and verification. When rebuilding shared theme assets, update their `?v=` references in every local capture and verify a normal reload; changing only the event stylesheet will not refresh cached theme styles or scripts.

The header accent uses the global status color tokens from the site theme. Its CMS markup appends the event warning-level metadata to the `warning-level-` class. Neutral is the default; the metadata value may be:

- `neutral`
- `advice`
- `watch_act`
- `emergency_warning`

After changing event or nester styles, check the preview at mobile, tablet, and desktop widths for aligned content edges, no horizontal overflow, the accent colour, and social-share hover and keyboard-focus states. Run `npm run build`; commit each generated `dist/` asset with its source counterpart because these standalone assets are referenced directly by the HTML/CMS.