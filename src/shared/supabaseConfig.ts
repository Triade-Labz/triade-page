/**
 * Configuração do Supabase, lida UMA vez das variáveis de ambiente do Vite.
 * Antes ela era copiada à mão em dois arquivos (index.html e crm.html): se um
 * ficasse vazio ou diferente, o site gravava num lugar e o CRM lia de outro.
 * Agora site e CRM leem da mesma fonte.
 */

export interface SupabaseConfig {
  url: string;
  key: string;
  /** true para a chave antiga "anon" (JWT); false para sb_publishable_... */
  legacyJwtKey: boolean;
}

export type SupabaseConfigResult =
  | { ok: true; config: SupabaseConfig }
  | { ok: false; reason: "missing" | "invalid-url" | "secret-key"; message: string };

interface EnvLike {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}

function jwtRole(token: string): string | null {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const role: unknown = (JSON.parse(json) as { role?: unknown }).role;
    return typeof role === "string" ? role : null;
  } catch {
    return null;
  }
}

export function parseSupabaseConfig(env: EnvLike): SupabaseConfigResult {
  const rawUrl = (env.VITE_SUPABASE_URL ?? "").trim();
  const key = (env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || "").trim();

  if (!rawUrl || !key) {
    return { ok: false, reason: "missing", message: "VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY não foram configuradas." };
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, reason: "invalid-url", message: `VITE_SUPABASE_URL inválida: "${rawUrl}".` };
  }
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !local) {
    return { ok: false, reason: "invalid-url", message: "VITE_SUPABASE_URL precisa começar com https://." };
  }

  // Uma chave secreta no navegador daria acesso total ao banco para qualquer visitante.
  const legacyJwtKey = key.startsWith("eyJ");
  if (key.startsWith("sb_secret_") || (legacyJwtKey && jwtRole(key) === "service_role")) {
    return {
      ok: false,
      reason: "secret-key",
      message: "A chave configurada é SECRETA (service_role/sb_secret). Use a chave publishable/anon e gere uma nova chave secreta no Supabase.",
    };
  }

  // Só a origem: ".../rest/v1" ou barra no fim colados por engano quebrariam as URLs.
  return { ok: true, config: { url: url.origin, key, legacyJwtKey } };
}

export const supabaseConfig: SupabaseConfigResult = parseSupabaseConfig(import.meta.env);

if (!supabaseConfig.ok && supabaseConfig.reason !== "missing") {
  console.error(`[Tríade] ${supabaseConfig.message}`);
}
