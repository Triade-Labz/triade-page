import type { Lead } from "../../shared/leads";
import { errMsg } from "../../painel/lib/errors";
import { parseValor } from "../../painel/lib/format";
import { buildCsv, computeMetrics, describeOrigem, filterLeads, followUp } from "./leads";

const base: Lead = {
  id: "1",
  created_at: "2026-10-01T10:00:00Z",
  updated_at: "2026-10-01T10:00:00Z",
  nome: "Ana Ribeiro",
  empresa: "Padaria Pão Quente",
  whatsapp: "51990001111",
  plano: "essencial",
  consentimento_em: "2026-10-01T10:00:00Z",
  origem: { pagina: "/" },
  status: "novo",
  responsavel: null,
  valor: null,
  proximo_contato: null,
};
const L = (p: Partial<Lead>): Lead => ({ ...base, ...p });

describe("filterLeads", () => {
  const leads = [
    L({ id: "a" }),
    L({ id: "b", nome: "José Araújo", empresa: "Oficina", whatsapp: "51988887777", plano: "suporte", responsavel: "s1@x.com" }),
  ];
  const all = { q: "", plano: "" as const, responsavel: "" };

  it("busca sem acento e por telefone com máscara", () => {
    expect(filterLeads(leads, { ...all, q: "jose araujo" }).map((l) => l.id)).toEqual(["b"]);
    expect(filterLeads(leads, { ...all, q: "pao" }).map((l) => l.id)).toEqual(["a"]);
    expect(filterLeads(leads, { ...all, q: "(51) 98888" }).map((l) => l.id)).toEqual(["b"]);
  });

  it("filtra por interesse e responsável", () => {
    expect(filterLeads(leads, { ...all, plano: "suporte" }).map((l) => l.id)).toEqual(["b"]);
    expect(filterLeads(leads, { ...all, responsavel: "_none" }).map((l) => l.id)).toEqual(["a"]);
    expect(filterLeads(leads, { ...all, responsavel: "s1@x.com" }).map((l) => l.id)).toEqual(["b"]);
  });
});

describe("computeMetrics", () => {
  it("resume o funil", () => {
    const m = computeMetrics(
      [
        L({ id: "1" }),
        L({ id: "2", status: "proposta", valor: 3490, proximo_contato: "2026-10-01" }),
        L({ id: "3", status: "fechado", valor: 1490, updated_at: "2026-10-05T10:00:00Z" }),
        L({ id: "4", status: "fechado", valor: 6990, updated_at: "2026-09-05T10:00:00Z" }),
        L({ id: "5", status: "perdido" }),
      ],
      "2026-10-06",
    );
    expect(m).toEqual({
      novos: 1,
      negociacao: 1,
      negociacaoValor: 3490,
      fechadosMes: 1,
      fechadosMesValor: 1490,
      fechados: 2,
      perdidos: 1,
      taxa: 67,
      atrasados: 1,
    });
  });
});

it("followUp ignora leads encerrados", () => {
  expect(followUp(L({ proximo_contato: "2026-10-01", status: "fechado" }), "2026-10-06")).toBeNull();
  expect(followUp(L({ proximo_contato: "2026-10-06" }), "2026-10-06")?.tipo).toBe("hoje");
});

it.each([
  ["1.490", 1490],
  ["1490,50", 1490.5],
  ["R$ 6.990,00", 6990],
  ["6990.5", 6990.5],
  ["", null],
  ["abc", null],
])("parseValor(%s) = %s", (s, v) => {
  expect(parseValor(s)).toBe(v);
});

it("describeOrigem mostra campanha, canal ou acesso direto", () => {
  expect(describeOrigem(L({ origem: { utm_source: "instagram", utm_medium: "cpc" } }))).toBe("source: instagram · medium: cpc");
  expect(describeOrigem(L({ origem: { canal: "Indicação", manual: true } }))).toBe("Indicação (cadastro manual)");
  expect(describeOrigem(L({ origem: {} }))).toBe("acesso direto ao site");
});

it("buildCsv usa ; com BOM e neutraliza fórmulas", () => {
  const csv = buildCsv([L({ nome: "=HYPERLINK(1)", valor: 1490.5 })], []);
  expect(csv.charCodeAt(0)).toBe(0xfeff);
  expect(csv).toContain(`"'=HYPERLINK(1)"`);
  expect(csv).toContain(`"1490,5"`);
  expect(csv.split("\r\n")).toHaveLength(2);
});

it("errMsg explica o erro de permissão do banco", () => {
  expect(errMsg({ code: "42501", message: "permission denied for table leads" })).toContain("04-permissoes-site-crm.sql");
});
