import type { Lead, LeadInsertEquipe, LeadUpdate } from "../../shared/leads";

export type Membro = {
  email: string;
  nome: string;
};

export type NotaTipo = "nota" | "status";

export type Nota = {
  id: string;
  lead_id: string;
  created_at: string;
  autor: string;
  tipo: NotaTipo;
  texto: string;
};

export type LeadChange =
  | { type: "INSERT"; lead: Lead }
  | { type: "UPDATE"; lead: Lead }
  | { type: "DELETE"; id: string };

/** "on": recebendo em tempo real. "off": canal caiu, o painel passa a consultar periodicamente. */
export type RealtimeState = "connecting" | "on" | "off";

export type AuthEvent = "SIGNED_IN" | "SIGNED_OUT" | "PASSWORD_RECOVERY" | "OTHER";

/** Tudo o que o painel precisa do banco. Há uma versão real (Supabase) e uma de demonstração. */
export interface CrmApi {
  readonly demo: boolean;
  sessionEmail(): Promise<string | null>;
  onAuth(cb: (event: AuthEvent) => void): () => void;
  signIn(email: string, password: string): Promise<void>;
  resetPassword(email: string): Promise<void>;
  setPassword(password: string): Promise<void>;
  signOut(): Promise<void>;

  equipe(): Promise<Membro[]>;
  leads(): Promise<Lead[]>;
  update(id: string, patch: LeadUpdate): Promise<Lead>;
  create(row: LeadInsertEquipe): Promise<Lead>;
  remove(id: string): Promise<void>;

  notas(leadId: string): Promise<Nota[]>;
  addNota(leadId: string, texto: string, tipo: NotaTipo): Promise<Nota>;
  delNota(id: string): Promise<void>;

  subscribe(onChange: (c: LeadChange) => void, onState: (s: RealtimeState) => void): () => void;
}
