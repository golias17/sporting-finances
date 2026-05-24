import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['assets/LOGO.svg', 'assets/icon-192.png', 'assets/icon-512.png'],
      manifest: {
        name: 'Sporting Finances',
        short_name: 'SCP Finance',
        description: 'An interactive financial dashboard for Sporting Clube de Portugal',
        theme_color: '#0a5d3a', // Sporting Green
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'assets/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'assets/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json}']
      }
    })
  ],
  test: {
    environment: 'jsdom'
  }
});
