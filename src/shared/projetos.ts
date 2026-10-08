/**
 * Modelo de dados do controle de projetos, espelhando database/05-projetos.sql.
 * Os nomes das etapas e situações são os mesmos que o banco grava no histórico
 * (há um teste que confere os dois lados).
 */
import type { Plano } from "./leads";

export const ETAPAS = ["escopo", "design", "landing", "backend", "seguranca", "entrega", "concluido"] as const;
export type Etapa = (typeof ETAPAS)[number];
/** Etapas que têm tarefas (Concluído é só onde o projeto termina). */
export type EtapaTrabalho = Exclude<Etapa, "concluido">;
export const ETAPAS_TRABALHO = ETAPAS.filter((e): e is EtapaTrabalho => e !== "concluido");

export const ETAPA_INFO: Record<Etapa, { nome: string; vazio: string }> = {
  escopo: { nome: "Escopo", vazio: "Contratos fechados no CRM chegam aqui sozinhos." },
  design: { nome: "Design", vazio: "Protótipo e identidade visual." },
  landing: { nome: "Landing page", vazio: "Criação da página." },
  backend: { nome: "Integração backend", vazio: "Aplicação, API, login e infraestrutura." },
  seguranca: { nome: "Teste de vulnerabilidade", vazio: "Varredura e correções de segurança." },
  entrega: { nome: "Revisão e entrega", vazio: "Rodadas de revisão e publicação." },
  concluido: { nome: "Concluído", vazio: "Projetos entregues." },
};

export function isEtapa(v: unknown): v is Etapa {
  return typeof v === "string" && (ETAPAS as readonly string[]).includes(v);
}

export function isEtapaTrabalho(v: unknown): v is EtapaTrabalho {
  return isEtapa(v) && v !== "concluido";
}

export const SITUACOES = ["andamento", "aguardando", "pausado", "cancelado"] as const;
export type Situacao = (typeof SITUACOES)[number];

export const SITUACAO_NOME: Record<Situacao, string> = {
  andamento: "Em andamento",
  aguardando: "Aguardando cliente",
  pausado: "Pausado",
  cancelado: "Cancelado",
};

export function isSituacao(v: unknown): v is Situacao {
  return typeof v === "string" && (SITUACOES as readonly string[]).includes(v);
}

export type Projeto = {
  id: string;
  created_at: string;
  updated_at: string;
  /** Lead do CRM que originou o projeto (contrato fechado). Nulo se foi criado à mão ou o lead foi apagado. */
  lead_id: string | null;
  nome: string;
  cliente: string;
  empresa: string;
  /** Só dígitos, com DDD e sem o 55. */
  whatsapp: string | null;
  plano: Plano;
  etapa: Etapa;
  situacao: Situacao;
  responsavel: string | null;
  /** Datas no formato AAAA-MM-DD. */
  inicio: string;
  prazo: string | null;
  concluido_em: string | null;
  /** Escopo: o que o cliente precisa, o que está incluído e o que não está. */
  objetivo: string;
  requisitos: string;
  fora_escopo: string;
  links: string;
};

export type ProjetoInsert = Pick<Projeto, "nome" | "cliente" | "empresa" | "plano"> &
  Partial<Pick<Projeto, "whatsapp" | "responsavel" | "inicio" | "prazo" | "objetivo">>;

/** Colunas que a equipe pode alterar (o banco só libera estas). */
export const PROJETO_EDITAVEIS = [
  "nome",
  "cliente",
  "empresa",
  "whatsapp",
  "plano",
  "etapa",
  "situacao",
  "responsavel",
  "inicio",
  "prazo",
  "objetivo",
  "requisitos",
  "fora_escopo",
  "links",
] as const;
export type ProjetoUpdate = Partial<Pick<Projeto, (typeof PROJETO_EDITAVEIS)[number]>>;

export type Tarefa = {
  id: string;
  projeto_id: string;
  created_at: string;
  etapa: EtapaTrabalho;
  titulo: string;
  ordem: number;
  feita: boolean;
  feita_em: string | null;
  feita_por: string | null;
};

export type TarefaInsert = Pick<Tarefa, "projeto_id" | "etapa" | "titulo"> & Partial<Pick<Tarefa, "ordem" | "feita">>;
export type TarefaUpdate = Partial<Pick<Tarefa, "etapa" | "titulo" | "ordem" | "feita">>;

export type ProjetoNotaTipo = "nota" | "etapa" | "sistema";

export type ProjetoNota = {
  id: string;
  projeto_id: string;
  created_at: string;
  autor: string;
  tipo: ProjetoNotaTipo;
  texto: string;
};

/** Limites idênticos aos CHECKs das tabelas. */
export const LIMITES_PROJETO = {
  nome: { min: 2, max: 160 },
  cliente: { min: 2, max: 120 },
  empresa: { max: 160 },
  escopo: { max: 8000 },
  links: { max: 4000 },
  tarefa: { min: 1, max: 300 },
  nota: { max: 4000 },
} as const;
