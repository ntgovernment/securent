# Event page assets

This directory holds page-specific styles for event and recovery pages referenced directly by the CMS.

The current asset is `event.css`, which styles the warning-level header accent and social-share links. There is no event-specific JavaScript file.

Reference this stylesheet directly from the CMS page after the global theme. It is not imported by the global Vite entry points or bundled into `dist/theme.css`.

The local Severe Storm - Alice Springs capture loads `src/events/event.css` alongside the built theme. Preview it at `/Severe%20Storm%20%E2%80%93%20Alice%20Springs%20_%20SecureNT.html`; its shared dependencies come from the gitignored `SecureNT_files/` directory.

The header accent uses the global status color tokens from the site theme. Its CMS markup appends the event warning-level metadata to the `warning-level-` class. Neutral is the default; the metadata value may be:

- `neutral`
- `advice`
- `watch_act`
- `emergency_warning`

After changing this stylesheet, check the event preview at mobile and desktop widths, including the accent colour and social-share hover and keyboard-focus states. Commit the source stylesheet itself; rebuilding the global theme does not publish event-specific styles.