import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [react(), VitePWA({ registerType: "autoUpdate" })],
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true,
    proxy: {
      "/graphql": {
        target: "http://api:8000",
        changeOrigin: true,
      },
      "/minio": {
        target: "http://minio:9000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/minio/, ""),
      },
      "/ws": {
        target: "ws://api:8000",
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
