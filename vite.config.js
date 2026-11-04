import { defineConfig } from "vite";

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

export default defineConfig({
  root: ".",
  plugins: [localConditionsMock],
  build: {
    rollupOptions: {
      input: {
        page: "./SecureNT.html",
        theme: "./src/js/main.js",
        "local-conditions": "./src/local-conditions/local-conditions.js",
      },
      output: {
        // theme entry outputs to dist/theme.js; other chunks to Fuel security_files/
        entryFileNames: (chunk) =>
          chunk.name === "theme" || chunk.name === "local-conditions"
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
          if (assetInfo.name && assetInfo.name.endsWith(".css")) {
            return "theme.css";
          }
          return "SecureNT_files/[name][extname]";
        },
      },
    },
  },
  server: {
    open: "./SecureNT.html",
  },
});
