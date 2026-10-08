import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Projeto, Tarefa } from "../../shared/projetos";
import type { SupabaseConfig } from "../../shared/supabaseConfig";
import { check, createPainelClient, fetchAll, ok, supabaseAuth } from "../../painel/api/supabase";
import type { ProjetosApi, ProjetosChange } from "./types";

export function createSupabaseApi(cfg: SupabaseConfig): ProjetosApi {
  const sb = createPainelClient(cfg);

  return {
    demo: false,
    ...supabaseAuth(sb),

    projetos() {
      return fetchAll((from, to) => sb.from("projetos").select("*").order("created_at", { ascending: false }).order("id").range(from, to));
    },

    tarefas(projetoId) {
      return fetchAll((from, to) => {
        const q = sb.from("projeto_tarefas").select("*");
        return (projetoId ? q.eq("projeto_id", projetoId) : q).order("ordem").order("created_at").order("id").range(from, to);
      });
    },

    async createProjeto(row) {
      return check(await sb.from("projetos").insert(row).select().single());
    },

    async updateProjeto(id, patch) {
      return check(await sb.from("projetos").update(patch).eq("id", id).select().single());
    },

    async removeProjeto(id) {
      ok(await sb.from("projetos").delete().eq("id", id));
    },

    async addTarefa(row) {
      return check(await sb.from("projeto_tarefas").insert(row).select().single());
    },

    async updateTarefa(id, patch) {
      return check(await sb.from("projeto_tarefas").update(patch).eq("id", id).select().single());
    },

    async removeTarefa(id) {
      ok(await sb.from("projeto_tarefas").delete().eq("id", id));
    },

    async aplicarModelo(projetoId) {
      return check(await sb.rpc("projeto_aplicar_modelo", { p_projeto: projetoId }));
    },

    async notas(projetoId) {
      return check(await sb.from("projeto_notas").select("*").eq("projeto_id", projetoId).order("created_at", { ascending: false }));
    },

    async addNota(projetoId, texto) {
      return check(await sb.from("projeto_notas").insert({ projeto_id: projetoId, texto }).select().single());
    },

    async delNota(id) {
      ok(await sb.from("projeto_notas").delete().eq("id", id));
    },

    subscribe(onChange, onState) {
      onState("connecting");
      const channel = sb
        // Nome único: no modo estrito do React o efeito monta duas vezes e o canal antigo ainda está fechando.
        .channel(`projetos-rt-${crypto.randomUUID()}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "projetos" }, (p: RealtimePostgresChangesPayload<Projeto>) => {
          let c: ProjetosChange | null = null;
          if (p.eventType === "INSERT" || p.eventType === "UPDATE") c = { tabela: "projetos", type: p.eventType, row: p.new };
          else if (p.eventType === "DELETE" && p.old.id) c = { tabela: "projetos", type: "DELETE", id: p.old.id };
          if (c) onChange(c);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "projeto_tarefas" }, (p: RealtimePostgresChangesPayload<Tarefa>) => {
          let c: ProjetosChange | null = null;
          if (p.eventType === "INSERT" || p.eventType === "UPDATE") c = { tabela: "tarefas", type: p.eventType, row: p.new };
          else if (p.eventType === "DELETE" && p.old.id) c = { tabela: "tarefas", type: "DELETE", id: p.old.id };
          if (c) onChange(c);
        })
        .subscribe((status, err) => {
          if (status === "SUBSCRIBED") onState("on");
          else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            if (err) console.warn("[Projetos] tempo real indisponível:", err);
            onState("off");
          }
        });
      return () => {
        void sb.removeChannel(channel);
      };
    },
  };
}
