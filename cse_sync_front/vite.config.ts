import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react({
            babel: {
                plugins: ["babel-plugin-react-compiler"],
            },
        }),
        tailwindcss(),
        VitePWA({
            includeAssets: [
                "favicon.ico",
                "robots.txt",
                "apple-touch-icon.png",
            ],
            manifest: {
                name: "Client-Side Encrypted PoC App",
                short_name: "CSE PoC",
                description:
                    "A Proof of Concept App demonstrating client-side encryption",
                theme_color: "#ffffff",
                icons: [
                    {
                        src: "pwa-192x192.png",
                        sizes: "192x192",
                        type: "image/png",
                    },
                    {
                        src: "pwa-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                    },
                ],
            },
            registerType: "autoUpdate",
            devOptions: {
                enabled: true,
            },
        }),
    ],
    optimizeDeps: {
        include: ["libsodium-wrappers"],
    },
});
