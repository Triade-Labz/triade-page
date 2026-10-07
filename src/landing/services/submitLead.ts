import { LIMITES, type LeadInsertPublico, type LeadOrigem, type Plano } from "../../shared/leads";
import { normalizeBrPhone } from "../../shared/phone";
import { supabaseConfig, type SupabaseConfigResult } from "../../shared/supabaseConfig";
import { cleanText, type LeadFormValues } from "../../shared/validation";

/**
 * Envio do formulário do site para a tabela public.leads, que é a mesma que o
 * painel do CRM lê. O site usa a chave publicável com o papel "anon", que no
 * banco só tem permissão de INSERIR (database/04-permissoes-site-crm.sql).
 *
 * É um fetch simples, sem a biblioteca do Supabase, para a landing continuar leve.
 */

export type LeadSubmitErrorKind = "config" | "network" | "timeout" | "permission" | "rejected" | "server";

export class LeadSubmitError extends Error {
  readonly kind: LeadSubmitErrorKind;
  readonly status: number | undefined;
  readonly code: string | undefined;

  constructor(kind: LeadSubmitErrorKind, message: string, status?: number, code?: string) {
    super(message);
    this.name = "LeadSubmitError";
    this.kind = kind;
    this.status = status;
    this.code = code;
  }
}

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"] as const;

interface PageContext {
  search: string;
  pathname: string;
  referrer: string;
  origin: string;
}

function currentPage(): PageContext {
  return { search: location.search, pathname: location.pathname, referrer: document.referrer, origin: location.origin };
}

/** Campanha e página de onde o lead veio (o CRM e o e-mail de aviso mostram isso). */
export function collectOrigem(page: PageContext = currentPage()): LeadOrigem {
  const q = new URLSearchParams(page.search);
  const origem: LeadOrigem = {};
  for (const k of UTM_KEYS) {
    const v = q.get(k);
    if (v) origem[k] = v.slice(0, 200);
  }
  origem.pagina = page.pathname.slice(0, 200);
  // Navegar entre páginas do próprio site não é "origem": só registra quem trouxe a visita.
  if (page.referrer && !page.referrer.startsWith(page.origin)) origem.referrer = page.referrer.slice(0, 300);
  return origem;
}

export function buildLeadPayload(values: LeadFormValues & { plano: Plano }, now: Date, origem: LeadOrigem): LeadInsertPublico {
  return {
    nome: cleanText(values.nome).slice(0, LIMITES.nome.max),
    empresa: cleanText(values.empresa).slice(0, LIMITES.empresa.max),
    whatsapp: normalizeBrPhone(values.whatsapp),
    plano: values.plano,
    consentimento_em: now.toISOString(),
    origem,
  };
}

interface PostgrestError {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

async function readError(res: Response): Promise<PostgrestError> {
  try {
    return (await res.json()) as PostgrestError;
  } catch {
    return {};
  }
}

function toSubmitError(status: number, body: PostgrestError): LeadSubmitError {
  const msg = body.message || `HTTP ${status}`;
  // 42501 = sem GRANT na tabela ou bloqueado pela RLS. Era o que impedia os leads de chegarem ao CRM.
  if (body.code === "42501" || status === 401 || status === 403) {
    return new LeadSubmitError(
      "permission",
      `${msg}. O banco recusou o lead: rode database/04-permissoes-site-crm.sql no SQL Editor do Supabase e confira se a chave é a publishable/anon do mesmo projeto.`,
      status,
      body.code,
    );
  }
  // Tabela inexistente no projeto configurado (ou URL de outro projeto).
  if (body.code === "PGRST205" || body.code === "42P01" || status === 404) {
    return new LeadSubmitError("config", `${msg}. A tabela public.leads não existe neste projeto: rode database/01-tabela-leads.sql.`, status, body.code);
  }
  // Violação de CHECK/NOT NULL/tipo: o dado não passou nas regras do banco.
  if (body.code?.startsWith("23") || body.code === "22P02" || status === 400) {
    return new LeadSubmitError("rejected", `${msg}${body.details ? ` (${body.details})` : ""}`, status, body.code);
  }
  return new LeadSubmitError("server", msg, status, body.code);
}

export interface InsertOptions {
  config?: SupabaseConfigResult;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export async function insertLead(payload: LeadInsertPublico, opts: InsertOptions = {}): Promise<void> {
  const cfg = opts.config ?? supabaseConfig;
  if (!cfg.ok) throw new LeadSubmitError("config", cfg.message);
  const { url, key, legacyJwtKey } = cfg.config;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: key,
    // O site não tem permissão de leitura: pedir o registro de volta faria o insert falhar.
    Prefer: "return=minimal",
  };
  // Chaves novas (sb_publishable_...) não são JWT e não podem ir no Authorization.
  if (legacyJwtKey) headers.Authorization = `Bearer ${key}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 15000);
  let res: Response;
  try {
    res = await (opts.fetchImpl ?? fetch)(`${url}/rest/v1/leads`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
      keepalive: true,
    });
  } catch (err) {
    if (controller.signal.aborted) throw new LeadSubmitError("timeout", "O servidor demorou demais para responder.");
    throw new LeadSubmitError("network", err instanceof Error ? err.message : "Falha de rede");
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) throw toSubmitError(res.status, await readError(res));
}
