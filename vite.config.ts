/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    server: {
        host: "::",
        port: 5173,
    },
    plugins: [
        react(),
        VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["favicon.ico", "favicon/*.png", "favicon/*.svg", "web-app-manifest-*.png"],
            manifest: false, // Using existing site.webmanifest
            workbox: {
                globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
                maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB limit
                runtimeCaching: [
                    // Supabase API - NetworkFirst with fallback
                    {
                        urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
                        handler: "NetworkFirst",
                        options: {
                            cacheName: "supabase-api-cache",
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24, // 1 day
                            },
                            networkTimeoutSeconds: 10,
                        },
                    },
                    // Supabase Auth - NetworkOnly (no cache)
                    {
                        urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/.*/i,
                        handler: "NetworkOnly",
                    },
                    // Supabase Storage - CacheFirst
                    {
                        urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "supabase-storage-cache",
                            expiration: {
                                maxEntries: 200,
                                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                            },
                        },
                    },
                    // Google Fonts stylesheets
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: "StaleWhileRevalidate",
                        options: {
                            cacheName: "google-fonts-stylesheets",
                        },
                    },
                    // Google Fonts webfonts
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "google-fonts-webfonts",
                            expiration: {
                                maxEntries: 20,
                                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                            },
                        },
                    },
                    // Leaflet CSS
                    {
                        urlPattern: /^https:\/\/unpkg\.com\/leaflet.*/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "leaflet-assets",
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                            },
                        },
                    },
                    // Map tiles (OpenStreetMap, etc.)
                    {
                        urlPattern: /^https:\/\/.*tile.*\/.*/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "map-tiles",
                            expiration: {
                                maxEntries: 500,
                                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                            },
                        },
                    },
                ],
            },
        }),
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: "./src/test/setup.ts",
        css: true,
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
        },
    },
}));
