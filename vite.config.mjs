import { defineConfig } from "vite";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { cloudflare } from "@cloudflare/vite-plugin";
import { SECURENT_BASE_URL } from "./src/config/site-url.mjs";
import { fetchAirQuality, fetchAirQualityStations } from "./src/local-conditions/air-quality.mjs";
import {
  FIRE_AREA_CODES,
  FIRE_AREA_CODE_VALUES,
  readFireDanger,
} from "./src/local-conditions/fire-danger.mjs";
import {
  latestMediaReleaseEndpoint, mappedWarningsEndpoint, mediaReleaseSources,
} from "./src/media-releases/feeds.mjs";
import { randomizePreviewWarnings } from "./src/media-releases/preview-warnings.mjs";

const sourceThemePreview = {
  name: "source-theme-preview",
  apply: "serve",
  transformIndexHtml: {
    order: "pre",
    handler(html) {
      return html
        .replace(
          /href=(["'])(?:\.\/|\/)dist\/theme\.css(?:\?[^"']*)?\1/g,
          'href="/src/css/main.css"',
        )
        .replace(
          /src=(["'])(?:\.\/|\/)dist\/(latest-media-releases|media-releases)\.js(?:\?[^"']*)?\1/g,
          'src="/src/media-releases/$2.js"',
        );
    },
  },
};

const sourceThemeOnly = {
  name: "source-theme-only",
  apply: "build",
  transformIndexHtml: {
    order: "pre",
    handler(html) {
      return html.replace('href="./dist/theme.css"', 'href="/theme.css"');
    },
  },
  load(id) {
    const stylesheet = fileURLToPath(new URL("./dist/theme.css", import.meta.url)).replaceAll("\\", "/");
    const moduleId = decodeURI(id.split("?")[0])
      .replaceAll("\\", "/")
      .replace(/^\/([A-Za-z]:\/)/, "$1");
    if (moduleId.toLowerCase() === stylesheet.toLowerCase()) {
      return "";
    }
  },
};

const resolveNtgLogoPath = {
  name: "resolve-ntg-logo-path",
  enforce: "pre",
  transform(code, id) {
    const stylesheetId = id.split("?")[0].replaceAll("\\", "/");
    const assetPath = "mysource_files/ntg-primary-mono.svg";
    if (!stylesheetId.endsWith("/ntgbase.min.css") || !code.includes(assetPath)) return null;
    return code.replaceAll(assetPath, `/${assetPath}`);
  },
};

const excludeLocalCapturePhotos = {
  name: "exclude-local-capture-photos",
  apply: "build",
  transformIndexHtml: {
    order: "pre",
    handler(html) {
      return html.replace(
        / style="background: url\('\.\/SecureNT_files\/(?:bushfires-nt|bush-curlews)\.webp'\) no-repeat center \/ cover;"/g,
        "",
      );
    },
  },
};

let capturedPopperSourcePromise;

function getCapturedPopperSourceWithoutMap() {
  if (!capturedPopperSourcePromise) {
    capturedPopperSourcePromise = readFile(new URL("./SecureNT_files/popper.min.js.download", import.meta.url))
      .then((source) => Buffer.from(
        source.toString("utf8").replace(/\r?\n?\/\/# sourceMappingURL=popper\.min\.js\.map\s*$/, ""),
      ));
  }
  return capturedPopperSourcePromise;
}

const cleanCapturedPopperSourceMap = {
  name: "clean-captured-popper-source-map",
  apply: "serve",
  transformIndexHtml: {
    order: "pre",
    async handler(html) {
      const sourceAttribute = 'src="./SecureNT_files/popper.min.js.download"';
      if (!html.includes(sourceAttribute)) return html;
      const source = await getCapturedPopperSourceWithoutMap();
      const integrity = createHash("sha384").update(source).digest("base64");
      const rewritten = html.replace(
        /src="\.\/SecureNT_files\/popper\.min\.js\.download" integrity="[^"]+"/,
        `src="/__vite-preview/popper.min.js" integrity="sha384-${integrity}"`,
      );
      if (rewritten === html) throw new Error("Unable to rewrite the captured Popper script tag");
      return rewritten;
    },
  },
  configureServer(server) {
    server.middlewares.use("/__vite-preview/popper.min.js", async (req, res, next) => {
      if (req.method !== "GET" && req.method !== "HEAD") {
        next();
        return;
      }
      try {
        const source = await getCapturedPopperSourceWithoutMap();
        res.setHeader("Content-Type", "text/javascript; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        res.end(req.method === "HEAD" ? undefined : source);
      } catch (error) {
        next(error);
      }
    });
  },
};

const includeLocalCapture =
  process.env.SECURENT_NO_LOCAL_CAPTURE !== "1" &&
  existsSync(new URL("./SecureNT.html", import.meta.url));

const pagePreview = {
  name: "page-preview",
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const url = new URL(req.url, "http://localhost");
      const homepageCapture = "SecureNT.html";
      const currentWarningsCapture = "Current warnings _ SecureNT.html";
      const eventCapture = "Severe Storm \u2013 Alice Springs _ SecureNT.html";
      const captures = new Map([
        ["/", homepageCapture],
        ["/" + encodeURIComponent(currentWarningsCapture), currentWarningsCapture],
        ["/" + encodeURIComponent(eventCapture), eventCapture],
      ]);
      if (includeLocalCapture) {
        captures.set("/" + encodeURIComponent(homepageCapture), homepageCapture);
      }
      const capture = captures.get(url.pathname);
      if (capture && (req.method === "GET" || req.method === "HEAD")) {
        try {
          const source = await readFile(new URL(capture, import.meta.url), "utf8");
          const html = await server.transformIndexHtml(url.pathname, source);
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(req.method === "HEAD" ? undefined : html);
        } catch (error) {
          next(error);
        }
        return;
      }
      next();
    });
  },
};

// Dev-only stand-in for the deployed proxy in src/local-conditions/worker.js.
const localConditionsMock = {
  name: "local-conditions-mock",
  configureServer(server) {
    server.middlewares.use("/api/air-quality", async (req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-store");
      if (req.method !== "GET") {
        res.statusCode = 405;
        res.setHeader("Allow", "GET");
        res.end(JSON.stringify({ error: "Method not allowed" }));
        return;
      }
      const id = new URL(req.url, "http://localhost").searchParams.get("id");
      try {
        res.end(JSON.stringify(id === null
          ? { stations: await fetchAirQualityStations() }
          : await fetchAirQuality(id)));
      } catch (error) {
        console.warn("Local EPA request failed:", error.message);
        res.statusCode = error instanceof RangeError ? 400 : 502;
        res.end(JSON.stringify({ error: res.statusCode === 400
          ? "Invalid EPA station ID" : "Air-quality data is unavailable" }));
      }
    });
    server.middlewares.use("/api/local-conditions", async (req, res) => {
      const key = new URL(req.url, "http://localhost").searchParams.get("location");
      const areaCode = FIRE_AREA_CODES[key] ||
        (FIRE_AREA_CODE_VALUES.includes(key) ? key : null);
      if (!areaCode) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Unknown location" }));
        return;
      }
      let fireDanger = null;
      try {
        const fixture = await readFile(new URL("./public/fire-danger-ratings.json", import.meta.url), "utf8");
        fireDanger = readFireDanger(JSON.parse(fixture), areaCode);
      } catch (error) {
        console.warn("Local fire-danger fixture failed:", error.message);
      }
      const body = {
        location: key,
        updated: new Date().toISOString(),
        temperature: { min: 27, max: 32 },
        fireDanger,
      };
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(body));
    });
  },
};

const mediaReleaseFeedProxy = {
  name: "media-release-feed-proxy",
  configureServer(server) {
    const feeds = new Map(mediaReleaseSources.map((source) => [source.id, source.endpoint]));
    feeds.set("latest", latestMediaReleaseEndpoint);
    feeds.set("mapped-warnings", mappedWarningsEndpoint);

    server.middlewares.use("/api/media-releases", async (req, res) => {
      const sourceId = new URL(req.url, "http://localhost").pathname.replace(/^\//, "");
      const endpoint = feeds.get(sourceId);
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      if (req.method !== "GET" || !endpoint) {
        res.statusCode = req.method === "GET" ? 404 : 405;
        res.setHeader("Allow", "GET");
        res.end(JSON.stringify({ error: "Feed is unavailable" }));
        return;
      }

      try {
        let payload;
        if (sourceId === "latest") {
          payload = JSON.parse(await readFile(new URL("./src/media-releases/latest-warnings.preview.json", import.meta.url), "utf8"));
          if (!Array.isArray(payload)) throw new TypeError("Local warning preview must be an array");
          payload = randomizePreviewWarnings(payload);
        } else if (sourceId === "mapped-warnings") {
          payload = JSON.parse(await readFile(new URL("./src/media-releases/mapped-warnings.preview.json", import.meta.url), "utf8"));
          if (!Array.isArray(payload)) throw new TypeError("Local mapped warnings preview must be an array");
        } else {
          const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
          if (!response.ok) throw new Error(`Feed request failed (${response.status})`);
          res.statusCode = response.status;
          payload = await response.json();
        }
        res.end(JSON.stringify(payload));
      } catch (error) {
        console.warn(`Local media-release feed failed (${sourceId}):`, error.message);
        res.statusCode = 502;
        res.end(JSON.stringify({ error: "Feed is unavailable" }));
      }
    });
  },
};

export default defineConfig({
  root: ".",
  define: {
    __SECURENT_BASE_URL__: JSON.stringify(SECURENT_BASE_URL),
  },
  plugins: [
    sourceThemePreview,
    sourceThemeOnly,
    resolveNtgLogoPath,
    excludeLocalCapturePhotos,
    cleanCapturedPopperSourceMap,
    pagePreview,
    localConditionsMock,
    mediaReleaseFeedProxy,
    cloudflare(),
  ],
  build: {
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        ...(includeLocalCapture ? { page: "./SecureNT.html" } : {}),
        "alerts-listing": "./src/alerts-listing/alerts-listing.js",
        "media-releases": "./src/media-releases/media-releases.js",
        "latest-media-releases": "./src/media-releases/latest-media-releases.js",
        pagination: "./src/pagination/pagination.css",
        "more-updates-cards": "./src/alerts-listing/more-updates-cards.css",
        "warning-accordion": "./src/css/components/warning-accordion.css",
        "link-group-grid": "./src/css/components/link-group-grid.css",
        "theme-styles": "./src/css/main.css",
        "event-styles": "./src/events/event.css",
        "social-share-styles": "./src/social-share/social-share.css",
        "social-share": "./src/social-share/social-share.js",
        "search-results": "./src/search/results-entry.ts",
        theme: "./src/js/main.js",
        "local-conditions": "./src/local-conditions/local-conditions.js",
      },
      output: {
        // The CMS also loads this bundle as a classic script alongside jQuery.
        intro: (chunk) => chunk.name === "theme" ? "(() => {" : "",
        outro: (chunk) => chunk.name === "theme" ? "})();" : "",
        manualChunks(id) {
          const moduleId = id.replaceAll("\\", "/");
          if ([
            "/src/config/site-url.mjs",
            "/src/search/autocomplete.mjs",
            "/src/alerts-listing/sorting.mjs",
          ].some((path) => moduleId.endsWith(path))) {
            return "autocomplete";
          }
        },
        // Standalone feature entries go to dist/; shared chunks go to SecureNT_files/.
        entryFileNames: (chunk) =>
          chunk.name === "theme" ||
          chunk.name === "alerts-listing" ||
          chunk.name === "media-releases" ||
          chunk.name === "latest-media-releases" ||
          chunk.name === "social-share" ||
          chunk.name === "search-results" ||
          chunk.name === "local-conditions"
            ? "[name].js"
            : "SecureNT_files/[name].js",
        chunkFileNames: "SecureNT_files/[name].js",
        // Feature CSS stays in dist/ for the git file bridge; capture-only assets stay under SecureNT_files/.
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "print.css") {
            return "[name][extname]";
          }
          if (assetInfo.name === "local-conditions.css") {
            return "local-conditions.css";
          }
          if (assetInfo.name === "event-styles.css") {
            return "event.css";
          }
          if (assetInfo.name === "social-share-styles.css") {
            return "social-share.css";
          }
          if (assetInfo.name === "pagination.css") {
            return "pagination.css";
          }
          if (assetInfo.name === "more-updates-cards.css") {
            return "more-updates-cards.css";
          }
          if (assetInfo.name === "warning-accordion.css") {
            return "warning-accordion.css";
          }
          if (assetInfo.name === "link-group-grid.css") {
            return "link-group-grid.css";
          }
          if (assetInfo.name === "alerts-listing.css") {
            return "alerts-listing.css";
          }
          if (assetInfo.name === "media-releases.css") {
            return "media-releases.css";
          }
          if (assetInfo.name === "theme-styles.css") {
            return "theme.css";
          }
          return "SecureNT_files/[name][extname]";
        },
      },
    },
  },
  server: {
    open: "/",
  },
});