import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    headers: {
      "Content-Security-Policy": [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com",
        "style-src 'self' 'unsafe-inline' https://unpkg.com https://fonts.googleapis.com",
        "img-src 'self' data: blob: https: http:",
        "font-src 'self' https://fonts.gstatic.com",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://unpkg.com https://*.basemaps.cartocdn.com",
        "frame-ancestors 'self'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join("; "),
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)",
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'ASEGURAR LTDA - Monitoreo GPS y Rastreo Satelital',
        short_name: 'ASEGURAR',
        description: 'Plataforma de Monitoreo GPS, Rastreo Satelital y Gestión de Flotas',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        scope: '/',
        start_url: '/?source=pwa',
        orientation: 'portrait',
        categories: ['business', 'productivity', 'logistics', 'navigation'],
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        screenshots: [
          {
            src: '/screenshots/dashboard-wide.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Dashboard principal con vista de flota en tiempo real'
          },
          {
            src: '/screenshots/map-mobile.png',
            sizes: '750x1334',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Mapa de rastreo GPS con ubicación de vehículos'
          }
        ],
        shortcuts: [
          {
            name: 'Mapa de Flota',
            short_name: 'Mapa',
            description: 'Ver ubicación de todos los vehículos en tiempo real',
            url: '/platform/tracking?source=shortcut',
            icons: [{ src: '/icons/map-shortcut.png', sizes: '192x192' }]
          },
          {
            name: 'Alertas',
            short_name: 'Alertas',
            description: 'Ver alertas críticas pendientes',
            url: '/platform/alerts?source=shortcut',
            icons: [{ src: '/icons/alert-shortcut.png', sizes: '192x192' }]
          },
          {
            name: 'Preoperacional',
            short_name: 'Inspección',
            description: 'Iniciar inspección preoperacional',
            url: '/platform/checklist?source=shortcut',
            icons: [{ src: '/icons/checklist-shortcut.png', sizes: '192x192' }]
          },
          {
            name: 'Reportes',
            short_name: 'Reportes',
            description: 'Generar reportes de operación',
            url: '/platform/reports?source=shortcut',
            icons: [{ src: '/icons/report-shortcut.png', sizes: '192x192' }]
          }
        ],
        share_target: {
          action: '/platform/share',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
            files: [
              {
                name: 'media',
                accept: ['image/*', 'application/pdf']
              }
            ]
          }
        }
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Read operations: NetworkFirst with quick cache fallback for offline support
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            method: 'GET',
            options: {
              cacheName: 'supabase-api-data',
              expiration: {
                maxEntries: 150,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days for offline support
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 3 // Fallback to cache after 3s if network slow
            }
          },
          {
            // Cache Edge Functions (AI Chat, Optimization)
            urlPattern: /^https:\/\/.*\.supabase\.co\/functions\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-edge-functions',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24h
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Background Sync for Mutations (POST)
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            method: 'POST',
            handler: 'NetworkOnly',
            options: {
              backgroundSync: {
                name: 'supabase-mutations-queue',
                options: {
                  maxRetentionTime: 24 * 60 // Retry for 24 hours
                }
              }
            }
          },
          {
            // Background Sync for Mutations (PATCH)
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            method: 'PATCH',
            handler: 'NetworkOnly',
            options: {
              backgroundSync: {
                name: 'supabase-mutations-queue',
                options: {
                  maxRetentionTime: 24 * 60 // Retry for 24 hours
                }
              }
            }
          },
          {
            // Background Sync for Mutations (DELETE)
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            method: 'DELETE',
            handler: 'NetworkOnly',
            options: {
              backgroundSync: {
                name: 'supabase-mutations-queue',
                options: {
                  maxRetentionTime: 24 * 60 // Retry for 24 hours
                }
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.basemaps\.cartocdn\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    }),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React libraries
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/react-router')) {
            return 'vendor-router';
          }

          // UI Component Libraries
          if (id.includes('node_modules/@radix-ui')) {
            return 'vendor-radix';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }

          // Data Visualization (heavy - split from main)
          if (id.includes('node_modules/recharts')) {
            return 'vendor-recharts';
          }
          if (id.includes('node_modules/three') || id.includes('node_modules/@react-three')) {
            return 'vendor-three';
          }

          // Maps (heavy - split from main)
          if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) {
            return 'vendor-leaflet';
          }

          // Backend & State
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'vendor-tanstack';
          }
          if (id.includes('node_modules/zustand')) {
            return 'vendor-zustand';
          }

          // Forms & Validation
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/zod')) {
            return 'vendor-forms';
          }

          // I18n
          if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) {
            return 'vendor-i18n';
          }

          // PDF & Export utilities
          if (id.includes('node_modules/html2canvas') || id.includes('node_modules/jspdf')) {
            return 'vendor-export';
          }

          // Other large vendor dependencies
          if (id.includes('node_modules/')) {
            return 'vendor-misc';
          }
        },
      },
    },
    // Increase chunk size warning limit (we're intentionally splitting)
    chunkSizeWarningLimit: 600,
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    include: ["src/**/*.test.{ts,tsx}"],
  },
}));

