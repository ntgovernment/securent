# Event page assets

This directory holds page-specific CSS and JavaScript for event and recovery pages referenced directly by the CMS.

Keep each page's files side by side with matching names. For the Tropical Cyclone Fina recovery update page, use:

- `event.css`
- `event.js`

Upload or reference these source assets through the CMS page. They are not imported by the global Vite entry points or bundled with the site theme.

The Tropical Cyclone Fina header accent uses the global status color tokens from the site theme. Its CMS markup appends the event warning-level metadata to the `warning-level-` class. Neutral is the default; the metadata value may be:

- `neutral`
- `advice`
- `watch_act`
- `emergency_warning`