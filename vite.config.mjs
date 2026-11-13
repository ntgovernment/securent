import { defineConfig } from "vite";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { cloudflare } from "@cloudflare/vite-plugin";
import { fetchAirQuality, fetchAirQualityStations } from "./src/local-conditions/air-quality.mjs";
import { FIRE_AREA_CODES, readFireDanger } from "./src/local-conditions/fire-danger.mjs";
import { latestMediaReleaseEndpoint, mediaReleaseSources } from "./src/media-releases/feeds.mjs";

const sourceThemeOnly = {
  name: "source-theme-only",
  apply: "build",
  load(id) {
    const stylesheet = fileURLToPath(new URL("./dist/theme.css", import.meta.url));
    if (id.split("?")[0] === stylesheet.replaceAll("\\", "/")) {
      return "";
    }
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

const eventPreview = {
  name: "event-preview",
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const url = new URL(req.url, "http://localhost");
      const eventCapture = "Severe Storm \u2013 Alice Springs _ SecureNT.html";
      const capture =
        url.pathname === "/"
            ? "Current warnings _ SecureNT.html"
          : url.pathname === "/" + encodeURIComponent(eventCapture)
            ? eventCapture
            : null;
      if (
        capture &&
        (req.method === "GET" || req.method === "HEAD") &&
        (url.pathname === "/" ||
          url.pathname === "/" + encodeURIComponent(eventCapture))
      ) {
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
      const areaCode = FIRE_AREA_CODES[key];
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
        const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error(`Feed request failed (${response.status})`);
        res.statusCode = response.status;
        res.end(JSON.stringify(await response.json()));
      } catch (error) {
        console.warn(`Local media-release feed failed (${sourceId}):`, error.message);
        res.statusCode = 502;
        res.end(JSON.stringify({ error: "Feed is unavailable" }));
      }
    });
  },
};

const includeLocalCapture =
  process.env.SECURENT_NO_LOCAL_CAPTURE !== "1" &&
  existsSync(new URL("./SecureNT.html", import.meta.url));

export default defineConfig({
  root: ".",
  plugins: [
    sourceThemeOnly,
    excludeLocalCapturePhotos,
    eventPreview,
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
        "theme-styles": "./src/css/main.css",
        "event-styles": "./src/events/event.css",
        "social-share-styles": "./src/social-share/social-share.css",
        "social-share": "./src/social-share/social-share.js",
        theme: "./src/js/main.js",
        "local-conditions": "./src/local-conditions/local-conditions.js",
      },
      output: {
        // Standalone feature entries go to dist/; shared chunks go to SecureNT_files/.
        entryFileNames: (chunk) =>
          chunk.name === "theme" ||
          chunk.name === "alerts-listing" ||
          chunk.name === "media-releases" ||
          chunk.name === "latest-media-releases" ||
          chunk.name === "social-share" ||
          chunk.name === "local-conditions"
            ? "[name].js"
            : "SecureNT_files/[name].js",
        chunkFileNames: "SecureNT_files/[name].js",
        // CSS goes to dist/ root for easy git file bridge referencing;
        // other assets keep their original subfolder.
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
          if (assetInfo.name === "alerts-listing.css") {
            return "alerts-listing.css";
          }
          if (assetInfo.name === "media-releases.css") {
            return "media-releases.css";
          }
          if (assetInfo.name && assetInfo.name.endsWith(".css")) {
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