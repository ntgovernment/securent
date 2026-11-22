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
          <li><a href="https://example.test/current-warnings">Warnings</a></li>
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
    </div></header>
    <div class="mobile-banner banner-search">
      <form class="ntg-header-search">
        <div class="input-group">
          <input name="query" aria-label="Search">
          <div class="input-group-append"><button type="submit">Search</button></div>
        </div>
      </form>
    </div>`;
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

test("keeps CMS anchor identity and literal destinations while appending missing mobile links", async () => {
  await withMenu(390, async (window, initialize) => {
    const anchors = [...window.document.querySelectorAll("nav a")];
    const destinations = anchors.map((anchor) => anchor.getAttribute("href"));
    initialize();
    const initialized = [...window.document.querySelectorAll("nav a")];
    assert.equal(initialized.length, anchors.length + 2);
    assert.ok(initialized.slice(0, anchors.length).every((anchor, index) => anchor === anchors[index]));
    assert.deepEqual(anchors.map((anchor) => anchor.getAttribute("href")), destinations);
    assert.ok(anchors.every((anchor) => anchor.isConnected));
    assert.deepEqual(
      initialized.slice(-2).map((anchor) => anchor.textContent.trim()),
      ["Emergency contacts", "Incident map"],
    );
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

test("compact search icon reveals the banner field and Escape closes it", async () => {
  for (const width of [390, 900]) {
    await withMenu(width, async (window, initialize) => {
      initialize();
      const document = window.document;
      const toggle = document.querySelector(".mobile-search-toggle");
      const input = document.querySelector(".mobile-banner input[name='query']");
      const banner = document.querySelector(".mobile-banner.banner-search");
      const nav = document.querySelector("nav.nav-masthead");
      assert.ok(toggle);
      assert.equal(document.querySelector("header.ntg-header").classList.contains("search-toggle-enhanced"), true);
      assert.equal(toggle.getAttribute("aria-expanded"), "false");
      const top = width === 900 ? 14 : 6;
      const rightInset = width === 900 ? 79 : 68;
      toggle.getBoundingClientRect = () => ({ top, right: width - rightInset, height: 44 });
      const navClass = nav.className;
      toggle.click();
      assert.equal(document.body.classList.contains("mobile-search-open"), true);
      assert.equal(toggle.getAttribute("aria-expanded"), "true");
      assert.equal(toggle.getAttribute("aria-label"), "Close search");
      assert.equal(document.activeElement, input);
      assert.equal(nav.className, navClass);
      assert.equal(banner.style.getPropertyValue("--search-overlay-top"), `${top - 2}px`);
      assert.equal(banner.style.getPropertyValue("--search-overlay-right"), `${rightInset}px`);
      document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape" }));
      assert.equal(document.body.classList.contains("mobile-search-open"), false);
      assert.equal(toggle.getAttribute("aria-expanded"), "false");
      assert.equal(toggle.getAttribute("aria-label"), "Open search");
      assert.equal(document.activeElement, toggle);
    });
  }
});

test("compact search stays open inside the form and closes on the backdrop or desktop resize", async () => {
  await withMenu(320, async (window, initialize) => {
    initialize();
    initialize();
    const document = window.document;
    const toggle = document.querySelector(".mobile-search-toggle");
    const backdrops = document.querySelectorAll(".mobile-search-backdrop");
    assert.equal(backdrops.length, 1);

    toggle.click();
    const input = document.querySelector(".mobile-banner input[name='query']");
    input.value = "shelter";
    input.click();
    assert.equal(document.body.classList.contains("mobile-search-open"), true);
    backdrops[0].click();
    assert.equal(document.body.classList.contains("mobile-search-open"), false);
    assert.equal(toggle.getAttribute("aria-expanded"), "false");
    assert.equal(document.activeElement, toggle);

    toggle.click();
    assert.equal(input.value, "shelter");
    window.happyDOM.setWindowSize({ width: 992, height: 844 });
    window.dispatchEvent(new window.Event("resize"));
    assert.equal(document.body.classList.contains("mobile-search-open"), false);
    assert.equal(toggle.getAttribute("aria-expanded"), "false");
    toggle.click();
    assert.equal(document.body.classList.contains("mobile-search-open"), false);
  });
});

test("the compact search clear button empties the query without submitting or dismissing the popup", async () => {
  await withMenu(320, async (window, initialize) => {
    initialize();
    initialize();
    const document = window.document;
    document.querySelector(".mobile-search-toggle").click();
    const form = document.querySelector(".mobile-banner form");
    const input = form.querySelector("input");
    const buttons = form.querySelectorAll(".mobile-search-clear");
    assert.equal(buttons.length, 1);
    const [clear] = buttons;
    assert.equal(clear.hidden, true);
    assert.equal(clear.getAttribute("aria-label"), "Clear search");
    input.value = "shelter";
    input.dispatchEvent(new window.Event("input", { bubbles: true }));
    assert.equal(clear.hidden, false);

    let submitted = false;
    let clearedQuery;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitted = true;
    });
    form.addEventListener("input", (event) => { clearedQuery = event.target.value; });
    clear.focus();
    clear.click();
    assert.equal(input.value, "");
    assert.equal(clearedQuery, "");
    assert.equal(submitted, false);
    assert.equal(clear.hidden, true);
    assert.equal(document.activeElement, input);
    assert.equal(document.body.classList.contains("mobile-search-open"), true);
  });
});

test("search toggle initializes in captures whose navigation is already enhanced", async () => {
  await withMenu(900, async (window, initialize) => {
    const document = window.document;
    const nav = document.querySelector("nav.nav-masthead");
    const header = document.querySelector("header.ntg-header");
    const toggle = document.createElement("button");
    toggle.className = "mobile-search-toggle";
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open search");
    toggle.dataset.searchToggleReady = "true";
    nav.dataset.navigationReady = "true";
    header.querySelector(".header-tools").append(toggle);

    initialize();
    assert.equal(header.classList.contains("search-toggle-enhanced"), true);
    toggle.click();
    assert.equal(document.body.classList.contains("mobile-search-open"), true);
    assert.equal(document.activeElement, document.querySelector(".mobile-banner input[name='query']"));
    document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape" }));
    assert.equal(document.body.classList.contains("mobile-search-open"), false);
    assert.equal(document.activeElement, toggle);
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

test("tablet search breakpoint uses the icon and the banner shares desktop field dimensions", async () => {
  const menuCss = await readFile(new URL("../css/components/mainmenu-dropdown.css", import.meta.url), "utf8");
  const headerCss = await readFile(new URL("../css/components/header-footer.css", import.meta.url), "utf8");
  const window = new Window();
  try {
    const menuSheet = new window.CSSStyleSheet();
    menuSheet.replaceSync(menuCss);
    const tabletRule = [...menuSheet.cssRules].find((rule) =>
      rule.conditionText === "(min-width: 768px) and (max-width: 991.98px)"
      && [...rule.cssRules].some((nested) =>
        nested.selectorText === "header.ntg-header.search-toggle-enhanced .mobile-search-toggle",
      ),
    );
    assert.ok(tabletRule);
    const tabletRules = [...tabletRule.cssRules];
    assert.equal(
      tabletRules
        .find((rule) => rule.selectorText === "header.ntg-header.search-toggle-enhanced .mobile-search-toggle")
        .style.display,
      "inline-flex",
    );
    const compactRules = [...menuSheet.cssRules].find((rule) =>
      rule.conditionText === "screen and (max-width: 991.98px)",
    ).cssRules;
    const banner = [...compactRules].find((rule) => rule.selectorText === ".mobile-banner.banner-search");
    const expandedBanner = [...compactRules].find((rule) =>
      rule.selectorText === "body.mobile-search-open .mobile-banner.banner-search",
    );
    assert.equal(banner.style.position, "fixed");
    assert.equal(banner.style.width, "296px");
    assert.equal(banner.style.clipPath, "inset(0 0 0 100%)");
    assert.equal(expandedBanner.style.clipPath, "inset(0)");

    const headerSheet = new window.CSSStyleSheet();
    headerSheet.replaceSync(headerCss);
    const bannerWidth = [...headerSheet.cssRules].find((rule) =>
      rule.selectorText === ".mobile-banner.banner-search .ntg-header-search"
      && rule.style.width === "100%",
    );
    const bannerInputGroup = [...headerSheet.cssRules].find((rule) =>
      rule.selectorText?.includes("header.ntg-header .header-tools .ntg-header-search .input-group")
      && rule.selectorText.includes(".mobile-banner.banner-search .ntg-header-search .input-group")
      && rule.style.height === "48px",
    );
    assert.ok(bannerWidth);
    assert.ok(bannerInputGroup);
  } finally {
    await window.happyDOM.close();
  }
});

test("navigation and header links suppress external icons and underline without a hover border", async () => {
  const menuCss = await readFile(new URL("../css/components/mainmenu-dropdown.css", import.meta.url), "utf8");
  const headerCss = await readFile(new URL("../css/components/header-footer.css", import.meta.url), "utf8");
  const window = new Window();
  try {
    const menuSheet = new window.CSSStyleSheet();
    menuSheet.replaceSync(menuCss);
    const menuRules = [...menuSheet.cssRules];
    const menuIcons = menuRules.find((rule) => rule.selectorText?.includes(".ntg-main-nav__links a.external::after"));
    assert.ok(menuIcons.selectorText.includes(".ntg-main-nav__links a.external::before"));
    assert.equal(menuIcons.style.display, "none");
    const rootLink = menuRules.find((rule) => rule.selectorText === "nav.nav-masthead .ntg-main-nav__links > li > a");
    assert.equal(rootLink.style.getPropertyValue("border-bottom"), "0px");
    const menuHover = menuRules.find((rule) => rule.selectorText?.includes(".ntg-main-nav__links a:hover"));
    assert.equal(menuHover.style.getPropertyValue("text-decoration"), "underline");
    assert.ok(menuHover.selectorText.includes("a:focus-visible .ntg-main-nav__label"));
    assert.ok(menuHover.selectorText.includes(".desktop-main-nav__toggle:hover > span:first-child"));

    const headerSheet = new window.CSSStyleSheet();
    headerSheet.replaceSync(headerCss);
    const headerRules = [...headerSheet.cssRules];
    const headerIcons = headerRules.find((rule) => rule.selectorText?.includes(".header-tools a.external::after"));
    assert.ok(headerIcons.selectorText.includes(".header-tools a.external::before"));
    assert.equal(headerIcons.style.display, "none");
    const headerHover = headerRules.find((rule) => rule.selectorText?.includes(".header-tools a:hover"));
    assert.equal(headerHover.style.getPropertyValue("text-decoration"), "underline");
    assert.ok(headerHover.selectorText.includes(".header-tools a:focus-visible"));
  } finally {
    await window.happyDOM.close();
  }
});

test("mobile parent links and disclosures fill the same row for short and wrapped labels", async () => {
  const css = await readFile(new URL("../css/components/mainmenu-dropdown.css", import.meta.url), "utf8");
  const window = new Window();
  try {
    const sheet = new window.CSSStyleSheet();
    sheet.replaceSync(css);
    const mobile = [...sheet.cssRules].find((rule) =>
      rule.conditionText === "(max-width: 767.98px)"
      && [...rule.cssRules].some((nested) => nested.selectorText === ".mobile-main-nav li.has-children"),
    );
    const rules = [...mobile.cssRules];
    const parent = rules.find((rule) => rule.selectorText === ".mobile-main-nav li.has-children");
    const link = rules.find((rule) => rule.selectorText === ".mobile-main-nav li.has-children > a");
    const toggle = rules.find((rule) => rule.selectorText === ".mobile-main-nav .mobile-submenu-toggle");
    assert.equal(parent.style.alignItems, "stretch");
    assert.equal(link.style.minHeight, "44px");
    assert.equal(toggle.style.minHeight, "44px");
    assert.equal(toggle.style.height, "auto");
  } finally {
    await window.happyDOM.close();
  }
});

test("mobile-only links follow the listing and retain their destinations", async () => {
  const preview = await readFile(new URL("../../alerts-and-warnings.html", import.meta.url), "utf8");
  const guide = await readFile(new URL("../navigation/README.md", import.meta.url), "utf8");
  const markup = guide.match(/```html\r?\n([\s\S]*?)```/)[1];
  const window = new Window();
  try {
    for (const html of [preview, markup.replace("%asset_listing%", '<li><a href="/recover">Recover</a></li>')]) {
      window.document.body.innerHTML = html;
      const links = [...window.document.querySelectorAll(".cms-main-nav > li.mobile-only-link > a")];
      assert.deepEqual(links.map((link) => link.textContent.trim()), ["Emergency contacts", "Incident map"]);
      assert.equal(links[1].href, "https://www.pfes.nt.gov.au/incidentmap");
      const items = [...window.document.querySelectorAll(".cms-main-nav > li")];
      assert.deepEqual(items.slice(-2), links.map((link) => link.parentElement));
    }

    const sheet = new window.CSSStyleSheet();
    sheet.replaceSync(await readFile(new URL("../css/components/mainmenu-dropdown.css", import.meta.url), "utf8"));
    const rules = [...sheet.cssRules];
    const desktop = rules.find((rule) => rule.selectorText?.includes("li.mobile-only-link"));
    assert.equal(desktop.style.getPropertyValue("display"), "none");
    const mobile = rules.find((rule) => rule.conditionText === "(max-width: 767.98px)"
      && [...rule.cssRules].some((nested) => nested.selectorText?.includes("li.mobile-only-link")));
    const visible = [...mobile.cssRules].find((rule) => rule.selectorText?.includes("li.mobile-only-link"));
    assert.equal(visible.style.getPropertyValue("display"), "block");
  } finally {
    await window.happyDOM.close();
  }
});

test("initialization restores missing mobile-only links without duplicating existing ones", async () => {
  await withMenu(390, async (window, initialize) => {
    const document = window.document;
    const headerTools = document.querySelector(".header-tools");
    const emergencyContacts = document.createElement("a");
    emergencyContacts.href = "https://preview.example/securent/emergency-contacts";
    emergencyContacts.textContent = "Emergency contacts";
    headerTools.append(emergencyContacts);
    const menu = document.querySelector(".cms-main-nav");
    const existing = document.createElement("li");
    existing.className = "mobile-only-link";
    existing.innerHTML = '<a href="/emergency-contacts">Emergency contacts</a>';
    menu.append(existing);
    document.querySelector("nav").dataset.navigationReady = "true";

    initialize();
    initialize();

    const links = [...menu.querySelectorAll(":scope > li.mobile-only-link > a")];
    assert.deepEqual(links.map((link) => link.textContent.trim()), ["Emergency contacts", "Incident map"]);
    assert.equal(links[1].href, "https://www.pfes.nt.gov.au/incidentmap");
  });
});

test("Current warnings keeps the orange background on mobile in all interaction states", async () => {
  const css = await readFile(new URL("../css/components/mainmenu-dropdown.css", import.meta.url), "utf8");
  const window = new Window();
  try {
    const sheet = new window.CSSStyleSheet();
    sheet.replaceSync(css);
    const rules = [...sheet.cssRules];
    for (const state of ["", ":hover", ":focus-visible", ":active"]) {
      const selector = `a[href$="/current-warnings"]${state}`;
      const matches = rules.filter((rule) => rule.selectorText?.split(",").some((part) => part.trim().endsWith(selector)));
      assert.ok(matches.length > 0, `Missing ${selector}`);
      const rule = matches.at(-1);
      assert.equal(rule.style.getPropertyValue("background-color"), "#d6410a");
      assert.equal(rule.style.getPropertyPriority("background-color"), "important");
    }
    for (const media of rules.filter((rule) => rule.conditionText === "(max-width: 767.98px)")) {
      assert.equal([...media.cssRules].some((rule) => rule.selectorText?.includes('a[href$="/current-warnings"]')), false);
    }
  } finally {
    await window.happyDOM.close();
  }
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