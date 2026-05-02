import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["favicon.ico", "icon.svg", "apple-touch-icon-180x180.png"],
            manifest: {
                name: "Plato",
                short_name: "Plato",
                description: "Workout tracking for hypertrophy and load progression",
                start_url: "/",
                display: "standalone",
                orientation: "portrait",
                background_color: "#141418",
                theme_color: "#141418",
                icons: [
                    { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
                    { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
                    { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
                    {
                        src: "maskable-icon-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "maskable",
                    },
                ],
            },
            workbox: {
                navigateFallback: "/index.html",
                runtimeCaching: [
                    {
                        urlPattern: /^\/api\/.*/,
                        handler: "NetworkOnly",
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
    preview: {
        allowedHosts: [
            'plato-workout.up.railway.app',
            '.railway.app'
        ],
    },
    server: {
        host: "0.0.0.0",
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
            },
        },
    }
})
