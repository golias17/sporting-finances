import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['assets/LOGO.svg'],
      manifest: {
        name: 'Sporting Finances',
        short_name: 'SCP Finance',
        description: 'An interactive financial dashboard for Sporting Clube de Portugal',
        theme_color: '#0a5d3a', // Sporting Green
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'assets/LOGO.svg', // Normally you'd want PNGs here, but SVG is supported in some contexts. We'll stick to SVG.
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json}']
      }
    })
  ],
  test: {
    environment: 'jsdom'
  }
});
