import path from "path"
import { createRequire } from "module"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import { VitePWA } from 'vite-plugin-pwa'

// kimi-plugin-inspect-react is optional — gracefully skip on macOS/Linux
const _require = createRequire(import.meta.url)
let inspectPlugin: any = null
try {
  const { inspectAttr } = _require('kimi-plugin-inspect-react')
  inspectPlugin = inspectAttr()
} catch {
  // Plugin not available on this platform — safe to skip
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const appModeRaw = process.env.VITE_APP_MODE ?? env.VITE_APP_MODE;
  const appMode = appModeRaw === 'os' ? 'os' : 'public';

  const themeColor = '#1aa6a8'; // SS Health Care logo teal

  const pwaManifest =
    appMode === 'os'
      ? {
          name: 'SS Health Care Admin OS — Private Portal',
          short_name: 'SS Health Care Admin OS',
          description: 'Private client operations portal for SS Health Care',
          theme_color: themeColor,
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            { src: '/logo.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
            { src: '/logo.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
          shortcuts: [
            { name: 'Open Dashboard', url: '/admin', description: 'Go to SS Health Care Admin OS dashboard' },
          ],
        }
      : {
          name: 'SS Health Care — Home Healthcare Services',
          short_name: 'SS Health Care',
          description: 'Professional home healthcare services in Surat, Gujarat',
          theme_color: themeColor,
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/logo.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable',
            },
            {
              src: '/logo.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
          shortcuts: [
            { name: 'Book Appointment', url: '/appointment', description: 'Book a home healthcare appointment' },
            { name: 'Our Services', url: '/services', description: 'View all healthcare services' },
            { name: 'Contact Us', url: '/contact', description: 'Get in touch with SS Health Care' },
          ],
        };

  return {
    base: '/',
    server: {
      strictPort: true,
      proxy: {
        '/api': 'http://localhost:3001',
      },
    },
    define: {
      'import.meta.env.VITE_APP_MODE': JSON.stringify(appMode),
    },
    build: {
      outDir: process.env.VERCEL ? 'dist' : (appMode === 'os' ? 'dist-os' : 'dist-public'),
      emptyOutDir: true,
    },
    plugins: [
      ...(inspectPlugin ? [inspectPlugin] : []),
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg'],
        manifest: pwaManifest as any,
        devOptions: {
          enabled: false, // Disable SW in dev to prevent stale cache issues
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MiB limit
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'unsplash-images',
                expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'google-fonts' },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
