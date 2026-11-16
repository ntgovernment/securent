import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { initializeSearchResults } from "./results.ts";

const origin = "https://example.test";
const root = `${origin}/securent`;

function result(path, title, raw = {}) {
  return {
    clickUri: `${root}/${path}`,
    title,
    raw: { dctitle: title, sysfiletype: "html", dcmodified: 1794789383000, ...raw },
  };
}

async function withSearch(check) {
  const window = new Window({ url: `${root}/search?query=warnings` });
  const document = window.document;
  document.body.innerHTML = `
    <main id="content">
      <form name="securent-search-form"></form>
      <div class="search-user-message">Showing results</div>
      <ul id="search-results-list"></ul><div class="sync-pagination"></div>
    </main>
    <div id="search-result-template"><li class="search-template"></li></div>`;
  const list = document.querySelector("#search-results-list");
  const calls = [];
  const warnings = [];
  window.console.warn = (...args) => warnings.push(args);
  window.fetch = async () => { throw new Error("Unexpected breadcrumb lookup"); };
  window.ntgCOVEO = {
    defaults: { endpointURL: `${root}/_design/query/_nocache`, scopeID: "19409", paginationPerPage: 200 },
    searchresults: { all: [] },
    renderResults(...args) {
      calls.push({ receiver: this, args });
      for (const [index, item] of this.searchresults.all.entries()) {
        const card = document.createElement("li");
        card.setAttribute("data-filetype", item.raw.sysfiletype);
        card.setAttribute("data-page", String(Math.ceil((index + 1) / this.defaults.paginationPerPage)));
        card.innerHTML = `
          <h3 class="search-title"><a data-ref="search-result-title"></a></h3>
          <div class="d-flex"><span data-ref="search-result-icon"></span>
            <span data-ref="search-result-filetype">Document</span>
            <span data-ref="search-result-date">Old date</span></div>
          <div class="search-description">Existing description</div>`;
        const link = card.querySelector("a");
        link.href = item.clickUri;
        link.textContent = item.title;
        list.append(card);
      }
      return "original-return";
    },
  };
  const render = (items) => {
    list.replaceChildren();
    window.ntgCOVEO.searchresults.all = items;
    const returned = window.ntgCOVEO.renderResults("argument");
    window.ntgCOVEO.searchresults.all = [];
    return returned;
  };
  const flush = () => window.happyDOM.whenAsyncComplete();
  try {
    await check({ window, document, list, calls, warnings, render, flush });
  } finally {
    await window.happyDOM.close();
  }
}

test("adds title-based ancestors and bottom dates while preserving the original renderer and result attributes", async () => {
  await withSearch(async ({ window, document, list, calls, render }) => {
    initializeSearchResults(window);
    initializeSearchResults(window);
    const returned = render([
      result("prepare", "Prepare for an emergency"),
      result("prepare/cyclone", "Cyclones & storms"),
      result("prepare/cyclone/shelter?tracking=1#heading", "Where to shelter"),
    ]);
    assert.equal(returned, "original-return");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].receiver, window.ntgCOVEO);
    assert.deepEqual(calls[0].args, ["argument"]);
    const card = list.lastElementChild;
    assert.deepEqual([...card.querySelectorAll("nav li")].map((node) => node.textContent),
      ["SecureNT", "Prepare for an emergency", "Cyclones & storms"]);
    assert.equal(card.querySelector("a").href, `${root}/prepare/cyclone/shelter?tracking=1#heading`);
    assert.deepEqual([...card.children].map((node) => node.tagName), ["H3", "NAV", "DIV", "DIV"]);
    assert.equal(card.lastElementChild.className, "search-result__metadata");
    assert.match(card.querySelector("time").textContent, /^Last updated: 16 November 2026$/);
    assert.equal(card.querySelector("time").dateTime, new Date(1794789383000).toISOString());
    assert.equal(card.querySelector("[data-ref=search-result-icon]"), null);
    assert.equal(card.querySelector("[data-ref=search-result-filetype]"), null);
    assert.equal(card.querySelector(".search-description").textContent, "Existing description");
    assert.equal(card.dataset.filetype, "html");
    assert.equal(card.dataset.page, "1");
    assert.equal(window.ntgCOVEO.defaults.paginationPerPage, 200);
    assert.equal(document.querySelector(".sync-pagination").childElementCount, 0);
    assert.equal(document.querySelectorAll(".search-template").length, 1);
  });
});

test("fetches missing parent titles once and reuses them after results are reset or filtered", async () => {
  await withSearch(async ({ window, list, render, flush }) => {
    const urls = [];
    window.fetch = async (url) => {
      urls.push(new URL(url));
      return { ok: true, json: async () => ({ results: [result("prepare", "Prepare safely")] }) };
    };
    initializeSearchResults(window);
    render([result("prepare/cyclone", "Cyclone")]);
    await flush();
    assert.deepEqual([...list.querySelectorAll("nav li")].map((node) => node.textContent),
      ["SecureNT", "Prepare safely"]);
    render([result("prepare/storm", "Storm")]);
    await flush();
    assert.equal(urls.length, 1);
    assert.equal(urls[0].origin, origin);
    assert.equal(urls[0].searchParams.get("scope"), "19409");
    assert.equal(urls[0].searchParams.get("searchterm"), "");
    assert.equal(list.querySelectorAll(".search-result__breadcrumbs").length, 1);
    assert.equal(list.querySelectorAll(".search-result__metadata").length, 1);
  });
});

test("omits unresolved segments, does not invent slug labels, and treats JSON titles as text", async () => {
  await withSearch(async ({ window, list, render, flush }) => {
    window.fetch = async () => ({ ok: true, json: async () => ({
      results: [result("prepare", "<img src=x onerror=alert(1)>")],
    }) });
    initializeSearchResults(window);
    render([result("prepare/missing-parent/child", "Child")]);
    await flush();
    assert.deepEqual([...list.querySelectorAll("nav li")].map((node) => node.textContent),
      ["SecureNT", "<img src=x onerror=alert(1)>"]);
    assert.equal(list.querySelector("nav img"), null);
    assert.doesNotMatch(list.querySelector("nav").textContent, /missing-parent/);
  });
});

test("keeps document type metadata and omits missing or invalid dates", async () => {
  await withSearch(async ({ window, list, warnings, render }) => {
    initializeSearchResults(window);
    render([
      result("guide.pdf", "Guide", { sysfiletype: "pdf", sysdate: "2026-03-14T00:00:00Z" }),
      result("missing-date", "No date", { dcmodified: undefined }),
      result("invalid-date", "Bad date", { dcmodified: "not-a-date" }),
      result("null-date", "No date supplied", { dcmodified: null }),
    ]);
    assert.equal(list.children[0].querySelector("[data-ref=search-result-filetype]").textContent, "Document");
    assert.match(list.children[0].querySelector("time").textContent, /14 March 2026/);
    assert.equal(list.children[1].querySelector(".search-result__metadata"), null);
    assert.equal(list.children[2].querySelector("time"), null);
    assert.equal(list.children[3].querySelector(".search-result__metadata"), null);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0][0], /invalid updated date/);
  });
});

test("reports lookup failures without blocking results or retrying for every card", async () => {
  for (const response of [
    { ok: false, status: 503 },
    { ok: true, json: async () => ({ unexpected: [] }) },
  ]) {
    await withSearch(async ({ window, document, list, warnings, render, flush }) => {
      let requests = 0;
      window.fetch = async () => { requests++; return response; };
      initializeSearchResults(window);
      render([result("prepare/child", "Child")]);
      await flush();
      assert.equal(list.querySelector("h3").textContent, "Child");
      assert.match(document.querySelector('[role="status"]').textContent, /results are still available/);
      assert.equal(warnings.length, 1);
      render([result("other/child", "Other child")]);
      await flush();
      assert.equal(requests, 1);
      assert.equal(document.querySelectorAll('[role="status"]').length, 1);
    });
  }
});

test("a completed lookup cannot alter detached cards or overwrite a later search", async () => {
  await withSearch(async ({ window, list, render, flush }) => {
    let finish;
    window.fetch = () => new Promise((resolve) => { finish = resolve; });
    initializeSearchResults(window);
    render([result("prepare/old", "Old")]);
    const detached = list.firstElementChild;
    render([result("latest", "Latest")]);
    finish({ ok: true, json: async () => ({ results: [result("prepare", "Prepare safely")] }) });
    await flush();
    assert.equal(detached.querySelector("nav").textContent, "SecureNT");
    assert.equal(list.querySelector("h3").textContent, "Latest");
    assert.equal(list.querySelector("nav").textContent, "SecureNT");
    assert.equal(list.querySelectorAll("time").length, 1);
  });
});

test("leaves unrelated pages unchanged and rejects missing controller integration on search pages", async () => {
  const window = new Window({ url: origin });
  try {
    window.document.body.innerHTML = "<main><h1>Home</h1></main>";
    const before = window.document.body.innerHTML;
    initializeSearchResults(window);
    assert.equal(window.document.body.innerHTML, before);
    window.document.querySelector("main").innerHTML = '<ul id="search-results-list"></ul>';
    assert.throws(() => initializeSearchResults(window), /after the Coveo controller/);
  } finally {
    await window.happyDOM.close();
  }
});
