import { planoCurto, type Lead, type LeadStatus, type Plano } from "../../shared/leads";
import { membroNome } from "../../painel/lib/equipe";
import { formatBrPhone } from "../../shared/phone";
import { dataHora, norm, today } from "../../painel/lib/format";
import type { Membro } from "../api/types";

export const STATUS: { id: LeadStatus; nome: string; vazio: string }[] = [
  { id: "novo", nome: "Novo", vazio: "Nenhum lead novo. Os pedidos do site aparecem aqui na hora." },
  { id: "em_contato", nome: "Em contato", vazio: "Arraste para cá quem você já chamou." },
  { id: "proposta", nome: "Proposta", vazio: "Leads com proposta enviada." },
  { id: "fechado", nome: "Fechado", vazio: "Os contratos fechados ficam aqui." },
  { id: "perdido", nome: "Perdido", vazio: "Quem não seguiu adiante." },
];

export const STATUS_NOME = Object.fromEntries(STATUS.map((s) => [s.id, s.nome])) as Record<LeadStatus, string>;

export { planoCurto } from "../../shared/leads";
export { membroNome } from "../../painel/lib/equipe";

export interface Filtros {
  q: string;
  plano: Plano | "";
  /** "" = todos, "_none" = sem responsável, ou o e-mail do responsável. */
  responsavel: string;
}

export function filterLeads(leads: Lead[], f: Filtros): Lead[] {
  const q = norm(f.q.trim());
  const qDigits = f.q.replace(/\D/g, "");
  return leads.filter((l) => {
    if (f.plano && l.plano !== f.plano) return false;
    if (f.responsavel === "_none" && l.responsavel) return false;
    if (f.responsavel && f.responsavel !== "_none" && l.responsavel !== f.responsavel) return false;
    if (q) {
      const hay = norm(`${l.nome} ${l.empresa} ${l.whatsapp}`);
      // Busca por telefone também funciona com máscara: "(51) 99..." acha "5199...".
      if (!hay.includes(q) && !(qDigits.length >= 3 && l.whatsapp.includes(qDigits))) return false;
    }
    return true;
  });
}

export type FollowUp = { tipo: "atrasado" | "hoje" | "futuro"; data: string } | null;

export function followUp(l: Lead, hoje: string = today()): FollowUp {
  if (!l.proximo_contato || l.status === "fechado" || l.status === "perdido") return null;
  if (l.proximo_contato < hoje) return { tipo: "atrasado", data: l.proximo_contato };
  if (l.proximo_contato === hoje) return { tipo: "hoje", data: l.proximo_contato };
  return { tipo: "futuro", data: l.proximo_contato };
}

export interface Metricas {
  novos: number;
  negociacao: number;
  negociacaoValor: number;
  fechadosMes: number;
  fechadosMesValor: number;
  fechados: number;
  perdidos: number;
  /** null quando ainda não há fechados nem perdidos. */
  taxa: number | null;
  atrasados: number;
}

export function computeMetrics(list: Lead[], hoje: string = today()): Metricas {
  const mes = hoje.slice(0, 7);
  const neg = list.filter((l) => l.status === "em_contato" || l.status === "proposta");
  const fechMes = list.filter((l) => l.status === "fechado" && l.updated_at.slice(0, 7) === mes);
  const fechados = list.filter((l) => l.status === "fechado").length;
  const perdidos = list.filter((l) => l.status === "perdido").length;
  const soma = (xs: Lead[]) => xs.reduce((s, l) => s + (Number(l.valor) || 0), 0);
  return {
    novos: list.filter((l) => l.status === "novo").length,
    negociacao: neg.length,
    negociacaoValor: soma(neg),
    fechadosMes: fechMes.length,
    fechadosMesValor: soma(fechMes),
    fechados,
    perdidos,
    taxa: fechados + perdidos ? Math.round((fechados / (fechados + perdidos)) * 100) : null,
    atrasados: list.filter((l) => followUp(l, hoje)?.tipo === "atrasado").length,
  };
}

/** Texto curto de onde o lead veio, usado na gaveta e na exportação. */
export function describeOrigem(l: Lead): string {
  const o = l.origem ?? {};
  const partes: string[] = [];
  if (o.canal) partes.push(o.canal + (o.manual ? " (cadastro manual)" : ""));
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const) {
    if (o[k]) partes.push(`${k.replace("utm_", "")}: ${o[k]}`);
  }
  if (o.gclid) partes.push("Google Ads");
  if (o.fbclid) partes.push("Facebook/Instagram");
  if (!partes.length) partes.push(o.referrer ? `veio de ${o.referrer}` : "acesso direto ao site");
  return partes.join(" · ");
}

const BOM = String.fromCharCode(0xfeff);

/** CSV para Excel em pt-BR: separador ";" e BOM para os acentos abrirem certo. */
export function buildCsv(leads: Lead[], equipe: Membro[]): string {
  const rows: string[][] = [["Nome", "Empresa", "WhatsApp", "Interesse", "Etapa", "Responsável", "Valor", "Próximo contato", "Recebido em", "Origem"]];
  for (const l of leads) {
    rows.push([
      l.nome,
      l.empresa,
      formatBrPhone(l.whatsapp),
      planoCurto(l.plano),
      STATUS_NOME[l.status] ?? l.status,
      membroNome(equipe, l.responsavel),
      l.valor == null ? "" : String(l.valor).replace(".", ","),
      l.proximo_contato ? l.proximo_contato.split("-").reverse().join("/") : "",
      dataHora(l.created_at),
      l.origem?.canal || l.origem?.utm_source || "",
    ]);
  }
  // Prefixo ' evita que o Excel execute fórmulas digitadas no formulário (=, +, -, @).
  const cell = (c: string) => {
    const safe = /^[=+\-@\t\r]/.test(c) ? `'${c}` : c;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  return BOM + rows.map((r) => r.map(cell).join(";")).join("\r\n");
}

