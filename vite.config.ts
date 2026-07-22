/// <reference types="vitest" />
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import viteCompression from "vite-plugin-compression";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // includeAssets is not needed — globPatterns below already captures all
      // svg, png, and json files from the dist output, including icons and LOGO.
      manifest: {
        name: "Sporting Finances",
        short_name: "SCP Finance",
        description:
          "An interactive financial dashboard for Sporting Clube de Portugal",
        theme_color: "#0a5d3a",
        background_color: "#0a5d3a",
        display: "standalone",
        start_url: ".",
        icons: [
          {
            src: "assets/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            // 'any' and 'maskable' must be separate entries — combining them
            // causes padding issues on platforms that apply maskable cropping.
            src: "assets/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "assets/maskable-icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        screenshots: [
          {
            src: "assets/screenshot-desktop.png",
            sizes: "2560x1600",
            type: "image/png",
            form_factor: "wide",
            label: "Sporting Finances — desktop dashboard",
          },
          {
            src: "assets/screenshot-mobile.png",
            sizes: "780x1687",
            type: "image/png",
            form_factor: "narrow",
            label: "Sporting Finances — mobile view",
          },
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ["**/*.{js,css,html,svg,png,json}"],
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024, // 15 MiB to support high-res images
      },
    }),
    viteCompression({ algorithm: "brotliCompress", ext: ".br" }),
    viteCompression({ algorithm: "gzip", ext: ".gz" }),
    {
      name: "generate-pt-html",
      writeBundle() {
        const distDir = path.resolve(__dirname, "dist");
        const indexPath = path.join(distDir, "index.html");
        const ptPath = path.join(distDir, "index_pt.html");
        if (fs.existsSync(indexPath)) {
          let html = fs.readFileSync(indexPath, "utf-8");
          html = html.replace('<html lang="en">', '<html lang="pt">');
          fs.writeFileSync(ptPath, html);
        }
      },
    },
  ],
  build: {
    // es2022 matches the ecmaVersion in eslint.config.mjs and removes the need
    // for the browserslist field in package.json (which was targeting a much
    // wider audience and could conflict with this setting).
    target: "es2022",
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.js"],
    exclude: ["node_modules", "dist", ".idea", ".git", ".cache", "tests/e2e/**"],
    coverage: {
      // chartUtils.js is a pure `export * from "./x.js"` re-export barrel
      // (see its own header comment) with no logic of its own — every
      // symbol it surfaces is fully covered via the source files it
      // re-exports from (chartPalette.js, chartAnnotations.js,
      // chartWidgets.js, chartDefaults.js, all otherwise at/near 100%) and
      // via chartUtils.test.js's own "re-export barrel" suite, which
      // imports and asserts on every symbol through this exact file.
      // Despite that, @vitest/coverage-v8 reports it at a flat 0% across
      // every metric: native ESM `export * from` declarations are resolved
      // during module linking rather than as instrumentable executed
      // statements, so V8's coverage collector never records a hit on them
      // even though the linkage unquestionably runs on every test that
      // imports through this file. Excluded so that reports don't misread
      // this as an actual untested file.
      exclude: ["src/charts/chartUtils.ts"],
      // A starting floor set against a real measured baseline (see the
      // coverage report below), not a precisely-tuned target — kept with
      // headroom under the actual numbers so normal day-to-day variance
      // doesn't trip it, while still catching a real regression (a large
      // deletion of tests, or a big new untested file).
      //
      //   All files   93.08% stmts | 81.36% branch | 91.08% funcs | 94.79% lines
      //
      // `vitest run --coverage` still can't complete inside some sandboxed
      // dev environments used on this project (it times out before
      // finishing) — this baseline came from a real run outside that
      // constraint. Re-raise these again the next time a full report is
      // available and coverage has meaningfully improved.
      thresholds: {
        statements: 85,
        branches: 72,
        functions: 82,
        lines: 87,
      },
  },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom"))
              return "react";
            if (id.includes("chart.js") || id.includes("react-chartjs-2"))
              return "chartjs";
            return "vendor";
          }
        },
      },
    },
  },
});
