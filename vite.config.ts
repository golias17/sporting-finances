/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
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
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules")) {
            if (
              id.includes("jspdf") ||
              id.includes("jspdf-autotable") ||
              id.includes("canvg") ||
              id.includes("html2canvas") ||
              id.includes("fflate") ||
              id.includes("dompurify")
            ) {
              return "pdf-libs";
            }
            if (id.includes("react") || id.includes("react-dom"))
              return "react";
            if (
              id.includes("chart.js") ||
              id.includes("react-chartjs-2") ||
              id.includes("chartjs-plugin-annotation")
            )
              return "chartjs";
            return "vendor";
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: [
      "./tests/**/*.test.ts",
      "./tests/**/*.test.tsx",
      "./tests/**/*.spec.ts",
      "./tests/**/*.spec.tsx",
    ],
    exclude: [
      "node_modules",
      "dist",
      ".idea",
      ".git",
      ".cache",
      "tests/e2e/**",
    ],
    coverage: {
      exclude: ["src/charts/chartUtils.ts"],
      thresholds: {
        statements: 84,
        branches: 72,
        functions: 82,
        lines: 86,
      },
    },
  },
});
