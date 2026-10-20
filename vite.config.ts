/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // GitHub Pages'te uygulama https://<kullanıcı>.github.io/cuzdan/ altında yayınlanır.
  base: '/cuzdan/',
  plugins: [
    react(),
    VitePWA({
      // Yeni sürüm yayınlanınca bir sonraki açılışta sessizce güncellenir.
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Cüzdan',
        short_name: 'Cüzdan',
        description: 'İnternetsiz çalışan kişisel gelir-gider ve bütçe takibi',
        lang: 'tr',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#f2f2f7',
        background_color: '#f2f2f7',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
})
