/**
 * Modelo de dados dos leads, espelhando a tabela public.leads
 * (database/01-tabela-leads.sql). Site e CRM usam estes mesmos tipos,
 * então um valor aceito no formulário é sempre um valor aceito pelo banco.
 */

export const PLANOS = ["essencial", "profissional", "completo", "suporte", "seguranca", "duvida"] as const;
export type Plano = (typeof PLANOS)[number];

export interface PlanoInfo {
  id: Plano;
  /** Texto da opção no formulário do site. */
  rotulo: string;
  /** Texto curto usado nos cards e filtros do CRM. */
  curto: string;
  grupo: "Sites e sistemas" | "Outros serviços";
}

export const PLANO_INFO: Record<Plano, PlanoInfo> = {
  essencial: { id: "essencial", rotulo: "Essencial — Landing Page", curto: "Site · Essencial", grupo: "Sites e sistemas" },
  profissional: { id: "profissional", rotulo: "Profissional — Landing Page + Aplicação e Infraestrutura", curto: "Site · Profissional", grupo: "Sites e sistemas" },
  completo: { id: "completo", rotulo: "Completo — Design + Aplicação + Segurança", curto: "Site · Completo", grupo: "Sites e sistemas" },
  suporte: { id: "suporte", rotulo: "Suporte em TI para minha empresa", curto: "Suporte em TI", grupo: "Outros serviços" },
  seguranca: { id: "seguranca", rotulo: "Análise de vulnerabilidades", curto: "Vulnerabilidades", grupo: "Outros serviços" },
  duvida: { id: "duvida", rotulo: "Ainda não sei, quero orientação", curto: "Quer orientação", grupo: "Outros serviços" },
};

export function isPlano(v: unknown): v is Plano {
  return typeof v === "string" && (PLANOS as readonly string[]).includes(v);
}

export const LEAD_STATUS = ["novo", "em_contato", "proposta", "fechado", "perdido"] as const;
export type LeadStatus = (typeof LEAD_STATUS)[number];

export function isLeadStatus(v: unknown): v is LeadStatus {
  return typeof v === "string" && (LEAD_STATUS as readonly string[]).includes(v);
}

/** Origem do lead: campanha/página quando vem do site, canal quando é cadastro manual. */
export type LeadOrigem = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
  pagina?: string;
  referrer?: string;
  canal?: string;
  manual?: boolean;
  registrado_por?: string | null;
};

export type Lead = {
  id: string;
  created_at: string;
  updated_at: string;
  nome: string;
  empresa: string;
  /** Só dígitos, com DDD e sem o 55: 10 ou 11 dígitos. */
  whatsapp: string;
  plano: Plano;
  consentimento_em: string;
  origem: LeadOrigem;
  status: LeadStatus;
  responsavel: string | null;
  valor: number | null;
  /** Data no formato AAAA-MM-DD. */
  proximo_contato: string | null;
};

/** Colunas que o formulário público pode enviar (o banco só libera estas para o site). */
export type LeadInsertPublico = {
  nome: string;
  empresa: string;
  whatsapp: string;
  plano: Plano;
  consentimento_em: string;
  origem: LeadOrigem;
};

/** Cadastro manual pelo CRM: pode já nascer com responsável. */
export type LeadInsertEquipe = LeadInsertPublico & {
  responsavel?: string | null;
};

export type LeadUpdate = Partial<Pick<Lead, "status" | "responsavel" | "valor" | "proximo_contato">>;

/** Limites idênticos aos CHECKs da tabela. */
export const LIMITES = {
  nome: { min: 2, max: 120 },
  empresa: { min: 2, max: 160 },
} as const;
