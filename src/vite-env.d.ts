/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;

  /** ZYREX backend origin, e.g. https://zyrex-backend-obafemip715.wasmer.app */
  readonly VITE_API_URL?: string;
  /** Path on the backend that returns an AI answer. Default: /api/zyrex-ai */
  readonly VITE_AI_ENDPOINT?: string;
  /** Path on the backend used for the health probe. Default: /api/health */
  readonly VITE_HEALTH_ENDPOINT?: string;
  /** Abort timeout for an AI request, in ms. Default: 30000 */
  readonly VITE_AI_TIMEOUT_MS?: string;
  /** "true" → send /api/... to the Vite dev server, which proxies to the backend. */
  readonly VITE_USE_DEV_PROXY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
