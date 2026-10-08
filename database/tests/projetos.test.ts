// @vitest-environment node
/**
 * Controle de projetos (database/05-projetos.sql) num Postgres real (PGlite):
 * contrato fechado no CRM vira projeto com o checklist do plano, só a equipe
 * enxerga, e o histórico de etapas não pode ser forjado.
 */
import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PLANOS } from "../../src/shared/leads";
import { ETAPAS, ETAPA_INFO, SITUACOES, SITUACAO_NOME } from "../../src/shared/projetos";
import { modeloDoPlano } from "../../src/projetos/lib/modelos";
import { as as asRole, errorCode, novoBanco, sql } from "./pglite";

let db: PGlite;
const as = <T,>(role: "anon" | "authenticated", email: string | null, fn: () => Promise<T>) => asRole(db, role, email, fn);
const socio = <T,>(fn: () => Promise<T>, email = "socio1@exemplo.com") => as("authenticated", email, fn);

const leadDoSite = (nome: string, empresa: string, plano: string) =>
  as("anon", null, () =>
    db.exec(`insert into public.leads (nome, empresa, whatsapp, plano, consentimento_em)
             values ('${nome}', '${empresa}', '51999998888', '${plano}', now())`),
  );

async function projetoDoLead(nome: string) {
  const r = await db.query<{ id: string; cliente: string; empresa: string; plano: string; responsavel: string | null; prazo: string | null; nome: string }>(
    `select p.id, p.cliente, p.empresa, p.plano, p.responsavel, p.prazo::text, p.nome
       from public.projetos p join public.leads l on l.id = p.lead_id where l.nome = $1`,
    [nome],
  );
  return r.rows;
}

const contar = async (tabela: string, projetoId: string) =>
  (await db.query<{ n: number }>(`select count(*)::int as n from public.${tabela} where projeto_id = $1`, [projetoId])).rows[0]?.n;

beforeAll(async () => {
  db = await novoBanco();
  await db.exec(sql("01-tabela-leads.sql"));
  await db.exec(sql("02-painel-equipe.sql"));
  await db.exec(sql("04-permissoes-site-crm.sql"));
  await db.exec(`insert into public.equipe (email, nome) values ('socio1@exemplo.com', 'Sócio 1'), ('socio2@exemplo.com', 'Sócio 2')`);
  // Contrato fechado ANTES de instalar o controle de projetos.
  await db.exec(`insert into public.leads (nome, empresa, whatsapp, plano, consentimento_em, status, responsavel)
                 values ('Cliente Antigo', 'Loja Antiga', '51988887777', 'profissional', now(), 'fechado', 'socio2@exemplo.com')`);
  await db.exec(sql("05-projetos.sql"));
});

afterAll(async () => {
  await db?.close();
});

describe("ligação com o CRM", () => {
  it("na instalação, contratos que já estavam fechados viram projeto", async () => {
    const [p] = await projetoDoLead("Cliente Antigo");
    expect(p).toMatchObject({ cliente: "Cliente Antigo", empresa: "Loja Antiga", plano: "profissional", responsavel: "socio2@exemplo.com" });
    expect(await contar("projeto_tarefas", p?.id ?? "")).toBe(modeloDoPlano("profissional").length);
  });

  it("o formulário do site continua gravando leads", async () => {
    await leadDoSite("Ana Site", "Padaria da Ana", "essencial");
    const r = await db.query<{ status: string }>(`select status from public.leads where nome = 'Ana Site'`);
    expect(r.rows).toEqual([{ status: "novo" }]);
    expect(await projetoDoLead("Ana Site")).toHaveLength(0);
  });

  it("lead que passa para Fechado vira projeto com o checklist do plano e prazo de 15 dias (landing page)", async () => {
    await socio(() => db.exec(`update public.leads set status = 'em_contato', responsavel = 'socio1@exemplo.com' where nome = 'Ana Site'`));
    expect(await projetoDoLead("Ana Site")).toHaveLength(0);

    await socio(() => db.exec(`update public.leads set status = 'fechado' where nome = 'Ana Site'`));
    const [p] = await projetoDoLead("Ana Site");
    const hoje15 = (await db.query<{ d: string }>(`select (current_date + 15)::text as d`)).rows[0]?.d;
    expect(p).toMatchObject({ cliente: "Ana Site", empresa: "Padaria da Ana", plano: "essencial", responsavel: "socio1@exemplo.com", prazo: hoje15 });
    expect(p?.nome).toBe("Landing page — Padaria da Ana");

    const tarefas = await db.query<{ etapa: string; titulo: string }>(`select etapa, titulo from public.projeto_tarefas where projeto_id = $1 order by ordem`, [
      p?.id,
    ]);
    expect(tarefas.rows).toEqual(modeloDoPlano("essencial").map(({ etapa, titulo }) => ({ etapa, titulo })));

    const notas = await db.query<{ tipo: string; autor: string; texto: string }>(`select tipo, autor, texto from public.projeto_notas where projeto_id = $1`, [p?.id]);
    expect(notas.rows).toEqual([{ tipo: "sistema", autor: "socio1@exemplo.com", texto: expect.stringContaining("Contrato fechado no CRM") }]);
  });

  it("fechar o mesmo lead de novo não duplica o projeto", async () => {
    await socio(() => db.exec(`update public.leads set status = 'proposta' where nome = 'Ana Site'`));
    await socio(() => db.exec(`update public.leads set status = 'fechado' where nome = 'Ana Site'`));
    expect(await projetoDoLead("Ana Site")).toHaveLength(1);
  });

  it("apagar o lead (pedido LGPD) mantém o projeto, só sem o vínculo", async () => {
    await leadDoSite("Bruno Apagar", "Bruno ME", "seguranca");
    await socio(() => db.exec(`update public.leads set status = 'fechado' where nome = 'Bruno Apagar'`));
    await socio(() => db.exec(`delete from public.leads where nome = 'Bruno Apagar'`));
    const r = await db.query<{ lead_id: string | null }>(`select lead_id from public.projetos where cliente = 'Bruno Apagar'`);
    expect(r.rows).toEqual([{ lead_id: null }]);
  });
});

describe("acesso", () => {
  it("o site (anon) não lê nem grava projetos, tarefas ou histórico", async () => {
    for (const t of ["projetos", "projeto_tarefas", "projeto_notas"]) {
      expect(await errorCode(as("anon", null, () => db.query(`select * from public.${t}`)))).toBe("42501");
    }
    expect(await errorCode(as("anon", null, () => db.exec(`insert into public.projetos (nome, cliente, plano) values ('X', 'Y', 'essencial')`)))).toBe("42501");
    const id = (await projetoDoLead("Ana Site"))[0]?.id;
    expect(await errorCode(as("anon", null, () => db.query(`select public.projeto_aplicar_modelo($1)`, [id])))).toBe("42501");
  });

  it("usuário logado fora da equipe não vê projetos nem consegue criar tarefas", async () => {
    const r = await as("authenticated", "intruso@exemplo.com", () => db.query("select * from public.projetos"));
    expect(r.rows).toHaveLength(0);
    const id = (await projetoDoLead("Ana Site"))[0]?.id;
    const n = await as("authenticated", "intruso@exemplo.com", () => db.query<{ n: number }>(`select public.projeto_aplicar_modelo($1) as n`, [id]));
    expect(n.rows[0]?.n).toBe(0);
  });

  it("a equipe não forja histórico de etapa nem marca tarefa em nome de outro sócio", async () => {
    const id = (await projetoDoLead("Ana Site"))[0]?.id;
    expect(
      await errorCode(socio(() => db.query(`insert into public.projeto_notas (projeto_id, texto, tipo) values ($1, 'Escopo → Concluído', 'etapa')`, [id]))),
    ).toBe("42501");
    expect(
      await errorCode(socio(() => db.query(`update public.projeto_tarefas set feita_por = 'socio2@exemplo.com' where projeto_id = $1`, [id]))),
    ).toBe("42501");
    expect(await errorCode(socio(() => db.query(`update public.projetos set lead_id = null where id = $1`, [id])))).toBe("42501");
  });
});

describe("dia a dia da equipe", () => {
  it("marcar tarefa registra quem fez e quando; desmarcar limpa", async () => {
    const id = (await projetoDoLead("Ana Site"))[0]?.id;
    const tarefa = (await db.query<{ id: string }>(`select id from public.projeto_tarefas where projeto_id = $1 order by ordem limit 1`, [id])).rows[0]?.id;
    await socio(() => db.query(`update public.projeto_tarefas set feita = true where id = $1`, [tarefa]), "socio2@exemplo.com");
    let t = (await db.query<{ feita_por: string | null; tem_data: boolean }>(`select feita_por, feita_em is not null as tem_data from public.projeto_tarefas where id = $1`, [tarefa]))
      .rows[0];
    expect(t).toEqual({ feita_por: "socio2@exemplo.com", tem_data: true });

    await socio(() => db.query(`update public.projeto_tarefas set feita = false where id = $1`, [tarefa]));
    t = (await db.query<{ feita_por: string | null; tem_data: boolean }>(`select feita_por, feita_em is not null as tem_data from public.projeto_tarefas where id = $1`, [tarefa]))
      .rows[0];
    expect(t).toEqual({ feita_por: null, tem_data: false });
  });

  it("mudança de etapa e de situação vai para o histórico com o autor; Concluído marca a data", async () => {
    const id = (await projetoDoLead("Ana Site"))[0]?.id;
    await socio(() => db.query(`update public.projetos set etapa = 'landing', situacao = 'aguardando' where id = $1`, [id]), "socio2@exemplo.com");
    const notas = await db.query<{ tipo: string; autor: string; texto: string }>(
      `select tipo, autor, texto from public.projeto_notas where projeto_id = $1 and tipo = 'etapa' order by texto`,
      [id],
    );
    expect(notas.rows).toEqual([
      { tipo: "etapa", autor: "socio2@exemplo.com", texto: "Escopo → Landing page" },
      { tipo: "etapa", autor: "socio2@exemplo.com", texto: "Situação: Em andamento → Aguardando cliente" },
    ]);

    await socio(() => db.query(`update public.projetos set etapa = 'concluido' where id = $1`, [id]));
    expect((await db.query<{ ok: boolean }>(`select concluido_em is not null as ok from public.projetos where id = $1`, [id])).rows[0]?.ok).toBe(true);
    await socio(() => db.query(`update public.projetos set etapa = 'entrega' where id = $1`, [id]));
    expect((await db.query<{ ok: boolean }>(`select concluido_em is null as ok from public.projetos where id = $1`, [id])).rows[0]?.ok).toBe(true);
  });

  it("projeto criado à mão ganha o checklist; aplicar o modelo de outro plano só acrescenta o que falta", async () => {
    const r = await socio(() =>
      db.query<{ id: string }>(`insert into public.projetos (nome, cliente, empresa, plano) values ('Sistema interno', 'Carla', 'Studio Carla', 'completo') returning id`),
    );
    const id = r.rows[0]?.id ?? "";
    expect(await contar("projeto_tarefas", id)).toBe(modeloDoPlano("completo").length);
    expect((await socio(() => db.query<{ n: number }>(`select public.projeto_aplicar_modelo($1) as n`, [id]))).rows[0]?.n).toBe(0);

    await socio(() => db.query(`update public.projetos set plano = 'seguranca' where id = $1`, [id]));
    const novas = modeloDoPlano("seguranca").filter((s) => !modeloDoPlano("completo").some((c) => c.etapa === s.etapa && c.titulo === s.titulo));
    expect((await socio(() => db.query<{ n: number }>(`select public.projeto_aplicar_modelo($1) as n`, [id]))).rows[0]?.n).toBe(novas.length);
  });

  it("anotação da equipe: o autor apaga a própria, não a dos outros", async () => {
    const id = (await projetoDoLead("Ana Site"))[0]?.id;
    await socio(() => db.query(`insert into public.projeto_notas (projeto_id, texto) values ($1, 'Cliente mandou o logo.')`, [id]));
    await socio(() => db.query(`delete from public.projeto_notas where projeto_id = $1 and tipo = 'nota'`, [id]), "socio2@exemplo.com");
    expect((await db.query(`select 1 from public.projeto_notas where projeto_id = $1 and tipo = 'nota'`, [id])).rows).toHaveLength(1);
    await socio(() => db.query(`delete from public.projeto_notas where projeto_id = $1 and tipo = 'nota'`, [id]));
    expect((await db.query(`select 1 from public.projeto_notas where projeto_id = $1 and tipo = 'nota'`, [id])).rows).toHaveLength(0);
  });
});

describe("05-projetos.sql", () => {
  it("pode rodar de novo sem apagar nem duplicar nada", async () => {
    const antes = (await db.query<{ p: number; t: number }>(`select (select count(*) from public.projetos)::int as p, (select count(*) from public.projeto_tarefas)::int as t`)).rows[0];
    await db.exec(sql("05-projetos.sql"));
    const depois = (await db.query<{ p: number; t: number }>(`select (select count(*) from public.projetos)::int as p, (select count(*) from public.projeto_tarefas)::int as t`)).rows[0];
    expect(depois).toEqual(antes);
  });

  it("tem o mesmo checklist padrão do painel (src/projetos/lib/modelos.ts)", async () => {
    for (const plano of PLANOS) {
      const r = await db.query<{ etapa: string; titulo: string; ordem: number }>(`select etapa, titulo, ordem from public.projeto_modelo($1) order by ordem`, [plano]);
      expect(r.rows, `plano ${plano}`).toEqual(modeloDoPlano(plano));
    }
  });

  it("usa no histórico os mesmos nomes de etapa e situação do painel", async () => {
    for (const e of ETAPAS) {
      const r = await db.query<{ n: string }>(`select public.projeto_etapa_nome($1) as n`, [e]);
      expect(r.rows[0]?.n).toBe(ETAPA_INFO[e].nome);
    }
    for (const s of SITUACOES) {
      const r = await db.query<{ n: string }>(`select public.projeto_situacao_nome($1) as n`, [s]);
      expect(r.rows[0]?.n).toBe(SITUACAO_NOME[s]);
    }
  });
});
