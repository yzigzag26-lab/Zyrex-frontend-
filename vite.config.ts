import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_API_URL = "https://zyrex-backend-obafemip715.wasmer.app";

/**
 * Optional dev proxy.
 *
 * By default the browser calls the backend directly. If the backend does not
 * send CORS headers, set VITE_USE_DEV_PROXY=true: the app then requests a
 * relative `/api/...` path and the dev server forwards it to VITE_API_URL.
 */
const apiTarget = process.env.VITE_API_URL?.trim() || DEFAULT_API_URL;
const useDevProxy = process.env.VITE_USE_DEV_PROXY === "true";

// https://vite.dev/config/
export default defineConfig({
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
});
