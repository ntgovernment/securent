import { defineConfig } from "vite";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { cloudflare } from "@cloudflare/vite-plugin";

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

const eventPreview = {
  name: "event-preview",
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const url = new URL(req.url, "http://localhost");
      const eventCapture = "Severe Storm \u2013 Alice Springs _ SecureNT.html";
      const capture =
        url.pathname === "/"
            ? "alerts-and-warnings.html"
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
      if (url.pathname.endsWith(".js.download")) {
        res.setHeader("Content-Type", "text/javascript");
      }
      next();
    });
  },
};

// Dev-only stand-in for the deployed proxy in src/local-conditions/worker.js.
const localConditionsMock = {
  name: "local-conditions-mock",
  configureServer(server) {
    server.middlewares.use("/api/local-conditions", (req, res) => {
      const key = new URL(req.url, "http://localhost").searchParams.get("location");
      const body = {
        location: key,
        updated: new Date().toISOString(),
        temperature: { min: 27, max: 32 },
        fireDanger: { label: "Moderate", level: 1 },
        airQuality: key === "darwin" ? { category: "Fair", pm25: 17, station: "Winnellie" } : null,
      };
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(body));
    });
  },
};

const includeLocalCapture =
  process.env.SECURENT_NO_LOCAL_CAPTURE !== "1" &&
  existsSync(new URL("./SecureNT.html", import.meta.url));

export default defineConfig({
  root: ".",
  plugins: [sourceThemeOnly, eventPreview, localConditionsMock, cloudflare()],
  build: {
    rollupOptions: {
      input: {
        ...(includeLocalCapture ? { page: "./SecureNT.html" } : {}),
        "alerts-listing": "./src/alerts-listing/alerts-listing.js",
        "alerts-pagination": "./src/alerts-listing/alerts-pagination.css",
        "more-updates-cards": "./src/alerts-listing/more-updates-cards.css",
        theme: "./src/js/main.js",
        "local-conditions": "./src/local-conditions/local-conditions.js",
      },
      output: {
        // theme entry outputs to dist/theme.js; other chunks to Fuel security_files/
        entryFileNames: (chunk) =>
          chunk.name === "theme" ||
          chunk.name === "alerts-listing" ||
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
          if (assetInfo.name === "alerts-pagination.css") {
            return "alerts-pagination.css";
          }
          if (assetInfo.name === "more-updates-cards.css") {
            return "more-updates-cards.css";
          }
          if (assetInfo.name === "alerts-listing.css") {
            return "alerts-listing.css";
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