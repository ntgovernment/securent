# Event page assets

This directory holds page-specific styles for event and recovery pages referenced directly by the CMS.

The event page asset is `event.css`, which controls the warning-level header accent and responsive content widths. The reusable share nester lives in `src/social-share/`: `social-share.css` contains its styles and `social-share.js` handles social popups, native sharing and the copy fallback.

Reference `dist/social-share.css` from the Squiz Matrix share nester/page after the global theme, so its styles are loaded wherever that nester is used. Reference `dist/event.css` on event pages and `dist/social-share.js` for the share behavior. These assets are standalone and are not imported into the global theme bundle. On desktop, the share panel aligns with the first content section below the event H1; it stays in normal flow on smaller screens.

The share panel is 298px × 92px at all viewport widths, with square bottom corners. Its title and icon row share the same shade background with no divider; use 12px top padding and 4px bottom padding for the title, then 12px vertical padding for the icons. The first icon control is 32px square with 4px inset padding, and the remaining controls are 24px square.

The local Severe Storm - Alice Springs capture loads the rebuilt standalone social-share assets from `dist/`. Run `npm run build` before previewing at `/Severe%20Storm%20%E2%80%93%20Alice%20Springs%20_%20SecureNT.html`. The page has a prominent synthetic-content notice; its sample text and captured warning panels are not live emergency information.

## Social-share paint layout

Replace the existing copy-link list item with the following, keeping the other social links and the surrounding share section and list:

```html
<li class="list-group-item border-0 px-0">
  <button type="button" class="ntg-social-share__link ntg-social-share--native"
          aria-label="Share this page" title="Share this page">
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <line x1="7" y1="12" x2="17" y2="6" stroke="currentColor" stroke-width="2"></line>
      <line x1="7" y1="12" x2="17" y2="18" stroke="currentColor" stroke-width="2"></line>
      <circle cx="5" cy="12" r="3" fill="currentColor"></circle>
      <circle cx="19" cy="5" r="3" fill="currentColor"></circle>
      <circle cx="19" cy="19" r="3" fill="currentColor"></circle>
    </svg>
  </button>
  <div class="ntg-social-share__status" role="status" aria-live="polite"></div>
</li>
```

The button shares the page title and URL using the Web Share API. When unavailable, it copies the URL and announces success or failure. Cancelling the native share sheet does nothing; other sharing errors are announced. Existing copy-link markup continues to work during rollout. Build with `npm run build`, publish `dist/social-share.css` and `dist/social-share.js` through the Git file bridge, and update the paint layout and cached asset references together. Run `node --test src/social-share/social-share.test.mjs` for the targeted tests.

Warning accordions use the standalone stylesheet `dist/warning-accordion.css`, built from `src/css/components/warning-accordion.css`. Publish and reference that asset on event pages wherever the warning accordion markup is used.

The Latest update callout uses the shared theme: a 1px strong border, an 8px left accent, and the shade background. Rebuild and publish `dist/theme.css` and refresh its CMS cache reference when changing these styles. The local event capture currently uses its captured theme stylesheet.

## Warning accordion paint layout

Use native `<details>` and `<summary>` markup so the warning summary stays unchanged and the body is revealed when expanded. Leave off the `open` attribute for the collapsed default. The accordion has 24px of vertical margin so the surrounding content has consistent spacing. Hovering the accordion adds a shadow tinted with its warning-level accent without changing the container's dimensions. The chevron stays pinned to the summary's top-right corner as the locations wrap. Add the warning-level class to `<details>` so its accent matches the status: `warning-level-advice` (yellow, the default), `warning-level-watch_act` (orange), or `warning-level-emergency_warning` (red). The summary title is displayed in uppercase, so warning levels entered in lowercase still appear as `EMERGENCY WARNING`, `WATCH AND ACT`, or `ADVICE`. Each location gets a solid bullet; the stylesheet hides any remaining location-pin SVGs. Long names may wrap without separating the bullet from the label. The full-width More information link uses a 14px label, 16px right-arrow icon, and 8px gap; hovering underlines the text and shifts the arrow left. The CMS-generated external icon is hidden. Replace the asset and content placeholders with the appropriate Matrix asset URLs, metadata, and WYSIWYG content. Repeat the location element for each affected location.

```html
<link rel="stylesheet" href="PUBLISHED-URL-OF-warning-accordion.css">

<details class="warning-accordion warning-level-advice">
  <summary>
    <img class="warning-accordion__icon" src="PUBLISHED-URL-OF-WARNING-ICON" alt="">
    <span class="warning-accordion__content">
      <strong class="warning-accordion__title">[Incident type] warning: [warning level] for [location]</strong>
      <span class="warning-accordion__locations">
        <span class="warning-accordion__location">
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
      <svg aria-hidden="true" viewBox="0 0 16 16">
        <path d="M1.33 7.67h13.34m-5.33-5.67 5.33 5.67-5.33 5.66"></path>
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

The existing NTG components script populates the empty list from H2 headings other than `.accordion-header`. Do not include previously rendered links in saved captures or they will be appended a second time.

Add `data-event-page` to the event template's `<main>` element. The shared theme enhances only this page type, adding `.ntg-on-this-page` to the navigation container. At widths of 768px and above, the menu floats within its sidebar using sticky positioning, with a 16px top offset and scrolling for long menus. On smaller screens it remains in normal flow. Links stay underlined while hovered; the inherited hover border is disabled to prevent flashing and layout shifts. Social sharing stays separate from the floating menu.

`on-this-page.ts` retains the current section until the next heading reaches the top of the viewport (with a 2px rounding tolerance). This keeps short sections selected after following their anchors, even when later headings are visible. The first visible heading is used before any section reaches the top. At the bottom of the page, a visible URL anchor destination stays selected when it cannot scroll to the top; otherwise the final link is selected. Repeated heading IDs generated by the legacy component receive unique suffixes and matching navigation links. Active links receive `.active` and `aria-current="location"` without moving keyboard focus. Links populated later by the legacy component are supported. Other page types are unchanged. The built theme is scoped inside a function so classic CMS script tags cannot introduce globals that shadow jQuery.

The synthetic Severe Storm event capture is available at `/Severe%20Storm%20%E2%80%93%20Alice%20Springs%20_%20SecureNT.html`. It has six H2 sections for testing navigation. The capture loads built `dist/theme.js?v=35` and `dist/event.css?v=5`. Publish both assets with the event template marker and refresh equivalent CMS cache references. Run `node --test src/events/on-this-page.test.mjs src/js/navigation.test.mjs` and `npm run build` after edits. The TypeScript tests require Node.js 22.18 or later for native type stripping.

For browser verification, reload the event capture normally and confirm that the raw navigation list is empty but the rendered list contains one link per H2, without duplicates. Scroll down and back up to check the active link and `aria-current`. Hover links to confirm a persistent underline, no bottom border and no height change. Check sticky positioning at widths of 768px and above and normal flow below that breakpoint.

Also verify the disaster-recovery page content: clicking **Financial support** must not select the nearby **Power outage payments** heading. Both **Eligibility** and **How to apply** occurrences must link to their corresponding headings, with unique IDs. At tall viewport heights, clicking an anchor near the page bottom must keep that destination selected even if the final heading is also visible. Check desktop and mobile layouts and allow smooth scrolling to finish before checking the active link.

Event breadcrumb and main content (including accordions) share the header and menu's 80rem maximum width and responsive horizontal gutters. The feedback band is styled site-wide by `src/css/components/feedback.css` in `dist/theme.css`; it extends across the viewport while its content uses the same responsive alignment. The footer retains its existing layout. Main navigation labels align with the header content edge using matching responsive offsets in `src/css/components/header-footer.css`.

The event capture uses the same border-free mobile menu as the alerts and homepage captures: parent links navigate, while separate square chevron buttons toggle children. See [Mobile navigation](../../README.md#mobile-navigation) for spacing, keyboard behavior, and verification. When rebuilding shared theme assets, update their `?v=` references in every local capture and verify a normal reload; changing only the event stylesheet will not refresh cached theme styles or scripts.

The header accent uses the global status color tokens from the site theme. Its CMS markup appends the event warning-level metadata to the `warning-level-` class. Neutral is the default; the metadata value may be:

- `neutral`
- `advice`
- `watch_act`
- `emergency_warning`

After changing event or nester styles, check the preview at mobile, tablet, and desktop widths for aligned content edges, no horizontal overflow, the accent colour, and social-share hover and keyboard-focus states. Run `npm run build`; commit each generated `dist/` asset with its source counterpart because these standalone assets are referenced directly by the HTML/CMS.