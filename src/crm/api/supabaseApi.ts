import { createClient, type RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Lead } from "../../shared/leads";
import type { SupabaseConfig } from "../../shared/supabaseConfig";
import type { Database } from "./database.types";
import type { AuthEvent, CrmApi, LeadChange } from "./types";

const PAGE = 1000; // limite padrão de linhas por consulta no Supabase

/** Resultado de consulta: lança o erro do Supabase ou devolve os dados (nunca null sem erro). */
function check<T>(r: { data: T | null; error: unknown }): T {
  if (r.error) throw r.error;
  if (r.data === null) throw new Error("O banco não devolveu dados (verifique as permissões de leitura).");
  return r.data;
}

/** Para chamadas em que só importa se deu erro. */
function ok(r: { error: unknown }): void {
  if (r.error) throw r.error;
}

export function createSupabaseApi(cfg: SupabaseConfig): CrmApi {
  const sb = createClient<Database>(cfg.url, cfg.key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });

  return {
    demo: false,

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
      // Volta para esta mesma página (crm.html ou /crm), sem o #token antigo.
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

    async leads() {
      // Busca em páginas: o Supabase corta em 1000 linhas por consulta, e antes os leads mais antigos sumiam.
      const all: Lead[] = [];
      for (let from = 0; ; from += PAGE) {
        const page = check(
          await sb
            .from("leads")
            .select("*")
            .order("created_at", { ascending: false })
            .order("id")
            .range(from, from + PAGE - 1),
        );
        all.push(...page);
        if (page.length < PAGE || all.length >= 20000) return all;
      }
    },

    async update(id, patch) {
      return check(await sb.from("leads").update(patch).eq("id", id).select().single());
    },

    async create(row) {
      return check(await sb.from("leads").insert(row).select().single());
    },

    async remove(id) {
      ok(await sb.from("leads").delete().eq("id", id));
    },

    async notas(leadId) {
      return check(await sb.from("lead_notas").select("*").eq("lead_id", leadId).order("created_at", { ascending: false }));
    },

    async addNota(leadId, texto, tipo) {
      return check(await sb.from("lead_notas").insert({ lead_id: leadId, texto, tipo }).select().single());
    },

    async delNota(id) {
      ok(await sb.from("lead_notas").delete().eq("id", id));
    },

    subscribe(onChange, onState) {
      onState("connecting");
      const channel = sb
        // Nome único: no modo estrito do React o efeito monta duas vezes e o canal antigo ainda está fechando.
        .channel(`leads-rt-${crypto.randomUUID()}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, (p: RealtimePostgresChangesPayload<Lead>) => {
          let change: LeadChange | null = null;
          if (p.eventType === "INSERT") change = { type: "INSERT", lead: p.new };
          else if (p.eventType === "UPDATE") change = { type: "UPDATE", lead: p.new };
          else if (p.eventType === "DELETE" && p.old.id) change = { type: "DELETE", id: p.old.id };
          if (change) onChange(change);
        })
        .subscribe((status, err) => {
          if (status === "SUBSCRIBED") onState("on");
          else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            if (err) console.warn("[CRM] tempo real indisponível:", err);
            onState("off");
          }
        });
      return () => {
        void sb.removeChannel(channel);
      };
    },
  };
}
