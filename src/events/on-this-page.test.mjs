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
    const populate = (append = false) => {
      const markup = headings
        .map((heading) => `<li><a href="#${heading.id}">${heading.textContent}</a></li>`).join("");
      if (append) nav.querySelector("ul").insertAdjacentHTML("beforeend", markup);
      else nav.querySelector("ul").innerHTML = markup;
    };
    const flush = () => new Promise((resolve) => window.requestAnimationFrame(resolve));
    const scroll = async (tops, scrollY = 500) => {
      positions.splice(0, positions.length, ...tops);
      Object.defineProperty(window, "scrollY", { value: scrollY, configurable: true });
      window.dispatchEvent(new window.Event("scroll"));
      await flush();
    };
    await check({ window, nav, headings, populate, flush, scroll });
  } finally {
    await window.happyDOM.close();
  }
}

function addAccordion(window, id = "1659929", headerTag = "div") {
  const section = window.document.createElement("section");
  section.className = "accordion ntg-accordion";
  section.innerHTML = `
    <div class="accordion-item">
      <${headerTag} class="accordion-header" id="heading-${id}">
        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
          data-bs-target="#collapse-${id}" aria-expanded="false" aria-controls="collapse-${id}">
          Schools
        </button>
      </${headerTag}>
      <div id="collapse-${id}" class="accordion-collapse collapse" aria-labelledby="heading-${id}">
        <div class="accordion-body"><p>School opening information.</p></div>
      </div>
    </div>`;
  window.document.getElementById("second").before(section);
  const heading = section.querySelector(".accordion-header");
  const button = section.querySelector("button");
  const panel = section.querySelector(".accordion-collapse");
  heading.getClientRects = () => [{ top: 600 }];
  heading.getBoundingClientRect = () => ({ top: 600 });
  let clicks = 0;
  button.addEventListener("click", () => {
    clicks++;
    panel.classList.add("collapsing");
  });
  const finishOpening = () => {
    panel.classList.remove("collapsing");
    panel.classList.add("show");
    button.classList.remove("collapsed");
    button.setAttribute("aria-expanded", "true");
    panel.dispatchEvent(new window.Event("shown.bs.collapse", { bubbles: true }));
  };
  return { section, heading, button, panel, finishOpening, get clicks() { return clicks; } };
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

test("adds Latest update callout headings to event navigation in document order", async () => {
  await withPage(async ({ window, nav, headings, populate, flush }) => {
    const latestUpdate = window.document.createElement("section");
    latestUpdate.className = "ntg-callout__content latest-update";
    latestUpdate.innerHTML = '<div class="ntg-callout__text"><h3 id="latest-update-1659855">Latest update</h3></div>';
    const unrelatedHeading = window.document.createElement("h3");
    unrelatedHeading.id = "unrelated";
    unrelatedHeading.textContent = "Not in the side navigation";
    headings[0].before(latestUpdate, unrelatedHeading);
    const latestHeading = latestUpdate.querySelector("h3");
    latestHeading.getClientRects = () => [{ top: 200 }];
    latestHeading.getBoundingClientRect = () => ({ top: 200 });

    populate();
    initializeEventNavigation(window);
    await flush();

    const links = [...nav.querySelectorAll("a")];
    assert.deepEqual(links.map((link) => link.hash),
      ["#latest-update-1659855", "#first", "#second", "#last"]);
    assert.deepEqual(links.map((link) => link.textContent),
      ["Latest update", "First section", "Second section", "Last section"]);
    assert.equal(links[0].getAttribute("aria-current"), "location");
  });
});

test("tracks headings in both scroll directions and selects the last section at the page bottom", async () => {
  await withPage(async ({ window, nav, populate, flush, scroll }) => {
    populate();
    initializeEventNavigation(window);
    await flush();
    const links = [...nav.querySelectorAll("a")];
    links[0].focus();
    await scroll([-800, -0.625, 850]);
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

test("keeps a short section active until the next heading reaches the viewport top", async () => {
  await withPage(async ({ window, nav, populate, flush, scroll }) => {
    populate();
    initializeEventNavigation(window);
    await flush();
    const links = [...nav.querySelectorAll("a")];
    await scroll([-0.625, 110.5625, 325.75]);
    assert.equal(links[0].getAttribute("aria-current"), "location");
    await scroll([-111, -0.625, 214.5625]);
    assert.equal(links[1].getAttribute("aria-current"), "location");
    await scroll([-100, 10.375, 225.5625]);
    assert.equal(links[0].getAttribute("aria-current"), "location");
  });
});

test("gives repeated headings distinct anchor targets and highlights the matching occurrence", async () => {
  await withPage(async ({ window, nav, headings, populate, flush, scroll }) => {
    headings[1].id = "first";
    headings[2].id = "first-2";
    populate();
    initializeEventNavigation(window);
    await flush();
    const links = [...nav.querySelectorAll("a")];
    assert.deepEqual(headings.map((heading) => heading.id), ["first", "first-3", "first-2"]);
    assert.deepEqual(links.map((link) => link.hash), ["#first", "#first-3", "#first-2"]);
    await scroll([-800, 100, 850]);
    assert.equal(links[0].getAttribute("aria-current"), "location");
    await scroll([-900, 0, 750]);
    assert.equal(links[1].getAttribute("aria-current"), "location");
    assert.equal(nav.querySelectorAll(".active").length, 1);
    assert.equal(window.document.getElementById(links[1].hash.slice(1)), headings[1]);
  });
});

test("keeps a visible anchor destination selected when scrolling is clamped at the page bottom", async () => {
  await withPage(async ({ window, nav, populate, flush, scroll }) => {
    populate();
    initializeEventNavigation(window);
    await flush();
    const links = [...nav.querySelectorAll("a")];
    window.location.hash = "#second";
    await scroll([-500, 300, 600], 2200);
    assert.equal(links[1].getAttribute("aria-current"), "location");
    window.location.hash = "#first";
    await scroll([-500, 300, 600], 2200);
    assert.equal(links[2].getAttribute("aria-current"), "location");
  });
});

test("leaves navigation on other page types unchanged", async () => {
  await withPage(async ({ window, nav, populate, flush }) => {
    const accordion = addAccordion(window);
    window.location.hash = "#heading-1659929";
    populate();
    const original = nav.outerHTML;
    initializeEventNavigation(window);
    await flush();
    assert.equal(nav.outerHTML, original);
    assert.equal(accordion.clicks, 0);
  }, false);
});

test("adds DIV and H2 accordion titles in page order without duplicates after late legacy population", async () => {
  await withPage(async ({ window, nav, populate, flush }) => {
    const first = addAccordion(window);
    const second = addAccordion(window, "1659930", "h2");
    initializeEventNavigation(window);
    await flush();
    assert.equal(nav.querySelectorAll("a").length, 2);
    populate(true);
    await window.happyDOM.whenAsyncComplete();
    await flush();
    initializeEventNavigation(window);
    await flush();
    const links = [...nav.querySelectorAll("a")];
    assert.deepEqual(links.map((link) => link.hash),
      ["#first", "#heading-1659929", "#heading-1659930", "#second", "#last"]);
    assert.deepEqual(links.map((link) => link.textContent),
      ["First section", "Schools", "Schools", "Second section", "Last section"]);
    for (const accordion of [first, second]) {
      assert.equal(accordion.panel.getAttribute("aria-labelledby"), accordion.heading.id);
      assert.equal(accordion.button.getAttribute("data-bs-target"), `#${accordion.panel.id}`);
      assert.equal(accordion.button.getAttribute("aria-controls"), accordion.panel.id);
      assert.equal(accordion.clicks, 0);
    }
    window.dispatchEvent(new window.Event("resize"));
    await flush();
    assert.equal(nav.querySelectorAll("a").length, 5);
  });
});

test("opens only the selected accordion and realigns its heading after expansion", async () => {
  await withPage(async ({ window, nav, headings, populate, flush }) => {
    const accordion = addAccordion(window);
    const other = addAccordion(window, "1659930");
    populate();
    initializeEventNavigation(window);
    await flush();
    const link = nav.querySelector('a[href="#heading-1659929"]');
    let scrolls = 0;
    accordion.heading.scrollIntoView = () => {
      scrolls++;
      headings[0].getBoundingClientRect = () => ({ top: -300 });
      accordion.heading.getBoundingClientRect = () => ({ top: 0 });
    };
    link.focus();
    const modifiedClick = new window.MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true });
    modifiedClick.preventDefault();
    link.dispatchEvent(modifiedClick);
    assert.equal(accordion.clicks, 0, "does not expand the current page for a modified click");
    link.click();
    assert.equal(accordion.clicks, 1);
    assert.equal(other.clicks, 0);
    link.click();
    assert.equal(accordion.clicks, 1, "does not toggle a transitioning panel");
    window.location.hash = link.hash;
    accordion.finishOpening();
    await flush();
    assert.equal(scrolls, 1);
    assert.equal(link.getAttribute("aria-current"), "location");
    assert.equal(window.document.activeElement, link);
    link.click();
    await flush();
    assert.equal(accordion.clicks, 1, "does not close an already-open panel");
  });
});

test("opens accordion targets on initial hashes and subsequent hash changes", async () => {
  await withPage(async ({ window, populate, flush }) => {
    const first = addAccordion(window);
    const second = addAccordion(window, "1659930");
    first.heading.scrollIntoView = () => {};
    second.heading.scrollIntoView = () => {};
    window.location.hash = "#heading-1659929";
    populate();
    initializeEventNavigation(window);
    await flush();
    assert.equal(first.clicks, 1);
    assert.equal(second.clicks, 0);
    first.finishOpening();
    window.location.hash = "#heading-1659930";
    window.dispatchEvent(new window.HashChangeEvent("hashchange"));
    await flush();
    assert.equal(second.clicks, 1);
    second.finishOpening();
    window.location.hash = "#heading-1659929";
    window.dispatchEvent(new window.HashChangeEvent("hashchange"));
    await flush();
    assert.equal(first.clicks, 1);
  });
});

test("tracks accordion anchors against the visible viewport on mobile", async () => {
  await withPage(async ({ window, nav, headings, populate, flush }) => {
    const accordion = addAccordion(window);
    const viewport = Object.assign(new window.EventTarget(), { offsetTop: 89, height: 800 });
    Object.defineProperty(window, "visualViewport", { value: viewport });
    headings[0].getBoundingClientRect = () => ({ top: -0.8125 });
    accordion.heading.getBoundingClientRect = () => ({ top: 89.1875 });
    populate();
    initializeEventNavigation(window);
    await flush();
    const link = nav.querySelector('a[href="#heading-1659929"]');
    assert.equal(link.getAttribute("aria-current"), "location");
    viewport.offsetTop = 0;
    viewport.dispatchEvent(new window.Event("scroll"));
    await flush();
    assert.equal(nav.querySelector('[aria-current="location"]').hash, "#first");
    viewport.offsetTop = 89;
    viewport.dispatchEvent(new window.Event("resize"));
    await flush();
    assert.equal(link.getAttribute("aria-current"), "location");
  });
});

test("does not include warning summaries or unrelated Bootstrap accordion headers", async () => {
  await withPage(async ({ window, nav, populate, flush }) => {
    const accordion = addAccordion(window);
    accordion.section.classList.remove("ntg-accordion");
    accordion.section.insertAdjacentHTML("beforebegin", `
      <details class="warning-accordion"><summary>Warning summary</summary><p>Warning body</p></details>`);
    populate();
    initializeEventNavigation(window);
    await flush();
    assert.deepEqual([...nav.querySelectorAll("a")].map((link) => link.hash), ["#first", "#second", "#last"]);
    assert.equal(accordion.clicks, 0);
  });
});
