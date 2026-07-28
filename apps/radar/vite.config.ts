import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [solid()],
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: process.env.RADAR_API_PROXY ?? "http://127.0.0.1:8082",
        changeOrigin: true,
      },
    },
  },
});
