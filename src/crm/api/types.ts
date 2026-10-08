import type { Lead, LeadInsertEquipe, LeadUpdate } from "../../shared/leads";
import type { AuthApi, RealtimeState } from "../../painel/api/auth";
import type { Nota, NotaTipo } from "../../painel/api/database.types";

export type { Membro, RealtimeState } from "../../painel/api/auth";
export type { Nota, NotaTipo } from "../../painel/api/database.types";

export type LeadChange =
  | { type: "INSERT"; lead: Lead }
  | { type: "UPDATE"; lead: Lead }
  | { type: "DELETE"; id: string };

/** Tudo o que o painel precisa do banco. Há uma versão real (Supabase) e uma de demonstração. */
export interface CrmApi extends AuthApi {
  leads(): Promise<Lead[]>;
  update(id: string, patch: LeadUpdate): Promise<Lead>;
  create(row: LeadInsertEquipe): Promise<Lead>;
  remove(id: string): Promise<void>;

  notas(leadId: string): Promise<Nota[]>;
  addNota(leadId: string, texto: string, tipo: NotaTipo): Promise<Nota>;
  delNota(id: string): Promise<void>;

  subscribe(onChange: (c: LeadChange) => void, onState: (s: RealtimeState) => void): () => void;
}
