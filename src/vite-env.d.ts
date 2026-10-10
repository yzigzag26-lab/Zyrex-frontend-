/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;

  /** ZYREX backend origin — scheme + host, no path. Default: the Wasmer deployment. */
  readonly VITE_API_BASE_URL?: string;
  /** Alias for VITE_API_BASE_URL, kept for backwards compatibility. */
  readonly VITE_API_URL?: string;
  /** Path on the backend that returns an AI answer. Default: /api/zyrex-ai */
  readonly VITE_AI_ENDPOINT?: string;
  /** Path on the backend used for the health probe. Default: /api/health */
  readonly VITE_HEALTH_ENDPOINT?: string;
  /** Abort timeout for an AI request, in ms. Default: 30000 */
  readonly VITE_AI_TIMEOUT_MS?: string;
  /** "true" → send /api/... to the Vite dev server, which proxies to the backend. */
  readonly VITE_USE_DEV_PROXY?: string;
  /**
   * "true" → call relative /api paths in production too (pair with vercel.json).
   * This is the CORS escape hatch when the backend has not allow-listed this origin.
   */
  readonly VITE_USE_PROXY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
