import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Lead } from "../../shared/leads";
import type { SupabaseConfig } from "../../shared/supabaseConfig";
import { check, createPainelClient, fetchAll, ok, supabaseAuth } from "../../painel/api/supabase";
import type { CrmApi, LeadChange } from "./types";

export function createSupabaseApi(cfg: SupabaseConfig): CrmApi {
  const sb = createPainelClient(cfg);

  return {
    demo: false,
    ...supabaseAuth(sb),

    leads() {
      // Busca em páginas: antes os leads mais antigos que o limite de 1000 sumiam.
      return fetchAll((from, to) => sb.from("leads").select("*").order("created_at", { ascending: false }).order("id").range(from, to));
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
