import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_API_URL = "https://zyrex-backend-obafemip715.wasmer.app";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load every variable (empty prefix) so VITE_* names are readable here.
  const env = loadEnv(mode, process.cwd(), "");

  const apiTarget = (env.VITE_API_BASE_URL || env.VITE_API_URL || DEFAULT_API_URL).trim();

  /**
   * Dev proxy: on by default.
   *
   * The backend only answers browsers whose Origin is listed in its
   * CORS_ORIGINS (currently https://zyrex.vercel.app and
   * https://zyrex.wasmer.app). A dev/preview origin is therefore rejected
   * before any JSON can be read. Proxying through the dev server keeps the
   * call same-origin. Set VITE_USE_DEV_PROXY=false to opt out.
   */
  const proxySetting = env.VITE_USE_DEV_PROXY;
  const useDevProxy = proxySetting === undefined || proxySetting === "" ? true : proxySetting === "true";

  return {
    plugins: [react(), tailwindcss(), viteSingleFile()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      // Allow the app to be opened through preview/sandbox hostnames.
      allowedHosts: true,
      ...(useDevProxy
        ? {
            proxy: {
              "/api": {
                target: apiTarget,
                changeOrigin: true,
                secure: true,
              },
            },
          }
        : {}),
    },
  };
});
