import type { Plano } from "../../shared/leads";
import { ETAPAS, ETAPA_INFO, SITUACAO_NOME, type Projeto, type ProjetoInsert, type ProjetoNota, type Tarefa } from "../../shared/projetos";
import { DEMO_EQUIPE, DEMO_EU, demoAuth, later } from "../../painel/api/demo";
import { ymd } from "../../painel/lib/format";
import { modeloDoPlano } from "../lib/modelos";
import type { ProjetosApi, ProjetosChange } from "./types";

/** Versão em memória do banco, para desenvolver e demonstrar sem Supabase. Nada é salvo. */
export interface DemoProjetosApi extends ProjetosApi {
  /** Simula um lead passando para "Fechado" no CRM. */
  simulate(): void;
}

const NOMES: Record<Plano, string> = {
  essencial: "Landing page",
  profissional: "Landing page + aplicação",
  completo: "Projeto completo",
  suporte: "Suporte em TI",
  seguranca: "Análise de vulnerabilidades",
  duvida: "Projeto",
};

export function createDemoApi(): DemoProjetosApi {
  let seq = 0;
  let listener: ((c: ProjetosChange) => void) | null = null;
  const uid = () => `demo-${++seq}`;
  const agora = () => new Date().toISOString();
  const dias = (n: number) => ymd(new Date(Date.now() + n * 864e5));
  const [eu, socio2, socio3] = DEMO_EQUIPE.map((m) => m.email);

  let projetos: Projeto[] = [];
  let tarefas: Tarefa[] = [];
  let notas: ProjetoNota[] = [];

  const nota = (projeto_id: string, tipo: ProjetoNota["tipo"], texto: string, autor = DEMO_EU): ProjetoNota => {
    const n: ProjetoNota = { id: uid(), projeto_id, created_at: agora(), autor, tipo, texto };
    notas.push(n);
    return n;
  };

  /** O que o banco faz ao criar um projeto: checklist do plano + histórico. */
  function aplicar(p: Projeto): Tarefa[] {
    const novas = modeloDoPlano(p.plano)
      .filter((m) => !tarefas.some((t) => t.projeto_id === p.id && t.etapa === m.etapa && t.titulo === m.titulo))
      .map((m): Tarefa => ({ id: uid(), projeto_id: p.id, created_at: agora(), ...m, feita: false, feita_em: null, feita_por: null }));
    tarefas.push(...novas);
    return novas;
  }

  function criar(row: ProjetoInsert & Partial<Projeto>): { p: Projeto; ts: Tarefa[] } {
    const now = agora();
    const p: Projeto = {
      id: uid(),
      created_at: now,
      updated_at: now,
      lead_id: null,
      whatsapp: null,
      etapa: "escopo",
      situacao: "andamento",
      responsavel: null,
      inicio: dias(0),
      prazo: null,
      concluido_em: null,
      objetivo: "",
      requisitos: "",
      fora_escopo: "",
      links: "",
      ...row,
    };
    projetos = [p, ...projetos];
    const ts = aplicar(p);
    nota(p.id, "sistema", p.lead_id ? "Contrato fechado no CRM: projeto criado automaticamente com o checklist do plano." : "Projeto criado com o checklist do plano.");
    return { p, ts };
  }

  /** Exemplo já andando: tarefas das etapas anteriores feitas, mais `extras` da etapa atual. */
  function exemplo(row: ProjetoInsert & Partial<Projeto>, extras = 0) {
    const { p, ts } = criar(row);
    const atual = ETAPAS.indexOf(p.etapa);
    let restantes = extras;
    for (const t of ts) {
      const i = ETAPAS.indexOf(t.etapa);
      if (i < atual || (i === atual && restantes-- > 0)) Object.assign(t, { feita: true, feita_em: agora(), feita_por: p.responsavel ?? DEMO_EU });
    }
  }

  exemplo({ nome: "Suporte em TI — Teixeira Contabilidade", cliente: "Marcos Teixeira", empresa: "Teixeira Contabilidade", plano: "suporte", whatsapp: "51990002222", lead_id: "demo-lead-1" });
  exemplo(
    {
      nome: "Landing page — Padaria Pão Quente",
      cliente: "Ana Ribeiro",
      empresa: "Padaria Pão Quente",
      plano: "essencial",
      whatsapp: "51990001111",
      etapa: "landing",
      responsavel: eu ?? null,
      inicio: dias(-6),
      prazo: dias(5),
      lead_id: "demo-lead-2",
      objetivo: "Página para divulgar as encomendas de bolos e receber pedidos pelo WhatsApp.",
      requisitos: "Página única com cardápio, fotos dos produtos, horário de funcionamento, mapa e botão de WhatsApp.\nFormulário de encomenda.",
      fora_escopo: "Loja virtual com pagamento online.\nFotos profissionais (o cliente envia).",
      links: "Instagram da padaria: @paoquente",
    },
    2,
  );
  exemplo(
    {
      nome: "Projeto completo — Studio Carla Souza",
      cliente: "Carla Souza",
      empresa: "Studio Carla Souza",
      plano: "completo",
      whatsapp: "51990005555",
      etapa: "design",
      situacao: "aguardando",
      responsavel: socio2 ?? null,
      inicio: dias(-10),
      prazo: dias(35),
      objetivo: "Site com agendamento online e área do cliente.",
    },
    1,
  );
  exemplo({
    nome: "Análise de vulnerabilidades — Lima Transportes",
    cliente: "Rafael Lima",
    empresa: "Lima Transportes",
    plano: "seguranca",
    etapa: "seguranca",
    responsavel: socio3 ?? null,
    inicio: dias(-12),
    prazo: dias(-2),
  });
  exemplo({
    nome: "Landing page + aplicação — Nunes Advocacia",
    cliente: "Pedro Nunes",
    empresa: "Nunes Advocacia",
    plano: "profissional",
    etapa: "concluido",
    responsavel: eu ?? null,
    inicio: dias(-40),
    prazo: dias(-3),
    concluido_em: new Date(Date.now() - 3 * 864e5).toISOString(),
  });

  const find = <T extends { id: string }>(xs: T[], id: string): T => {
    const x = xs.find((i) => i.id === id);
    if (!x) throw new Error("Registro não encontrado");
    return x;
  };

  return {
    ...demoAuth(),

    projetos: () => later(projetos),
    tarefas: (projetoId) => later(projetoId ? tarefas.filter((t) => t.projeto_id === projetoId) : tarefas),

    createProjeto: async (row) => later(criar(row).p),
    updateProjeto: async (id, patch) => {
      const p = find(projetos, id);
      const antes = { ...p };
      Object.assign(p, patch, { updated_at: agora() });
      if (patch.etapa && patch.etapa !== antes.etapa) {
        nota(id, "etapa", `${ETAPA_INFO[antes.etapa].nome} → ${ETAPA_INFO[patch.etapa].nome}`);
        p.concluido_em = patch.etapa === "concluido" ? agora() : null;
      }
      if (patch.situacao && patch.situacao !== antes.situacao) nota(id, "etapa", `Situação: ${SITUACAO_NOME[antes.situacao]} → ${SITUACAO_NOME[patch.situacao]}`);
      return later(p);
    },
    removeProjeto: async (id) => {
      projetos = projetos.filter((p) => p.id !== id);
      tarefas = tarefas.filter((t) => t.projeto_id !== id);
      notas = notas.filter((n) => n.projeto_id !== id);
      return later(undefined);
    },

    addTarefa: async (row) => {
      const t: Tarefa = { id: uid(), created_at: agora(), ordem: 1000, feita: false, feita_em: null, feita_por: null, ...row };
      tarefas.push(t);
      return later(t);
    },
    updateTarefa: async (id, patch) => {
      const t = find(tarefas, id);
      if (patch.feita !== undefined && patch.feita !== t.feita) Object.assign(t, { feita_em: patch.feita ? agora() : null, feita_por: patch.feita ? DEMO_EU : null });
      Object.assign(t, patch);
      return later(t);
    },
    removeTarefa: async (id) => {
      tarefas = tarefas.filter((t) => t.id !== id);
      return later(undefined);
    },
    aplicarModelo: async (projetoId) => later(aplicar(find(projetos, projetoId)).length),

    notas: (projetoId) => later(notas.filter((n) => n.projeto_id === projetoId).sort((a, b) => b.created_at.localeCompare(a.created_at))),
    addNota: async (projetoId, texto) => later(nota(projetoId, "nota", texto)),
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
      const clientes: [string, string, Plano][] = [
        ["Lucas Martins", "Martins Pet Shop", "essencial"],
        ["Fernanda Costa", "Costa Imóveis", "profissional"],
        ["Diego Rocha", "Rocha Engenharia", "completo"],
        ["Patrícia Gomes", "Gomes Estética", "seguranca"],
      ];
      const [cliente, empresa, plano] = clientes[Math.floor(Math.random() * clientes.length)] ?? ["Lucas Martins", "Martins Pet Shop", "essencial"];
      const { p, ts } = criar({
        nome: `${NOMES[plano]} — ${empresa}`,
        cliente,
        empresa,
        plano,
        whatsapp: "51990009999",
        lead_id: `demo-lead-${uid()}`,
        responsavel: socio2 ?? null,
        prazo: plano === "essencial" ? dias(15) : null,
      });
      listener?.({ tabela: "projetos", type: "INSERT", row: structuredClone(p) });
      for (const t of ts) listener?.({ tabela: "tarefas", type: "INSERT", row: structuredClone(t) });
    },
  };
}
