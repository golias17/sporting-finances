import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import viteCompression from "vite-plugin-compression";

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: "prompt",
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
        globPatterns: ["**/*.{js,css,html,svg,png,json}"],
      },
    }),
    viteCompression({ algorithm: "brotliCompress", ext: ".br" }),
    viteCompression({ algorithm: "gzip", ext: ".gz" }),
  ],
  build: {
    // es2022 matches the ecmaVersion in eslint.config.mjs and removes the need
    // for the browserslist field in package.json (which was targeting a much
    // wider audience and could conflict with this setting).
    target: "es2022",
  },
  test: {
    environment: "jsdom",
  },
});
