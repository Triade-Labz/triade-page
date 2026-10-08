import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseConfig } from "../../shared/supabaseConfig";
import type { AuthApi, AuthEvent } from "./auth";
import type { Database } from "./database.types";

export type PainelClient = SupabaseClient<Database>;

/** Limite padrão de linhas por consulta no Supabase. */
export const PAGE = 1000;

/** Resultado de consulta: lança o erro do Supabase ou devolve os dados (nunca null sem erro). */
export function check<T>(r: { data: T | null; error: unknown }): T {
  if (r.error) throw r.error;
  if (r.data === null) throw new Error("O banco não devolveu dados (verifique as permissões de leitura).");
  return r.data;
}

/** Para chamadas em que só importa se deu erro. */
export function ok(r: { error: unknown }): void {
  if (r.error) throw r.error;
}

/**
 * Busca em páginas: o Supabase corta em 1000 linhas por consulta.
 * `page(from, to)` deve devolver a consulta já ordenada de forma estável.
 */
export async function fetchAll<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>, max = 20000): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const rows = check(await page(from, from + PAGE - 1));
    all.push(...rows);
    if (rows.length < PAGE || all.length >= max) return all;
  }
}

/** CRM e projetos usam o mesmo projeto do Supabase: quem entra em um já está logado no outro. */
export function createPainelClient(cfg: SupabaseConfig): PainelClient {
  return createClient<Database>(cfg.url, cfg.key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
}

export function supabaseAuth(sb: PainelClient): Omit<AuthApi, "demo"> {
  return {
    async sessionEmail() {
      const { data, error } = await sb.auth.getSession();
      if (error) throw error;
      return data.session?.user.email ?? null;
    },

    onAuth(cb) {
      const { data } = sb.auth.onAuthStateChange((ev) => {
        const mapped: AuthEvent = ev === "SIGNED_IN" || ev === "SIGNED_OUT" || ev === "PASSWORD_RECOVERY" ? ev : "OTHER";
        cb(mapped);
      });
      return () => data.subscription.unsubscribe();
    },

    async signIn(email, password) {
      ok(await sb.auth.signInWithPassword({ email, password }));
    },

    async resetPassword(email) {
      // Volta para esta mesma página (CRM ou projetos), sem o #token antigo.
      ok(await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }));
    },

    async setPassword(password) {
      ok(await sb.auth.updateUser({ password }));
    },

    async signOut() {
      await sb.removeAllChannels();
      await sb.auth.signOut();
    },

    async equipe() {
      return check(await sb.from("equipe").select("email,nome").order("nome"));
    },
  };
}
