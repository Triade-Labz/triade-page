import { PLANO_INFO } from "../../shared/leads";
import { ETAPAS, ETAPAS_TRABALHO, ETAPA_INFO, type Etapa, type EtapaTrabalho, type Projeto, type Situacao, type Tarefa } from "../../shared/projetos";
import { norm, today, ymd } from "../../painel/lib/format";

export const etapaNome = (e: Etapa) => ETAPA_INFO[e].nome;

/** Segunda linha do card: cliente, e a empresa se ela ainda não estiver no nome do projeto. */
export function clienteLinha(p: Projeto): string {
  return p.empresa && !p.nome.includes(p.empresa) ? `${p.cliente} · ${p.empresa}` : p.cliente;
}

/** "2026-10-06" -> "06/10/2026" */
export function dataBr(isoDate: string | null | undefined): string {
  if (!isoDate) return "";
  const [a, m, d] = isoDate.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

export function addDias(isoDate: string, n: number): string {
  const [a, m, d] = isoDate.split("-").map(Number);
  return ymd(new Date(a ?? 1970, (m ?? 1) - 1, (d ?? 1) + n));
}

export function ordenarTarefas(ts: Tarefa[]): Tarefa[] {
  const idx = (e: EtapaTrabalho) => ETAPAS_TRABALHO.indexOf(e);
  return [...ts].sort((a, b) => idx(a.etapa) - idx(b.etapa) || a.ordem - b.ordem || a.created_at.localeCompare(b.created_at));
}

export function tarefasPorProjeto(ts: Tarefa[]): Map<string, Tarefa[]> {
  const m = new Map<string, Tarefa[]>();
  for (const t of ts) {
    const list = m.get(t.projeto_id);
    if (list) list.push(t);
    else m.set(t.projeto_id, [t]);
  }
  return m;
}

export type Progresso = { feitas: number; total: number; pct: number };

export function progresso(ts: readonly Tarefa[]): Progresso {
  const feitas = ts.filter((t) => t.feita).length;
  return { feitas, total: ts.length, pct: ts.length ? Math.round((feitas / ts.length) * 100) : 0 };
}

const encerrado = (p: Projeto) => p.etapa === "concluido" || p.situacao === "cancelado";

export type PrazoInfo = { tipo: "atrasado" | "hoje" | "semana" | "futuro"; data: string } | null;

export function prazoInfo(p: Projeto, hoje: string = today()): PrazoInfo {
  if (!p.prazo || encerrado(p)) return null;
  if (p.prazo < hoje) return { tipo: "atrasado", data: p.prazo };
  if (p.prazo === hoje) return { tipo: "hoje", data: p.prazo };
  if (p.prazo <= addDias(hoje, 7)) return { tipo: "semana", data: p.prazo };
  return { tipo: "futuro", data: p.prazo };
}

/**
 * Para onde o botão "Avançar" leva: a próxima etapa que tem tarefas neste projeto
 * (pula as que não fazem parte do plano). Sem tarefas, vai para a etapa seguinte.
 */
export function proximaEtapa(p: Projeto, ts: readonly Tarefa[]): Etapa | null {
  const i = ETAPAS.indexOf(p.etapa);
  if (p.etapa === "concluido") return null;
  if (!ts.length) return ETAPAS[i + 1] ?? null;
  const comTarefas = new Set(ts.map((t) => t.etapa));
  return ETAPAS.slice(i + 1).find((e) => e === "concluido" || comTarefas.has(e)) ?? "concluido";
}

export type FiltroSituacao = "ativos" | "todos" | Situacao;

export interface Filtros {
  q: string;
  /** "" = todos, "_none" = sem responsável, ou o e-mail. */
  responsavel: string;
  situacao: FiltroSituacao;
}

export function filterProjetos(list: Projeto[], f: Filtros): Projeto[] {
  const q = norm(f.q.trim());
  return list.filter((p) => {
    if (f.situacao === "ativos" && p.situacao === "cancelado") return false;
    if (f.situacao !== "ativos" && f.situacao !== "todos" && p.situacao !== f.situacao) return false;
    if (f.responsavel === "_none" && p.responsavel) return false;
    if (f.responsavel && f.responsavel !== "_none" && p.responsavel !== f.responsavel) return false;
    if (q && !norm(`${p.nome} ${p.cliente} ${p.empresa}`).includes(q)) return false;
    return true;
  });
}

export interface Metricas {
  ativos: number;
  atrasados: number;
  semana: number;
  aguardando: number;
  concluidosMes: number;
}

export function computeMetricas(list: Projeto[], hoje: string = today()): Metricas {
  const ativos = list.filter((p) => !encerrado(p));
  const mes = hoje.slice(0, 7);
  return {
    ativos: ativos.length,
    atrasados: ativos.filter((p) => prazoInfo(p, hoje)?.tipo === "atrasado").length,
    semana: ativos.filter((p) => {
      const t = prazoInfo(p, hoje)?.tipo;
      return t === "hoje" || t === "semana";
    }).length,
    aguardando: ativos.filter((p) => p.situacao === "aguardando").length,
    // concluido_em é UTC; a data local evita que um projeto concluído às 22h do dia 31 caia no mês seguinte.
    concluidosMes: list.filter((p) => p.etapa === "concluido" && p.concluido_em && ymd(new Date(p.concluido_em)).slice(0, 7) === mes).length,
  };
}

/** Escopo em texto, para mandar ao cliente (WhatsApp/e-mail) ou colar na proposta. */
export function textoEscopo(p: Projeto, ts: readonly Tarefa[]): string {
  const bloco = (titulo: string, texto: string) => `${titulo}\n${texto.trim() || "(a definir)"}`;
  const datas = [`Início: ${dataBr(p.inicio)}`, p.prazo ? `Prazo: ${dataBr(p.prazo)}` : ""].filter(Boolean).join(" · ");
  const etapas = ETAPAS_TRABALHO.map((e) => [e, ordenarTarefas(ts.filter((t) => t.etapa === e))] as const)
    .filter(([, list]) => list.length)
    .map(([e, list], i) => `${i + 1}. ${etapaNome(e)}\n${list.map((t) => `   ${t.feita ? "✓" : "•"} ${t.titulo}`).join("\n")}`);
  return [
    `ESCOPO DO PROJETO — ${p.nome}`,
    `Cliente: ${p.cliente}${p.empresa ? ` (${p.empresa})` : ""}`,
    `Plano: ${PLANO_INFO[p.plano].rotulo}`,
    datas,
    "",
    bloco("OBJETIVO", p.objetivo),
    "",
    bloco("O QUE ESTÁ INCLUÍDO", p.requisitos),
    "",
    bloco("FORA DO ESCOPO", p.fora_escopo),
    ...(etapas.length ? ["", "ETAPAS", ...etapas] : []),
    "",
    "Tríade Labs",
  ].join("\n");
}
