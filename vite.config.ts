import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact()],
  server: {
    proxy: {
      "/api": {
        target: "https://grupoheroicaapi.skillsuite.net/app/wssuite/api",
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api/, ""),
        secure: false,
      },
    },
  },
});
