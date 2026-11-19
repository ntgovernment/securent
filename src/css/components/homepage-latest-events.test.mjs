import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const css = await readFile(new URL("./homepage-latest-events.css", import.meta.url), "utf8");
const normalizedCss = css.replaceAll(/\s+/g, "");

test("home warning banners share one warning-type-independent palette", () => {
  assert.match(normalizedCss, /#latest-warnings\.warning-banner\{[^}]*--warning-accent:#d6410a;[^}]*--warning-border:#003251;[^}]*--warning-surface:#fff;[^}]*--warning-text:#343741;/);
  assert.match(normalizedCss, /#latest-warnings\.warning-banner\{[^}]*border:1pxsolidvar\(--warning-border\);[^}]*border-left-width:12px;/);
  assert.doesNotMatch(normalizedCss, /#latest-warnings\.warning-banner\[data-warning-level=/);
  assert.match(normalizedCss, /#latest-warnings\.warning-banner>i\{[^}]*color:var\(--warning-text\)/);
  assert.match(normalizedCss, /#latest-warnings\.warning-banner__action--primary\{[^}]*background:var\(--warning-accent\);[^}]*color:#fff;/);
  assert.match(normalizedCss, /#latest-warnings\.warning-banner__action--secondary\{[^}]*background:#fff;[^}]*color:var\(--warning-accent\)/);
});

test("home warning banners use the reference spacing and typography", () => {
  assert.match(normalizedCss, /#latest-warnings\.warning-banner\{[^}]*gap:16px;[^}]*padding:16px24px;/);
  assert.match(normalizedCss, /#latest-warnings\.warning-bannerh3\{[^}]*font-size:18px;[^}]*line-height:20px;/);
  assert.match(normalizedCss, /#latest-warnings\.warning-bannerp\{[^}]*font-size:16px;[^}]*line-height:24px;/);
  assert.match(normalizedCss, /#latest-warnings\.warning-banner__action\{[^}]*min-height:42px;[^}]*gap:8px;[^}]*padding:12px16px;/);
});
