# Event page assets

This directory holds page-specific styles for event and recovery pages referenced directly by the CMS.

The event page asset is `event.css`, which controls the warning-level header accent, responsive content widths and event-only sticky in-page navigation. The reusable share nester lives in `src/social-share/`: `social-share.css` contains its styles and `social-share.js` handles popups and copy-link behavior.

Reference `dist/social-share.css` from the Squiz Matrix share nester/page after the global theme, so its styles are loaded wherever that nester is used. Reference `dist/event.css` on event pages and `dist/social-share.js` for the share behavior. These assets are standalone and are not imported into the global theme bundle. On desktop, the share panel aligns with the first content section below the event H1; it stays in normal flow on smaller screens.

The local Severe Storm - Alice Springs capture loads `dist/event.css`, `dist/social-share.css`, and `dist/social-share.js` alongside the built theme. It uses the production share destinations and falls back to the embedded logo if the production image cannot be loaded. Run `npm run build` to generate these assets, then preview at `/Severe%20Storm%20%E2%80%93%20Alice%20Springs%20_%20SecureNT.html`; shared dependencies come from the gitignored `SecureNT_files/` directory.

## On This Page

Sticky navigation is event-only. Add `data-event-page` to the event template's existing `<main id="content">`, and put this container in its sidebar inside that main element:

```html
<div data-component="ntg-inpage-nav" class="d-print-none">
	<ul class="ntg-inpage-nav"></ul>
</div>
```

The existing NTG components script populates the empty list from H2 headings other than `.accordion-header`. The local event capture currently has one eligible H2, so its menu contains only **More information**. Do not include previously rendered links in saved captures or they will be appended a second time. Load the shared `dist/theme.js` and the standalone `dist/event.css`; the initializer in `src/js/on-this-page.mjs` only enhances menus inside `main#content[data-event-page]`. Ordinary content-page menus remain unchanged, even if they load the event stylesheet.

Publish the event template marker and navigation container together with rebuilt `dist/theme.js`, `dist/theme.css` and `dist/event.css`. Refresh all three CMS asset cache references: the theme initializer now enforces event-only activation, the global stylesheet no longer owns sticky-menu styling, and the event stylesheet owns the 1px rail and 6px accent. Do not add `data-event-page` to ordinary content templates. The development server still opens the shelter content capture at `/`; use the explicit event URL above when checking this feature.

At desktop widths (768px and wider), the menu sticks 16px below the viewport top and remains inside the event sidebar. Its opaque white background covers content scrolling behind it; tall menus scroll internally. The gray rail is 1px wide and the active orange accent is 6px wide, touching the rail's inner edge with no gap. The visible linked heading nearest the top reference is highlighted with `aria-current="location"`; scrolling and content-size changes update it without moving focus or changing destinations. Smaller screens retain normal flow, and the menu is hidden when printing. The separate site-navigation and share panels are not made sticky.

The event capture currently references theme CSS version `49`, theme JavaScript version `32`, and event CSS version `2`. Refresh cache references after rebuilding, including equivalent CMS references. Run `node --test src/js/on-this-page.test.mjs src/js/navigation.test.mjs` and `npm run build`. Verify both an event page and an ordinary content page so event-only activation does not regress.

Event breadcrumb and main content (including accordions) share the header and menu's 80rem maximum width and responsive horizontal gutters. The feedback band is styled site-wide by `src/css/components/feedback.css` in `dist/theme.css`; it extends across the viewport while its content uses the same responsive alignment. The footer retains its existing layout. Main navigation labels align with the header content edge using matching responsive offsets in `src/css/components/header-footer.css`.

The event capture uses the same border-free mobile menu as the alerts and homepage captures: parent links navigate, while separate square chevron buttons toggle children. See [Mobile navigation](../../README.md#mobile-navigation) for spacing, keyboard behavior, and verification. When rebuilding shared theme assets, update their `?v=` references in every local capture and verify a normal reload; changing only the event stylesheet will not refresh cached theme styles or scripts.

The header accent uses the global status color tokens from the site theme. Its CMS markup appends the event warning-level metadata to the `warning-level-` class. Neutral is the default; the metadata value may be:

- `neutral`
- `advice`
- `watch_act`
- `emergency_warning`

After changing event or nester styles, check the preview at mobile, tablet, and desktop widths for aligned content edges, no horizontal overflow, the accent colour, and social-share hover and keyboard-focus states. Run `npm run build`; commit each generated `dist/` asset with its source counterpart because these standalone assets are referenced directly by the HTML/CMS.