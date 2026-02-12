import { defineConfig, loadEnv } from "vite";
import preact from "@preact/preset-vite";

// https://vite.dev/config/
export default defineConfig(({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget =
    env.VITE_DEV_PROXY_TARGET ||
    "https://grupoheroicaapi.skillsuite.net/app/wssuite/api";

  return {
    plugins: [preact()],
    server: {
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api/, ""),
          secure: false,
        },
      },
    },
  };
});
