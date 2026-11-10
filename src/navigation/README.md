# Matrix Main Navigation

Publish these Bodycopy changes with the updated `dist/theme.js` and `dist/theme.css`.
The old script replaces CMS links with hard-coded destinations. The new script
never creates or changes menu links; `%asset_short_name_linked%` stays authoritative.
Keep the existing listing roots, ordering, asset types, permissions and link settings.
Use raw HTML divisions, not visual-editor paragraphs, around the Nested Content divisions.

## Upgrade From the Previous Template

If the earlier three-level templates are already installed:

1. Replace Main's **Default Format: First HTML Division** with the revised version
  below, which adds the native `.desktop-main-nav__toggle` label-and-arrow button.
2. Keep Main's Page Contents, closing HTML division and Level 2 Nested Content
  division unchanged. Level 2 and Level 3 markup and both dynamic-root calls are
  unchanged. Do not edit the CMS-generated destination URLs.
3. Publish the revised Main Bodycopy with the rebuilt `dist/theme.js` and
  `dist/theme.css`, then refresh both CMS asset cache references. Updating JS
  alone cannot provide the unified desktop control without its new markup.
4. Keep theme CSS as a normal stylesheet in the document head. Its initial-state
  rules prevent the expanded-menu flash while the theme module loads.

The alerts preview uses CSS cache version `41` and JS cache version `31`.
Production cache references are managed separately in Matrix.

For the hover-only update on an already migrated menu, publish the refreshed
`dist/theme.css` and refresh its CMS cache reference. No additional Bodycopy or
JavaScript changes are required; URLs and mobile interaction remain unchanged.

## Main Listing (Level 1)

### Page Contents

Replace the Main listing Page Contents with:

```html
<div class="row">
  <div class="col-md-12">
    <div class="au-main-nav__content" id="main-nav-default">
      <div class="au-main-nav__menu">
        <div class="au-main-nav__menu-inner" id="au-main-nav__links">
          <div class="au-main-nav__menu-inner-wrap" id="mmenu-wrapper">
            <ul class="ntg-main-nav__links cms-main-nav">%asset_listing%</ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

The surrounding `nav.nav-masthead` remains in the header design. Give it
`aria-label="Primary navigation"`; do not add another nested `nav` here.

### Default Format: First HTML Division

Replace the HTML division BEFORE the existing Level 2 Nested Content division with:

```html
<li>
  %asset_short_name_linked%
  <button class="desktop-main-nav__toggle" type="button" hidden>
    <span>%asset_short_name^escapehtml%</span>
    <span class="fa-regular fa-chevron-right" aria-hidden="true"></span>
  </button>
  <button class="mobile-submenu-toggle" type="button" hidden aria-label="Expand %asset_short_name^htmlentities:ENT_QUOTES% submenu">
    <span class="fa-regular fa-chevron-right" aria-hidden="true"></span>
  </button>
  <div class="desktop-main-nav__panel">
    <div class="desktop-main-nav__overview">
      <div class="desktop-main-nav__overview-title">%asset_short_name^escapehtml%</div>
      <p class="desktop-main-nav__description">%asset_metadata_page-description^escapehtml%</p>
      %asset_short_name_linked%
    </div>
    <div class="desktop-main-nav__columns">
```

### Default Format: Nested Content Division

Retain the existing Nested Content division, in its existing position:

| Setting | Value |
| --- | --- |
| Nested asset | Level 2 navigation, **1655529** |
| Additional GET parameter name | `root` |
| Additional GET parameter value | `%list_current_asset_assetid%` |

Do not replace this division with a literal placeholder or an inline nesting keyword.

### Default Format: Last HTML Division

Replace the HTML division AFTER the Level 2 Nested Content division with:

```html
    </div>
  </div>
</li>
```

## Level 2 Listing (1655529)

### Page Contents

```html
<ul class="ntg-main-nav__groups">%asset_listing%</ul>
```

### Default Format: First HTML Division

Replace the HTML division BEFORE the existing Level 3 Nested Content division with:

```html
<li>
  %asset_short_name_linked%
  <button class="mobile-submenu-toggle" type="button" hidden aria-label="Expand %asset_short_name^htmlentities:ENT_QUOTES% submenu">
    <span class="fa-regular fa-chevron-right" aria-hidden="true"></span>
  </button>
```

### Default Format: Nested Content Division

Retain the existing Nested Content division:

| Setting | Value |
| --- | --- |
| Nested asset | Level 3 navigation, **1657128** |
| Additional GET parameter name | `root` |
| Additional GET parameter value | `%list_current_asset_assetid%` |

### Default Format: Last HTML Division

```html
</li>
```

## Level 3 Listing (1657128)

### Page Contents

```html
<ul class="ntg-main-nav__submenu">%asset_listing%</ul>
```

### Default Format

```html
<li>%asset_short_name_linked%</li>
```

No additional nested listing is needed.

## Empty Results and Behavior

- Set Level 2 and Level 3 **No Results Bodycopy** to empty. Disable surrounding
  Page Contents on no-results output if the listing configuration offers that option.
  Do not output "No results" text or placeholder items.
- Empty child wrappers are tolerated: the script hides the empty panel and leaves
  its disclosure button hidden. Leaf links always remain normal links.
- Buttons are hidden until successfully bound. JavaScript assigns unique IDs,
  `aria-controls`, `aria-expanded`, accessible labels and panel labels. The CMS
  generates every link and all three content levels; JS only manages interaction.
- Desktop: each top-level parent uses one native button containing its label and
  chevron. Both parts expand/collapse the same panel and form one keyboard stop.
  The original top-level destination link is hidden, not rewritten; the overview
  retains its CMS-generated destination link. Items without children remain links.
  Level 2 groups and Level 3 links remain expanded inside each open panel.
- Desktop panel links keep a white background on hover and keyboard focus. A text
  underline supplies the hover/focus cue without changing borders or moving links.
- Mobile: parent links navigate; separate 40px buttons expand their children.
  Opening a sibling resets the previous branch. Escape closes and returns focus.
- Without JavaScript, the links and nested lists remain visible in normal flow.
- While JavaScript is loading, panels stay collapsed. The expanded fallback is
  scoped to `@media (scripting: none)` so a slow module cannot expand the header.
  Load the shared theme stylesheet in the document head, not asynchronously.
- There is one shared tree, not duplicate desktop/mobile listing assets. Descriptions
  are HTML-escaped text in the overview, not JSON embedded in HTML attributes.
- Keep the emergency-contacts link in the header. If it is needed inside the mobile
  drawer too, include it as a CMS-managed Main listing item with its existing URL
  and class `mobile-emergency-link`; it is not copied by JavaScript.

## Publish and Verify

1. Preview all three listing changes with the matching rebuilt theme before publishing.
2. Verify each nested listing has its existing dynamic root configured from GET `root`
   and lists direct children only. Do not change roots to descendants or the site root.
3. Compare literal link `href` attributes before and after script initialization,
   including aliases, external links, query strings, fragments and trailing slashes.
4. Test leaf items, empty children, keyboard focus, Escape, sibling collapse and
   767px/768px transitions. Check long labels at 320px and 375px.
5. Publish the Bodycopy and `dist/theme.js`/`dist/theme.css` together. Refresh the
   CMS asset cache versions; an old theme script will still overwrite these links.
6. Confirm the ordinary published page, not only Matrix preview or a no-cache URL.

Local checks: `node --test src/js/navigation.test.mjs` and `npm run build`.
The local regression uses `happy-dom`; Matrix keyword expansion, listing filtering
and production cache behavior must additionally be checked in Matrix.

## Verification Status

Verified locally on 10 November 2026:

- `node --test src/js/navigation.test.mjs src/js/quick-exit.test.mjs src/search/autocomplete.test.mjs`: 19 tests pass, including the pending-initialization CSS regression and unified desktop/split mobile controls.
- `npm run build`: passes and refreshes the tracked shared theme assets.
- Alerts preview: desktop panel alignment and visible Level 3 links at 1440px;
  wrapped labels and 40px controls at 320px, 375px and 767px; drawer and scroll-state
  cleanup at 768px; all destination links reachable with JavaScript disabled.
- Desktop hover: section headings and Level 3 links retain a white background,
  display a text underline and keep identical position and dimensions before and
  during hover. Computed borders are zero and transforms are disabled.
- First-load check with the theme module blocked: panels remain hidden at 375px
  and 1440px, with a compact header and a horizontal desktop root list. Applying
  the disabled-scripting media rules still exposes the fallback links.
- The migrated alerts capture uses theme CSS version `41` and theme JS version `31`.
  Other captures have not been migrated and must not be treated as enhanced-menu fixtures.

These are local results, not confirmation of production publication. Apply the
Bodycopy in Matrix and verify the ordinary published page after publishing the
matching theme assets and refreshing their cache references.