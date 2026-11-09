import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  // Stable build ID: defaults to version so user data persists across app restarts/reloads.
  // Data is only purged if the user explicitly triggers a profile wipe or a major version bump occurs.
  const buildId = process.env.BUILD_ID || 'v1.0.0';

  return {
    define: {
      __APP_BUILD_ID__: JSON.stringify(buildId),
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          id: '/',
          name: 'Mute Jar — Meeting Mute Tracker',
          short_name: 'MuteJar',
          description: 'A lightweight, privacy-first meeting companion that automatically detects when you speak on mute.',
          theme_color: '#f59e0b',
          background_color: '#0f172a',
          display: 'standalone',
          display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/icon.svg',
              sizes: '192x192 512x512',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
          shortcuts: [
            {
              name: 'Open Mute Jar',
              short_name: 'Jar',
              description: 'View current month Mutecoin fill',
              url: '/#jar-view',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
            },
            {
              name: 'Monthly Review',
              short_name: 'Review',
              description: 'Redeem monthly Mutecoins for charity or pledges',
              url: '/#actions-view',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
            },
          ],
        },
        devOptions: {
          enabled: true,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio preview iframe to avoid WebSocket connection errors
      hmr: false,
      watch: null,
    },
  };
});
