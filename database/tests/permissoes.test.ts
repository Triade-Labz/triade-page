// @vitest-environment node
/**
 * Roda os SQLs de database/ num Postgres real (PGlite, em memória) imitando o
 * Supabase: papéis anon/authenticated, auth.jwt() e projeto SEM grants
 * automáticos (o padrão dos projetos novos desde 30/05/2026).
 *
 * Garante o caminho completo: formulário do site (anon) grava → equipe (CRM) lê.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const dir = join(import.meta.dirname, "..");
const sql = (file: string) => readFileSync(join(dir, file), "utf8");

const SUPABASE_STUB = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  create function auth.jwt() returns jsonb language sql stable as $$
    select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
  $$;
  grant usage on schema auth to anon, authenticated, service_role;
  grant execute on function auth.jwt() to anon, authenticated, service_role;
  create publication supabase_realtime;
`;

const LEAD_DO_SITE = `
  insert into public.leads (nome, empresa, whatsapp, plano, consentimento_em, origem)
  values ('Maria Teste', 'Padaria Teste', '51999998888', 'essencial', now(), '{"pagina":"/","utm_source":"google"}')
`;

let db: PGlite;

async function as<T>(role: "anon" | "authenticated", email: string | null, fn: () => Promise<T>): Promise<T> {
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [email ? JSON.stringify({ email, role }) : "{}"]);
  await db.exec(`set role ${role}`);
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
  }
}

async function errorCode(p: Promise<unknown>): Promise<string | undefined> {
  try {
    await p;
    return undefined;
  } catch (e) {
    return (e as { code?: string }).code;
  }
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(SUPABASE_STUB);
  await db.exec(sql("01-tabela-leads.sql"));
  await db.exec(sql("02-painel-equipe.sql"));
  await db.exec(sql("04-permissoes-site-crm.sql"));
  await db.exec(`insert into public.equipe (email, nome) values ('socio1@exemplo.com', 'Sócio 1'), ('socio2@exemplo.com', 'Sócio 2')`);
});

afterAll(async () => {
  await db?.close();
});

describe("formulário do site (papel anon)", () => {
  it("consegue gravar um lead com as colunas do formulário", async () => {
    await as("anon", null, () => db.exec(LEAD_DO_SITE));
    const r = await db.query<{ status: string }>(`select status from public.leads where nome = 'Maria Teste'`);
    expect(r.rows).toEqual([{ status: "novo" }]);
  });

  it("não consegue ler os leads", async () => {
    expect(await errorCode(as("anon", null, () => db.query("select * from public.leads")))).toBe("42501");
  });

  it("não consegue gravar etapa, responsável ou valor", async () => {
    const code = await errorCode(
      as("anon", null, () =>
        db.exec(`insert into public.leads (nome, empresa, whatsapp, plano, consentimento_em, status)
                 values ('Hacker', 'X Ltda', '51999998888', 'essencial', now(), 'fechado')`),
      ),
    );
    expect(code).toBe("42501");
  });

  it("tem WhatsApp inválido recusado pelo banco", async () => {
    const code = await errorCode(
      as("anon", null, () =>
        db.exec(`insert into public.leads (nome, empresa, whatsapp, plano, consentimento_em)
                 values ('Ana', 'Loja', '5551999998888', 'essencial', now())`),
      ),
    );
    expect(code).toBe("23514");
  });

  it("não acessa equipe nem anotações", async () => {
    expect(await errorCode(as("anon", null, () => db.query("select * from public.equipe")))).toBe("42501");
    expect(await errorCode(as("anon", null, () => db.query("select * from public.lead_notas")))).toBe("42501");
  });
});

describe("painel do CRM (papel authenticated)", () => {
  it("sócio da equipe vê o lead que veio do site", async () => {
    const r = await as("authenticated", "socio1@exemplo.com", () => db.query<{ nome: string }>("select nome from public.leads"));
    expect(r.rows.map((x) => x.nome)).toContain("Maria Teste");
  });

  it("sócio da equipe muda a etapa e registra anotação", async () => {
    await as("authenticated", "socio1@exemplo.com", async () => {
      await db.exec(`update public.leads set status = 'em_contato', responsavel = 'socio1@exemplo.com' where nome = 'Maria Teste'`);
      await db.exec(`insert into public.lead_notas (lead_id, texto)
                     select id, 'Liguei, pediu proposta.' from public.leads where nome = 'Maria Teste'`);
    });
    const r = await db.query<{ status: string; autor: string }>(
      `select l.status, n.autor from public.leads l join public.lead_notas n on n.lead_id = l.id where l.nome = 'Maria Teste'`,
    );
    expect(r.rows).toEqual([{ status: "em_contato", autor: "socio1@exemplo.com" }]);
  });

  it("usuário logado fora da equipe não vê nada", async () => {
    const r = await as("authenticated", "intruso@exemplo.com", () => db.query("select * from public.leads"));
    expect(r.rows).toHaveLength(0);
  });
});

describe("04-permissoes-site-crm.sql", () => {
  it("corrige um banco sem grants (o bug original) e pode rodar de novo", async () => {
    // Estado dos projetos que rodaram os SQLs antigos: nenhum GRANT para a API.
    await db.exec("revoke all on table public.leads, public.equipe, public.lead_notas from anon, authenticated");
    expect(await errorCode(as("anon", null, () => db.exec(LEAD_DO_SITE)))).toBe("42501");

    await db.exec(sql("04-permissoes-site-crm.sql"));
    await db.exec(sql("04-permissoes-site-crm.sql"));

    await as("anon", null, () => db.exec(LEAD_DO_SITE));
    const r = await as("authenticated", "socio2@exemplo.com", () => db.query("select id from public.leads where nome = 'Maria Teste'"));
    expect(r.rows).toHaveLength(2);
  });
});
