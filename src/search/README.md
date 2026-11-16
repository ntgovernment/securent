# Search results presentation

The existing CMS `ntgCOVEO` controller still owns searching, corrections, filtering,
result links and pagination. The theme stylesheet supplies scoped search styles.
The standalone presentation enhancer adds breadcrumb paths and places updated dates
below descriptions. It does not change the current 200-results-per-page setting or
activate pagination.

## Source and build outputs

| Source | Purpose |
| --- | --- |
| [results.css](results.css) | Search-scoped styles, imported by the shared theme CSS entry. |
| [results.ts](results.ts) | Typed wrapper around the existing Coveo result renderer. |
| [results-entry.ts](results-entry.ts) | Installs the wrapper when the standalone module is imported. |
| [results.test.mjs](results.test.mjs) | Focused DOM and JSON-lookup regression tests. |

The build produces `dist/theme.css` and `dist/search-results.js`. The enhancer marks
the search main element with `.securent-search`; the new styles are scoped to that
page. Loading only the stylesheet does not install the marker or metadata behavior.
Other pages do not need the standalone module.

## Publishing in Squiz Matrix

1. Run `npm run build` and publish the resulting file-bridge assets, including
   `dist/theme.css` and `dist/search-results.js`.
2. Keep the theme stylesheet in the document head and refresh its CMS cache reference.
3. Keep the existing Coveo controller, pagination plugin and Moment scripts.
4. **Replace** the existing inline search initialization with the following module.
   Substitute the current file-bridge URL/cache reference and preserve the existing
   CMS expressions for the query and corrections values. Do not initialize twice.

```html
<!-- Existing controller, pagination and Moment scripts must precede this module. -->
<script type="module">
  import "https://cmsexternal.nt.gov.au/__data/assets/git_bridge/0007/1650175/dist/search-results.js?v=1";

  jQuery(function () {
    var query = "warnings"; // Replace with the existing JSON-encoded CMS query expression.
    var corrections = true; // Keep the existing CMS corrections setting.
    ntgCOVEO.init(query, corrections, "19409");
  });
</script>
```

The module import installs the enhancer before initialization. A separate module
script followed by the old classic inline initialization does **not** guarantee this
order: modules are deferred. Keep the import and initialization together as above.
The query placeholder must be replaced with a valid JavaScript expression using the
CMS's existing safe JSON encoding, not raw query-string interpolation.

Keep the search form action pointing to the SecureNT search page. Do not edit the
upstream result template or replace the CMS controller to apply this patch.
Refresh the new module's CMS cache reference on later releases.

## Breadcrumbs and metadata

- Parent labels come from `raw.dctitle`, `title` or `raw.systitle` in the JSON,
  matched by URL after stripping query strings, fragments and trailing slashes.
  URL slugs are not converted into display labels. The site root is `SecureNT`.
- Breadcrumbs are a non-clickable location path, excluding the current result.
  Only same-origin result paths are enhanced.
- If an ancestor title is missing, the enhancer performs one cached, same-origin
  request to the controller's configured endpoint with an empty `searchterm` and
  its configured `scopeID`. The existing endpoint cap still applies; unresolved
  ancestors are omitted. No individual content pages are scraped.
- The lookup times out after 10 seconds. HTTP, network or malformed-response errors
  produce a console warning and a visible status message, without removing results.
  A reload permits retrying a failed lookup.
- HTML updated dates use `raw.dcmodified`; document dates retain the controller's
  `raw.sysdate` source. Valid dates use NT local time and a machine-readable
  `<time datetime>` value. Missing dates are omitted; invalid dates also log a warning.
  Document type labels remain visible. Existing description content is preserved.

## Verification and rollback

Run `node --test src/search/results.test.mjs` and `npm run build`.
The tests import TypeScript directly and require native TypeScript stripping
(Node.js 22.18+ or 24+); no test transpiler is configured.
Check desktop and narrow mobile widths, keyboard focus, a new search and type
filtering. Check long labels, empty descriptions, document results and dates.
The pagination container may be empty: the patch deliberately does not enable it.

Expected layout measurements:

- At 1280px and 768px: card padding is 24px vertically and 32px horizontally.
- At 375px: horizontal padding is 16px, controls stack, and long titles and
  breadcrumb labels wrap without widening the search content.
- Titles use 20px/24px bold Lato; descriptions use 16px/24px; locations and metadata
  use 14px/20px. Search controls are 48px high and have a visible keyboard focus.
- Existing pagination uses teal active states; hidden results must stay hidden.

The tracked `Search _ SecureNT.html` and `Search _ SecureNT_files/` are archived
browser captures, not a current wired-up preview of this enhancement. They retain
their captured theme assets. Validate using the CMS template/controller with the
built assets, rather than treating an unchanged capture as a deployment check.

To roll back, restore the original inline initialization and remove the module
import; restore the previous theme stylesheet cache reference. The controller and
JSON endpoint are unchanged. Publishing built assets locally does not update the
live CMS page automatically.
