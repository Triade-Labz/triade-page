import type { Projeto, Tarefa } from "../../shared/projetos";
import { modeloDoPlano } from "./modelos";
import { addDias, computeMetricas, filterProjetos, prazoInfo, progresso, proximaEtapa, textoEscopo } from "./projetos";

const HOJE = "2026-10-07";

const P = (extra: Partial<Projeto> = {}): Projeto => ({
  id: "p1",
  created_at: "2026-10-01T12:00:00Z",
  updated_at: "2026-10-01T12:00:00Z",
  lead_id: null,
  nome: "Landing page — Padaria",
  cliente: "Ana",
  empresa: "Padaria",
  whatsapp: null,
  plano: "essencial",
  etapa: "escopo",
  situacao: "andamento",
  responsavel: null,
  inicio: "2026-10-01",
  prazo: null,
  concluido_em: null,
  objetivo: "",
  requisitos: "",
  fora_escopo: "",
  links: "",
  ...extra,
});

const tarefasDo = (projeto: Projeto, feitas = 0): Tarefa[] =>
  modeloDoPlano(projeto.plano).map((m, i) => ({
    id: `t${i}`,
    projeto_id: projeto.id,
    created_at: projeto.created_at,
    ...m,
    feita: i < feitas,
    feita_em: null,
    feita_por: null,
  }));

describe("checklist padrão", () => {
  it("cada plano tem as etapas do que foi contratado", () => {
    const etapas = (plano: Projeto["plano"]) => [...new Set(modeloDoPlano(plano).map((t) => t.etapa))];
    expect(etapas("essencial")).toEqual(["escopo", "landing", "entrega"]);
    expect(etapas("profissional")).toEqual(["escopo", "landing", "backend", "entrega"]);
    expect(etapas("completo")).toEqual(["escopo", "design", "landing", "backend", "seguranca", "entrega"]);
    expect(etapas("seguranca")).toEqual(["escopo", "seguranca", "entrega"]);
  });

  it("análise de vulnerabilidades exige autorização por escrito do cliente", () => {
    expect(modeloDoPlano("seguranca").some((t) => /autorização por escrito/i.test(t.titulo))).toBe(true);
  });
});

describe("proximaEtapa", () => {
  it("pula as etapas que não fazem parte do plano", () => {
    const p = P({ plano: "essencial", etapa: "landing" });
    expect(proximaEtapa(p, tarefasDo(p))).toBe("entrega");
    expect(proximaEtapa(P({ plano: "essencial", etapa: "escopo" }), tarefasDo(p))).toBe("landing");
  });

  it("da última etapa com tarefas vai para Concluído; concluído não avança", () => {
    const p = P({ etapa: "entrega" });
    expect(proximaEtapa(p, tarefasDo(p))).toBe("concluido");
    expect(proximaEtapa(P({ etapa: "concluido" }), tarefasDo(p))).toBeNull();
  });

  it("sem tarefas, segue a ordem das etapas", () => {
    expect(proximaEtapa(P({ etapa: "escopo" }), [])).toBe("design");
  });
});

describe("prazo e métricas", () => {
  it("classifica o prazo e ignora projetos encerrados", () => {
    expect(prazoInfo(P({ prazo: "2026-10-06" }), HOJE)?.tipo).toBe("atrasado");
    expect(prazoInfo(P({ prazo: HOJE }), HOJE)?.tipo).toBe("hoje");
    expect(prazoInfo(P({ prazo: addDias(HOJE, 7) }), HOJE)?.tipo).toBe("semana");
    expect(prazoInfo(P({ prazo: addDias(HOJE, 8) }), HOJE)?.tipo).toBe("futuro");
    expect(prazoInfo(P({ prazo: "2026-10-01", etapa: "concluido" }), HOJE)).toBeNull();
    expect(prazoInfo(P({ prazo: "2026-10-01", situacao: "cancelado" }), HOJE)).toBeNull();
  });

  it("addDias atravessa meses", () => {
    expect(addDias("2026-10-28", 7)).toBe("2026-11-04");
  });

  it("conta ativos, atrasados, entregas da semana, aguardando e concluídos no mês", () => {
    const m = computeMetricas(
      [
        P({ id: "a", prazo: "2026-10-01" }),
        P({ id: "b", prazo: "2026-10-09", situacao: "aguardando" }),
        P({ id: "c", etapa: "concluido", concluido_em: "2026-10-03T15:00:00Z" }),
        P({ id: "d", situacao: "cancelado", prazo: "2026-10-01" }),
      ],
      HOJE,
    );
    expect(m).toEqual({ ativos: 2, atrasados: 1, semana: 1, aguardando: 1, concluidosMes: 1 });
  });

  it("progresso em porcentagem", () => {
    const p = P();
    expect(progresso(tarefasDo(p, 3))).toEqual({ feitas: 3, total: modeloDoPlano("essencial").length, pct: Math.round((3 / modeloDoPlano("essencial").length) * 100) });
    expect(progresso([])).toEqual({ feitas: 0, total: 0, pct: 0 });
  });
});

describe("filtros", () => {
  const lista = [
    P({ id: "1", nome: "Site — Clínica Sorriso", cliente: "José", responsavel: "a@x.com" }),
    P({ id: "2", nome: "Landing", cliente: "Márcia", empresa: "Ótica Visão", situacao: "cancelado" }),
    P({ id: "3", nome: "Suporte", cliente: "Rui", situacao: "pausado" }),
  ];
  const ids = (xs: Projeto[]) => xs.map((p) => p.id);

  it("por padrão esconde cancelados", () => {
    expect(ids(filterProjetos(lista, { q: "", responsavel: "", situacao: "ativos" }))).toEqual(["1", "3"]);
    expect(ids(filterProjetos(lista, { q: "", responsavel: "", situacao: "todos" }))).toEqual(["1", "2", "3"]);
    expect(ids(filterProjetos(lista, { q: "", responsavel: "", situacao: "cancelado" }))).toEqual(["2"]);
  });

  it("busca sem acento por projeto, cliente ou empresa; filtra responsável", () => {
    expect(ids(filterProjetos(lista, { q: "otica", responsavel: "", situacao: "todos" }))).toEqual(["2"]);
    expect(ids(filterProjetos(lista, { q: "clinica", responsavel: "", situacao: "ativos" }))).toEqual(["1"]);
    expect(ids(filterProjetos(lista, { q: "", responsavel: "_none", situacao: "ativos" }))).toEqual(["3"]);
  });
});

describe("textoEscopo", () => {
  it("monta o texto para o cliente com escopo e etapas", () => {
    const p = P({ objetivo: "Divulgar encomendas.", requisitos: "Cardápio\nMapa", prazo: "2026-10-22" });
    const txt = textoEscopo(p, tarefasDo(p, 1));
    expect(txt).toContain("ESCOPO DO PROJETO — Landing page — Padaria");
    expect(txt).toContain("Prazo: 22/10/2026");
    expect(txt).toContain("OBJETIVO\nDivulgar encomendas.");
    expect(txt).toContain("O QUE ESTÁ INCLUÍDO\nCardápio\nMapa");
    expect(txt).toContain("FORA DO ESCOPO\n(a definir)");
    expect(txt).toContain("1. Escopo\n   ✓ Reunião de levantamento de requisitos");
    expect(txt).toContain("2. Landing page");
  });
});
