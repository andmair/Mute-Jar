import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg'],
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
              src: '/icon.svg',
              sizes: '192x192 512x512',
              type: 'image/svg+xml',
              purpose: 'any',
            },
            {
              src: '/icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'maskable',
            },
          ],
          shortcuts: [
            {
              name: 'Open Mute Jar',
              short_name: 'Jar',
              description: 'View current month mute coin fill',
              url: '/#jar-view',
              icons: [{ src: '/icon.svg', sizes: '192x192' }],
            },
            {
              name: 'Monthly Review',
              short_name: 'Review',
              description: 'Redeem monthly mute coins for charity or pledges',
              url: '/#actions-view',
              icons: [{ src: '/icon.svg', sizes: '192x192' }],
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
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
