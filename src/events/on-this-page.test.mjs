import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { initializeEventNavigation } from "./on-this-page.ts";

async function withPage(check, eventPage = true) {
  const window = new Window({ width: 1280, height: 800, url: "https://example.test/event" });
  try {
    window.document.body.innerHTML = `
      <main ${eventPage ? "data-event-page" : ""}>
        <h2 id="first">First section</h2>
        <h2 id="second">Second section</h2>
        <h2 id="last">Last section</h2>
        <div data-component="ntg-inpage-nav"><ul class="ntg-inpage-nav"></ul></div>
      </main>`;
    const headings = [...window.document.querySelectorAll("h2")];
    const positions = [300, 1000, 1700];
    headings.forEach((heading, index) => {
      heading.getBoundingClientRect = () => ({ top: positions[index] });
      heading.getClientRects = () => [{ top: positions[index] }];
    });
    Object.defineProperty(window.document.documentElement, "scrollHeight", { value: 3000 });
    const nav = window.document.querySelector('[data-component="ntg-inpage-nav"]');
    const populate = () => {
      nav.querySelector("ul").innerHTML = headings
        .map((heading) => `<li><a href="#${heading.id}">${heading.textContent}</a></li>`).join("");
    };
    const flush = () => new Promise((resolve) => window.requestAnimationFrame(resolve));
    const scroll = async (tops, scrollY = 500) => {
      positions.splice(0, positions.length, ...tops);
      Object.defineProperty(window, "scrollY", { value: scrollY, configurable: true });
      window.dispatchEvent(new window.Event("scroll"));
      await flush();
    };
    await check({ window, nav, populate, flush, scroll });
  } finally {
    await window.happyDOM.close();
  }
}

test("enhances event navigation after the legacy script populates links, without duplicating them", async () => {
  await withPage(async ({ window, nav, populate, flush }) => {
    initializeEventNavigation(window);
    initializeEventNavigation(window);
    assert.ok(nav.classList.contains("ntg-on-this-page"));
    assert.equal(nav.getAttribute("role"), "navigation");
    populate();
    await window.happyDOM.whenAsyncComplete();
    await flush();
    assert.equal(nav.querySelectorAll("a").length, 3);
    assert.equal(nav.querySelector('[aria-current="location"]').hash, "#first");
  });
});

test("tracks headings in both scroll directions and selects the last section at the page bottom", async () => {
  await withPage(async ({ window, nav, populate, flush, scroll }) => {
    populate();
    initializeEventNavigation(window);
    await flush();
    const links = [...nav.querySelectorAll("a")];
    links[0].focus();
    await scroll([-800, 150, 850]);
    assert.deepEqual(links.map((link) => link.classList.contains("active")), [false, true, false]);
    assert.equal(links[1].getAttribute("aria-current"), "location");
    assert.equal(links[0].hasAttribute("aria-current"), false);
    assert.equal(window.document.activeElement, links[0]);
    await scroll([-1400, -500, 600], 2200);
    assert.equal(links[2].getAttribute("aria-current"), "location");
    await scroll([-800, 250, 950]);
    assert.equal(links[0].getAttribute("aria-current"), "location");
    await scroll([1000, 1800, 2500], 0);
    assert.equal(nav.querySelectorAll(".active, [aria-current]").length, 0);
  });
});

test("leaves navigation on other page types unchanged", async () => {
  await withPage(async ({ window, nav, populate, flush }) => {
    populate();
    const original = nav.outerHTML;
    initializeEventNavigation(window);
    await flush();
    assert.equal(nav.outerHTML, original);
  }, false);
});
