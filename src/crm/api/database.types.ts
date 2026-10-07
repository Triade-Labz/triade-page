import type { Lead, LeadInsertEquipe, LeadUpdate } from "../../shared/leads";
import type { Membro, Nota, NotaTipo } from "./types";

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
        Relationships: [
          {
            foreignKeyName: "lead_notas_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_equipe: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
