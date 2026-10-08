import type { Lead, LeadOrigem, LeadStatus, Plano } from "../../shared/leads";
import { DEMO_EU, demoAuth, later } from "../../painel/api/demo";
import { ymd } from "../../painel/lib/format";
import type { CrmApi, LeadChange, Nota } from "./types";

/** Versão em memória do banco, para desenvolver e demonstrar o CRM sem Supabase. Nada é salvo. */
export interface DemoApi extends CrmApi {
  /** Simula um pedido chegando pelo formulário do site. */
  simulate(): void;
}

export function createDemoApi(): DemoApi {
  let seq = 0;
  let listener: ((c: LeadChange) => void) | null = null;
  const uid = () => `demo-${++seq}`;
  const horas = (n: number) => new Date(Date.now() - n * 3600e3).toISOString();
  const dias = (n: number) => ymd(new Date(Date.now() + n * 864e5));

  const L = (nome: string, empresa: string, whatsapp: string, plano: Plano, status: LeadStatus, h: number, extra: Partial<Lead> = {}): Lead => ({
    id: uid(),
    nome,
    empresa,
    whatsapp,
    plano,
    status,
    created_at: horas(h),
    updated_at: horas(h),
    consentimento_em: horas(h),
    origem: { pagina: "/" } as LeadOrigem,
    responsavel: null,
    valor: null,
    proximo_contato: null,
    ...extra,
  });

  let leads: Lead[] = [
    L("Ana Ribeiro", "Padaria Pão Quente", "51990001111", "essencial", "novo", 0.4, { origem: { utm_source: "instagram", utm_medium: "cpc", pagina: "/" } }),
    L("Marcos Teixeira", "Teixeira Contabilidade", "51990002222", "suporte", "novo", 5),
    L("Juliana Prates", "Clínica Bem Viver", "51990003333", "profissional", "em_contato", 30, { responsavel: "socio1@exemplo.com", proximo_contato: dias(0) }),
    L("Rafael Lima", "Lima Transportes", "51990004444", "seguranca", "em_contato", 52, { responsavel: "socio3@exemplo.com", proximo_contato: dias(-2) }),
    L("Carla Souza", "Studio Carla Souza", "51990005555", "completo", "proposta", 96, { responsavel: "socio2@exemplo.com", valor: 6990, proximo_contato: dias(3) }),
    L("Pedro Nunes", "Nunes Advocacia", "51990006666", "essencial", "fechado", 240, { responsavel: "socio1@exemplo.com", valor: 1490 }),
    L("Beatriz Alves", "Loja Alves", "51990007777", "duvida", "perdido", 400, { responsavel: "socio2@exemplo.com" }),
  ];
  const juliana = leads[2]?.id ?? "";
  let notas: Nota[] = [
    { id: uid(), lead_id: juliana, created_at: horas(28), autor: "socio1@exemplo.com", tipo: "status", texto: "Novo → Em contato" },
    { id: uid(), lead_id: juliana, created_at: horas(27), autor: "socio1@exemplo.com", tipo: "nota", texto: "Quer agendamento online. Pedi exemplos de sites que ela gosta." },
  ];

  const find = (id: string) => {
    const l = leads.find((x) => x.id === id);
    if (!l) throw new Error("Lead não encontrado");
    return l;
  };

  return {
    ...demoAuth(),
    leads: () => later(leads),
    update: async (id, patch) => {
      const l = find(id);
      Object.assign(l, patch, { updated_at: new Date().toISOString() });
      return later(l);
    },
    create: async (row) => {
      const now = new Date().toISOString();
      const l: Lead = { id: uid(), created_at: now, updated_at: now, status: "novo", valor: null, proximo_contato: null, ...row, responsavel: row.responsavel ?? null };
      leads = [l, ...leads];
      return later(l);
    },
    remove: async (id) => {
      leads = leads.filter((l) => l.id !== id);
      notas = notas.filter((n) => n.lead_id !== id);
      return later(undefined);
    },

    notas: (leadId) => later(notas.filter((n) => n.lead_id === leadId).sort((a, b) => b.created_at.localeCompare(a.created_at))),
    addNota: async (leadId, texto, tipo) => {
      const n: Nota = { id: uid(), lead_id: leadId, texto, tipo, autor: DEMO_EU, created_at: new Date().toISOString() };
      notas.push(n);
      return later(n);
    },
    delNota: async (id) => {
      notas = notas.filter((n) => n.id !== id);
      return later(undefined);
    },

    subscribe(onChange, onState) {
      listener = onChange;
      onState("on");
      return () => {
        listener = null;
      };
    },

    simulate() {
      const pessoas: [string, string][] = [
        ["Lucas Martins", "Martins Pet Shop"],
        ["Fernanda Costa", "Costa Imóveis"],
        ["Diego Rocha", "Rocha Engenharia"],
        ["Patrícia Gomes", "Gomes Estética"],
      ];
      const planos: Plano[] = ["essencial", "profissional", "suporte", "seguranca"];
      const [nome, empresa] = pessoas[Math.floor(Math.random() * pessoas.length)] ?? ["Lucas Martins", "Martins Pet Shop"];
      const l = L(nome, empresa, `5199${String(Math.floor(1000000 + Math.random() * 8999999))}`, planos[Math.floor(Math.random() * planos.length)] ?? "essencial", "novo", 0, {
        origem: { utm_source: "google", pagina: "/" },
      });
      leads = [l, ...leads];
      listener?.({ type: "INSERT", lead: structuredClone(l) });
    },
  };
}
