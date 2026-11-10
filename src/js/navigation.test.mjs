import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Window } from "happy-dom";

const source = await readFile(new URL("./main.js", import.meta.url), "utf8");
const navigationSource = source.slice(source.indexOf("(function () {", source.indexOf("Responsive navigation")));

function fixture(window) {
  window.document.body.innerHTML = `
    <header class="ntg-header"><div class="navbar">
      <div class="header-tools"></div><div class="header-navigation">
        <nav class="nav-masthead"><ul class="ntg-main-nav__links cms-main-nav">
          <li><a href="https://cmsexternal.nt.gov.au/securent/current-warnings">Warnings</a></li>
          <li><a href="./prepare?source=nav&amp;mode=all#start">Prepare</a>
            <button type="button" class="desktop-main-nav__toggle" hidden><span>Prepare</span><span class="fa-regular fa-chevron-right" aria-hidden="true"></span></button>
            <button type="button" class="mobile-submenu-toggle" hidden>Expand Prepare submenu</button>
            <div class="desktop-main-nav__panel">
              <div class="desktop-main-nav__overview"><p>Stay safe.</p></div>
              <div class="desktop-main-nav__columns"><ul class="ntg-main-nav__groups">
                <li><a href="/planning/">Planning</a>
                  <button type="button" class="mobile-submenu-toggle" hidden>Expand Planning submenu</button>
                  <ul class="ntg-main-nav__submenu">
                    <li><a href="https://example.test/emergency-plans-and-kits">Prepare your emergency plan and kit</a></li>
                  </ul>
                </li>
                <li><a href="/empty">Empty</a><button type="button" class="mobile-submenu-toggle" hidden>Empty</button><ul></ul></li>
              </ul></div>
            </div>
          </li>
          <li><a href="https://example.test/respond">Respond</a>
            <button type="button" class="desktop-main-nav__toggle" hidden><span>Respond</span><span class="fa-regular fa-chevron-right" aria-hidden="true"></span></button>
            <button type="button" class="mobile-submenu-toggle" hidden>Expand Respond submenu</button>
            <div class="desktop-main-nav__panel"><div class="desktop-main-nav__columns"><ul class="ntg-main-nav__groups">
              <li><a href="/help">Help</a></li>
            </ul></div></div>
          </li>
        </ul></nav>
      </div>
    </div></header>`;
}

async function withMenu(width, check) {
  const window = new Window({ width });
  try {
    fixture(window);
    await check(window, () => window.eval(navigationSource));
  } finally {
    await window.happyDOM.close();
  }
}

test("keeps CMS anchor identity and literal destinations instead of rebuilding menu content", async () => {
  await withMenu(390, async (window, initialize) => {
    const anchors = [...window.document.querySelectorAll("nav a")];
    const destinations = anchors.map((anchor) => anchor.getAttribute("href"));
    initialize();
    const initialized = [...window.document.querySelectorAll("nav a")];
    assert.ok(initialized.length === anchors.length && initialized.every((anchor, index) => anchor === anchors[index]));
    assert.deepEqual(anchors.map((anchor) => anchor.getAttribute("href")), destinations);
    assert.ok(anchors.every((anchor) => anchor.isConnected));
    assert.equal(window.document.querySelectorAll("nav .mobile-menu-toggle").length, 0);
  });
});

test("mobile disclosures reset siblings and descendants without intercepting destination links", async () => {
  await withMenu(390, async (window, initialize) => {
    initialize();
    const document = window.document;
    const parents = [...document.querySelectorAll(".cms-main-nav > li")];
    const prepare = parents[1].querySelector(":scope > .mobile-submenu-toggle");
    const respond = parents[2].querySelector(":scope > .mobile-submenu-toggle");
    const planning = parents[1].querySelector(".ntg-main-nav__groups > li > button");
    assert.equal(prepare.hidden, false);
    prepare.click();
    planning.click();
    assert.equal(planning.getAttribute("aria-expanded"), "true");
    respond.click();
    assert.equal(prepare.getAttribute("aria-expanded"), "false");
    assert.equal(planning.getAttribute("aria-expanded"), "false");
    assert.equal(respond.getAttribute("aria-expanded"), "true");
    const linkEvent = new window.MouseEvent("click", { bubbles: true, cancelable: true });
    parents[1].querySelector("a").dispatchEvent(linkEvent);
    assert.equal(linkEvent.defaultPrevented, false);
    const empty = document.querySelector('a[href="/empty"]').parentElement;
    assert.equal(empty.querySelector("button").hidden, true);
    assert.equal(empty.classList.contains("has-children"), false);
    const controls = [...document.querySelectorAll('.cms-main-nav button:not([hidden])')];
    const ids = controls.map((control) => control.getAttribute("aria-controls"));
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) assert.ok(document.getElementById(id));
  });
});

test("desktop keeps level 3 visible and closes panels on Escape, focus departure and outside click", async () => {
  await withMenu(1440, async (window, initialize) => {
    initialize();
    const document = window.document;
    const prepare = document.querySelectorAll(".cms-main-nav > li")[1].querySelector(":scope > .desktop-main-nav__toggle");
    const level3 = document.querySelector(".ntg-main-nav__submenu");
    assert.equal(level3.hidden, false);
    prepare.click();
    assert.equal(prepare.getAttribute("aria-expanded"), "true");
    document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape" }));
    assert.equal(prepare.getAttribute("aria-expanded"), "false");
    assert.equal(document.activeElement, prepare);
    prepare.click();
    document.body.click();
    assert.equal(prepare.getAttribute("aria-expanded"), "false");
    prepare.click();
    prepare.dispatchEvent(new window.FocusEvent("focusout", { bubbles: true, relatedTarget: document.body }));
    assert.equal(prepare.getAttribute("aria-expanded"), "false");
  });
});

test("breakpoint changes restore scrolling, reset disclosure state and initialization is repeat-safe", async () => {
  await withMenu(390, async (window, initialize) => {
    window.document.body.style.overflow = "auto";
    initialize();
    initialize();
    const document = window.document;
    assert.equal(document.querySelectorAll(".mobile-menu-toggle").length, 1);
    document.querySelector(".mobile-menu-toggle").click();
    assert.equal(document.body.style.overflow, "hidden");
    window.happyDOM.setWindowSize({ width: 1440, height: 900 });
    window.dispatchEvent(new window.Event("resize"));
    assert.equal(document.body.style.overflow, "auto");
    assert.equal(document.querySelector(".ntg-main-nav__submenu").hidden, false);
    window.happyDOM.setWindowSize({ width: 390, height: 844 });
    window.dispatchEvent(new window.Event("resize"));
    assert.equal(document.querySelector(".ntg-main-nav__submenu").hidden, true);
  });
});

test("missing navigation is a no-op", async () => {
  const window = new Window();
  try {
    assert.doesNotThrow(() => window.eval(navigationSource));
  } finally {
    await window.happyDOM.close();
  }
});

test("documented Matrix divisions form the same three-level tree without changing expanded links", async () => {
  const guide = await readFile(new URL("../navigation/README.md", import.meta.url), "utf8");
  const blocks = [...guide.matchAll(/```html\r?\n([\s\S]*?)```/g)].map((match) => match[1]);
  assert.equal(blocks.length, 8);
  const escape = (value) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("'", "&#039;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const expand = (markup, label, href) => markup
    .replaceAll("%asset_short_name_linked%", `<a href="${escape(href)}">${escape(label)}</a>`)
    .replaceAll("%asset_short_name^escapehtml%", escape(label))
    .replaceAll("%asset_short_name^htmlentities:ENT_QUOTES%", escape(label))
    .replaceAll("%asset_metadata_page-description^escapehtml%", escape('Prepare "now" & stay <safe>.'));
  const leaf = expand(blocks[7], "Plan & kit", "/emergency-plans-and-kits?mode=all&view=full#kit");
  const level3 = blocks[6].replace("%asset_listing%", leaf);
  const group = expand(blocks[4] + level3 + blocks[5], 'Planning "today"', "./planning/");
  const level2 = blocks[3].replace("%asset_listing%", group);
  const root = expand(blocks[1] + level2 + blocks[2], "Prepare", "https://example.test/prepare/");
  await withMenu(390, async (window, initialize) => {
    const nav = window.document.querySelector("nav");
    nav.innerHTML = blocks[0].replace("%asset_listing%", root);
    const anchors = [...nav.querySelectorAll("a")];
    const hrefs = anchors.map((anchor) => anchor.getAttribute("href"));
    initialize();
    nav.querySelector(".cms-main-nav > li > .mobile-submenu-toggle").click();
    nav.querySelector(".ntg-main-nav__groups > li > button").click();
    assert.ok(anchors.every((anchor) => anchor.isConnected));
    assert.deepEqual(anchors.map((anchor) => anchor.getAttribute("href")), hrefs);
    assert.equal(nav.querySelector(".ntg-main-nav__submenu").hidden, false);
    assert.equal(nav.querySelector(".desktop-main-nav__description").textContent, 'Prepare "now" & stay <safe>.');
    assert.equal(nav.querySelector(".desktop-main-nav__description safe"), null);
    assert.equal(nav.textContent.includes("%asset_"), false);
    assert.equal(nav.querySelectorAll(".ntg-main-nav__groups > li").length, 1);
    assert.equal(nav.querySelectorAll(".ntg-main-nav__submenu > li").length, 1);
  });
});

test("older CMS markup retains its original links without hard-coded replacement", async () => {
  await withMenu(390, async (window, initialize) => {
    window.document.querySelector(".cms-main-nav").classList.remove("cms-main-nav");
    const anchors = [...window.document.querySelectorAll("nav a")];
    initialize();
    assert.ok(anchors.every((anchor) => anchor.isConnected));
    assert.equal(window.document.querySelector(".mobile-menu-toggle"), null);
    assert.equal(window.document.querySelector(".navigation-enhanced"), null);
  });
});

test("expanded fallback is restricted to disabled scripting, not pending initialization", async () => {
  const css = await readFile(new URL("../css/components/mainmenu-dropdown.css", import.meta.url), "utf8");
  const window = new Window();
  try {
    const sheet = new window.CSSStyleSheet();
    sheet.replaceSync(css);
    const rules = [...sheet.cssRules];
    const pending = rules.find((rule) => rule.selectorText === "nav.nav-masthead:not(.navigation-enhanced) .cms-main-nav .desktop-main-nav__panel");
    assert.equal(pending.style.getPropertyValue("display"), "none");
    assert.equal(pending.style.getPropertyPriority("display"), "important");
    const fallback = rules.find((rule) => rule.conditionText === "(scripting: none)");
    assert.ok(fallback);
    assert.ok([...fallback.cssRules].some((rule) => rule.selectorText?.includes(".desktop-main-nav__panel") && rule.style.display === "block"));
    assert.equal(rules.some((rule) => rule.selectorText?.includes(":not(.navigation-enhanced)") && rule.style.display === "block"), false);
  } finally {
    await window.happyDOM.close();
  }
});

test("desktop uses one label-and-arrow button while mobile retains its destination and separate arrow", async () => {
  await withMenu(1440, async (window, initialize) => {
    initialize();
    const item = window.document.querySelectorAll(".cms-main-nav > li")[1];
    const link = item.querySelector(":scope > a");
    const href = link.getAttribute("href");
    const desktop = item.querySelector(":scope > .desktop-main-nav__toggle");
    const mobile = item.querySelector(":scope > .mobile-submenu-toggle");
    assert.equal(desktop.hidden, false);
    assert.equal(link.hidden, true);
    assert.equal(mobile.hidden, true);
    desktop.querySelector("span").click();
    assert.equal(desktop.getAttribute("aria-expanded"), "true");
    desktop.querySelectorAll("span")[1].click();
    assert.equal(desktop.getAttribute("aria-expanded"), "false");
    window.happyDOM.setWindowSize({ width: 390, height: 844 });
    window.dispatchEvent(new window.Event("resize"));
    assert.equal(desktop.hidden, true);
    assert.equal(link.hidden, false);
    assert.equal(mobile.hidden, false);
    assert.equal(link.getAttribute("href"), href);
    mobile.click();
    assert.equal(mobile.getAttribute("aria-expanded"), "true");
    const click = new window.MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(click);
    assert.equal(click.defaultPrevented, false);
    assert.equal(window.document.querySelector('.cms-main-nav > li > a').hidden, false);
  });
});