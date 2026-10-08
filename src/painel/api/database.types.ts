import type { Lead, LeadInsertEquipe, LeadUpdate } from "../../shared/leads";
import type { Projeto, ProjetoInsert, ProjetoNota, ProjetoUpdate, Tarefa, TarefaInsert, TarefaUpdate } from "../../shared/projetos";
import type { Membro } from "./auth";

export type NotaTipo = "nota" | "status";

/** Anotação/histórico de um lead do CRM. */
export type Nota = {
  id: string;
  lead_id: string;
  created_at: string;
  autor: string;
  tipo: NotaTipo;
  texto: string;
};

type Fk<Nome extends string, Coluna extends string, Tabela extends string> = {
  foreignKeyName: Nome;
  columns: [Coluna];
  isOneToOne: false;
  referencedRelation: Tabela;
  referencedColumns: ["id"];
};

/**
 * Esquema do banco no formato que o supabase-js entende, escrito à mão a partir
 * de database/*.sql. Se mudar uma tabela, mude aqui também.
 */
export type Database = {
  public: {
    Tables: {
      leads: {
        Row: Lead;
        Insert: LeadInsertEquipe & Partial<Pick<Lead, "status" | "valor" | "proximo_contato">>;
        Update: LeadUpdate;
        Relationships: [];
      };
      equipe: {
        Row: Membro;
        Insert: Membro;
        Update: Partial<Membro>;
        Relationships: [];
      };
      lead_notas: {
        Row: Nota;
        Insert: { lead_id: string; texto: string; tipo?: NotaTipo };
        Update: { texto?: string };
        Relationships: [Fk<"lead_notas_lead_id_fkey", "lead_id", "leads">];
      };
      projetos: {
        Row: Projeto;
        Insert: ProjetoInsert;
        Update: ProjetoUpdate;
        Relationships: [Fk<"projetos_lead_id_fkey", "lead_id", "leads">];
      };
      projeto_tarefas: {
        Row: Tarefa;
        Insert: TarefaInsert;
        Update: TarefaUpdate;
        Relationships: [Fk<"projeto_tarefas_projeto_id_fkey", "projeto_id", "projetos">];
      };
      projeto_notas: {
        Row: ProjetoNota;
        Insert: { projeto_id: string; texto: string };
        Update: { texto?: string };
        Relationships: [Fk<"projeto_notas_projeto_id_fkey", "projeto_id", "projetos">];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_equipe: { Args: Record<string, never>; Returns: boolean };
      projeto_aplicar_modelo: { Args: { p_projeto: string }; Returns: number };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
