import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Atendente - Recepcionista IA",
        short_name: "Atendente",
        description: "Recepcionista inteligente para seu WhatsApp",
        start_url: "/admin",
        display: "standalone",
        background_color: "#f8f9fd",
        theme_color: "#1a56db",
        icons: [
          { src: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
          { src: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
        ],
      },
      workbox: { globPatterns: ["**/*.{js,css,html,svg,png,ico}"] },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
