/// <reference types="vite/client" />

declare module "*.jpg" {
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;

  /** WebSocket connection / response timeout in ms. Default: 120000 */
  readonly VITE_AI_TIMEOUT_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
