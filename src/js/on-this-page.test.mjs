import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { initializeOnThisPage } from "./on-this-page.mjs";

async function withMenu(check) {
  const window = new Window({ url: "http://localhost:5173/" });
  window.document.body.innerHTML = `
    <main id="content" data-event-page><div class="content__main">
      <h2 id="first">First</h2><h2 id="second">Second</h2><h2 id="third">Third</h2>
    </div><div data-component="ntg-inpage-nav"><ul class="ntg-inpage-nav">
      <li class="nav-item heading">On this page</li>
      <li class="nav-item" data-anchor-name="first"><a href="https://example.test/shelters#first">First</a></li>
      <li class="nav-item"><a href="#second">Second</a></li>
      <li class="nav-item"><a href="#third">Third</a></li>
      <li class="nav-item"><a href="https://example.test/#second">Elsewhere</a></li>
      <li class="nav-item"><a href="#missing">Missing</a></li>
    </ul></div><section class="ntg-sidenav"><li class="active"><a href="/shelters">Shelters</a></li></section></main>`;
  const positions = [200, 500, 900];
  const headings = [...window.document.querySelectorAll("h2")];
  headings.forEach((heading, index) => {
    heading.getClientRects = () => heading.hidden ? [] : [{}];
    heading.getBoundingClientRect = () => ({ top: positions[index] });
  });
  const flush = () => new Promise((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)));
  try {
    await check(window, positions, flush);
  } finally {
    await window.happyDOM.close();
  }
}

test("selects the nearest heading above or below the top, not the last heading passed", async () => {
  await withMenu(async (window, positions, flush) => {
    initializeOnThisPage(window);
    await flush();
    const active = () => window.document.querySelector('[aria-current="location"]').hash;
    assert.equal(active(), "#first");
    positions.splice(0, 3, -200, 50, 500);
    window.dispatchEvent(new window.Event("scroll"));
    await flush();
    assert.equal(active(), "#second");
    positions.splice(0, 3, -500, -300, -20);
    window.dispatchEvent(new window.Event("scroll"));
    await flush();
    assert.equal(active(), "#third");
    positions.splice(0, 3, 20, 300, 600);
    window.dispatchEvent(new window.Event("scroll"));
    await flush();
    assert.equal(active(), "#first");
  });
});

test("ties follow heading order; hidden targets are skipped and all-hidden clears state", async () => {
  await withMenu(async (window, positions, flush) => {
    positions.splice(0, 3, -18, 50, 900);
    initializeOnThisPage(window);
    await flush();
    assert.equal(window.document.querySelector('[aria-current]').hash, "#first");
    window.document.querySelector("#first").hidden = true;
    window.dispatchEvent(new window.Event("resize"));
    await flush();
    assert.equal(window.document.querySelector('[aria-current]').hash, "#second");
    window.document.querySelectorAll("h2").forEach((heading) => heading.hidden = true);
    window.dispatchEvent(new window.Event("resize"));
    await flush();
    assert.equal(window.document.querySelectorAll('[aria-current]').length, 0);
  });
});

test("keeps destinations, focus and separate site-navigation state unchanged", async () => {
  await withMenu(async (window, positions, flush) => {
    const links = [...window.document.querySelectorAll("a")];
    const destinations = links.map((link) => link.getAttribute("href"));
    links[2].focus();
    initializeOnThisPage(window);
    initializeOnThisPage(window);
    await flush();
    assert.deepEqual(links.map((link) => link.getAttribute("href")), destinations);
    assert.equal(window.document.activeElement, links[2]);
    assert.equal(window.document.querySelectorAll('.ntg-inpage-nav .nav-item.active').length, 1);
    assert.ok(window.document.querySelector(".ntg-sidenav .active"));
    const event = new window.MouseEvent("click", { bubbles: true, cancelable: true });
    links[1].dispatchEvent(event);
    assert.equal(event.defaultPrevented, false);
    assert.equal(window.document.querySelector('.heading').classList.contains("active"), false);
  });
});

test("waits for legacy menu generation and reads subsequently inserted links", async () => {
  await withMenu(async (window, positions, flush) => {
    const list = window.document.querySelector('.ntg-inpage-nav');
    list.replaceChildren();
    initializeOnThisPage(window);
    await flush();
    assert.equal(window.document.querySelector('.ntg-on-this-page'), null);
    list.innerHTML = '<li class="nav-item"><a href="#second">Second</a></li>';
    await flush();
    assert.equal(window.document.querySelector('[aria-current]').hash, "#second");
    assert.ok(window.document.querySelector('.ntg-on-this-page'));
  });
});

test("content-page in-page menus are not enhanced or tracked", async () => {
  await withMenu(async (window, positions, flush) => {
    window.document.querySelector("main").removeAttribute("data-event-page");
    const menu = window.document.querySelector('[data-component="ntg-inpage-nav"]');
    const original = menu.outerHTML;
    initializeOnThisPage(window);
    positions.splice(0, 3, -200, 50, 500);
    window.dispatchEvent(new window.Event("scroll"));
    await flush();
    assert.equal(menu.outerHTML, original);
    assert.equal(window.document.querySelector(".ntg-on-this-page"), null);
    assert.equal(menu.querySelector("[aria-current]"), null);
  });
});

test("a page without an in-page menu is a no-op", async () => {
  const window = new Window();
  try {
    assert.doesNotThrow(() => initializeOnThisPage(window));
  } finally {
    await window.happyDOM.close();
  }
});