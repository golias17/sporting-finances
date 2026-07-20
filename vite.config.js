import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import viteCompression from "vite-plugin-compression";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
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
    environment: "jsdom",
    setupFiles: ["./tests/setup.js"],
    coverage: {
      // A conservative starting floor, not a precisely-tuned target —
      // `vitest run --coverage` can't complete inside some sandboxed dev
      // environments used on this project (it times out before finishing),
      // so these numbers weren't set against a real measured baseline.
      // They're deliberately low enough that the current suite (290+
      // tests as of this change) should clear them comfortably; the goal
      // is catching an actual regression — e.g. a large deletion of tests,
      // or a big new untested file — not enforcing a tight target. Once a
      // real coverage report is available (CI runs `npm test` with
      // --coverage on every push), raise these to sit just below the
      // actual measured numbers.
      thresholds: {
        statements: 50,
        branches: 50,
        functions: 50,
        lines: 50,
      },
    },
  },
});
