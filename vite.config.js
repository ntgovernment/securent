import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  build: {
    rollupOptions: {
      input: {
        page: "./SecureNT.html",
        theme: "./src/js/main.js",
      },
      output: {
        // theme entry outputs to dist/theme.js; other chunks to Fuel security_files/
        entryFileNames: (chunk) =>
          chunk.name === "theme" ? "theme.js" : "SecureNT_files/[name].js",
        chunkFileNames: "SecureNT_files/[name].js",
        // CSS goes to dist/ root for easy git file bridge referencing;
        // other assets keep their original subfolder.
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "print.css") {
            return "[name][extname]";
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
