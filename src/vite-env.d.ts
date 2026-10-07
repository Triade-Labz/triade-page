/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  /** Nome antigo da variável, aceito por compatibilidade. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_CRM_DEMO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Ferramentas de anúncio opcionais (só existem se forem instaladas na página). */
interface Window {
  gtag?: (command: "event", action: string, params?: Record<string, unknown>) => void;
  fbq?: (command: "track", event: string, params?: Record<string, unknown>) => void;
}
