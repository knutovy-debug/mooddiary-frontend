import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'MoodDiary',
        short_name: 'MoodDiary',
        description: 'Дневник настроения с AI-аналитикой',
        theme_color: '#fdf6f0',
        background_color: '#fdf6f0',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'launchericon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'launchericon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'launchericon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
          },
          {
            src: 'launchericon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/mooddiary-backend\.onrender\.com\/api/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
            },
          },
        ],
      },
    }),
  ],
});