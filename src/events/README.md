# Event page assets

This directory holds page-specific styles for event and recovery pages referenced directly by the CMS.

The event page asset is `event.css`, which controls the warning-level header accent and responsive content widths. The reusable share nester lives in `src/social-share/`: `social-share.css` contains its styles and `social-share.js` handles popups and copy-link behavior.

Reference `dist/social-share.css` from the Squiz Matrix share nester/page after the global theme, so its styles are loaded wherever that nester is used. Reference `dist/event.css` on event pages and `dist/social-share.js` for the share behavior. These assets are standalone and are not imported into the global theme bundle. On desktop, the share panel aligns with the first content section below the event H1; it stays in normal flow on smaller screens.

The local Severe Storm - Alice Springs capture loads `dist/event.css`, `dist/social-share.css`, and `dist/social-share.js` alongside the built theme. It uses the production share destinations and falls back to the embedded logo if the production image cannot be loaded. Run `npm run build` to generate these assets, then preview at `/Severe%20Storm%20%E2%80%93%20Alice%20Springs%20_%20SecureNT.html`; shared dependencies come from the gitignored `SecureNT_files/` directory.

Event breadcrumb and main content (including accordions) share the header and menu's 80rem maximum width and responsive horizontal gutters. The feedback band is styled site-wide by `src/css/components/feedback.css` in `dist/theme.css`; it extends across the viewport while its content uses the same responsive alignment. The footer retains its existing layout. Main navigation labels align with the header content edge using matching responsive offsets in `src/css/components/header-footer.css`.

The header accent uses the global status color tokens from the site theme. Its CMS markup appends the event warning-level metadata to the `warning-level-` class. Neutral is the default; the metadata value may be:

- `neutral`
- `advice`
- `watch_act`
- `emergency_warning`

After changing event or nester styles, check the preview at mobile, tablet, and desktop widths for aligned content edges, no horizontal overflow, the accent colour, and social-share hover and keyboard-focus states. Run `npm run build`; commit each generated `dist/` asset with its source counterpart because these standalone assets are referenced directly by the HTML/CMS.