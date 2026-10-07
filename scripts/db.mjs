#!/usr/bin/env node
/**
 * Ferramentas do banco (Supabase), para rodar no computador da equipe.
 * Usa DATABASE_URL do .env (conexão direta com o Postgres; nunca vai para o site).
 *
 *   npm run db -- status                         mostra o que está configurado
 *   npm run db -- migrate                        aplica 01, 02 e 04 (e 03 se houver RESEND_API_KEY no .env)
 *   npm run db -- smoke                          testa site → CRM de verdade e desfaz tudo no final
 *   npm run db -- equipe list
 *   npm run db -- equipe add email@x.com "Nome"
 *   npm run db -- equipe remove email@x.com
 *
 * Todos os SQLs são idempotentes: rodar de novo não apaga dados.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = fileURLToPath(new URL("..", import.meta.url));
if (existsSync(join(root, ".env"))) process.loadEnvFile(join(root, ".env"));

const MIGRACOES = ["01-tabela-leads.sql", "02-painel-equipe.sql", "04-permissoes-site-crm.sql"];
const EMAIL = "03-aviso-email.sql";

function fail(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

async function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) fail("DATABASE_URL não definida. Copie .env.example para .env e preencha.");
  try {
    new URL(url);
  } catch {
    fail("DATABASE_URL inválida. Se a senha tiver / @ : # ou ?, troque por %2F %40 %3A %23 %3F.");
  }
  // O Supabase exige TLS; o certificado é de uma CA própria do Supabase, por isso sem verificação da cadeia.
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
  try {
    await client.connect();
  } catch (e) {
    const dica =
      e.code === "ENETUNREACH" || e.code === "EHOSTUNREACH" || e.code === "ENOTFOUND"
        ? "\n  A conexão direta do Supabase é só IPv6. Se sua rede não tem IPv6, use a do pooler (Session mode) em\n  Supabase → Connect, no lugar de DATABASE_URL."
        : e.code === "28P01"
          ? "\n  Senha incorreta: confira em Supabase → Project Settings → Database."
          : "";
    fail(`Não foi possível conectar ao banco: ${e.message}${dica}`);
  }
  return client;
}

const readSql = (file) => readFileSync(join(root, "database", file), "utf8");
const sqlLiteral = (s) => `'${String(s).replace(/'/g, "''")}'`;

async function migrate(c) {
  const files = [...MIGRACOES];
  const resend = process.env.RESEND_API_KEY?.trim();
  if (resend) files.splice(2, 0, EMAIL);

  await c.query("begin");
  try {
    for (const f of files) {
      let sql = readSql(f);
      // A chave do Resend entra só na hora, direto no cofre do banco; o arquivo continua sem ela.
      if (f === EMAIL) sql = sql.replaceAll("'COLE_A_CHAVE_DO_RESEND_AQUI'", sqlLiteral(resend));
      await c.query(sql);
      console.log(`✔ ${f}`);
    }
    await c.query("commit");
  } catch (e) {
    await c.query("rollback");
    fail(`Erro aplicando SQL (nada foi alterado): ${e.message}`);
  }
  if (!resend) console.log(`• ${EMAIL} pulado (defina RESEND_API_KEY no .env para ativar o aviso por e-mail)`);
  console.log("\nPronto. Confira com: npm run db -- status");
}

async function status(c) {
  const one = async (sql) => (await c.query(sql)).rows[0];
  const t = await one(`select to_regclass('public.leads') is not null as leads, to_regclass('public.equipe') is not null as equipe,
                              to_regclass('public.lead_notas') is not null as notas, to_regclass('public.crm_config') is not null as config`);
  const ok = (b) => (b ? "✔" : "✖");
  console.log(`\nTabelas: ${ok(t.leads)} leads  ${ok(t.equipe)} equipe  ${ok(t.notas)} lead_notas  ${ok(t.config)} crm_config (aviso por e-mail)`);
  if (!t.leads || !t.equipe || !t.notas) {
    console.log("\n→ Banco incompleto: rode  npm run db -- migrate\n");
    return;
  }

  const g = await one(`select
      has_any_column_privilege('anon', 'public.leads', 'insert') as anon_insere,
      has_table_privilege('anon', 'public.leads', 'select') as anon_le,
      has_column_privilege('anon', 'public.leads', 'status', 'insert') as anon_status,
      has_table_privilege('authenticated', 'public.leads', 'select') as eq_le,
      has_table_privilege('authenticated', 'public.leads', 'update') as eq_edita,
      has_table_privilege('authenticated', 'public.lead_notas', 'insert') as eq_notas,
      exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'leads') as realtime`);
  console.log(`Site (anon):      ${ok(g.anon_insere)} grava leads   ${ok(!g.anon_le)} não lê leads   ${ok(!g.anon_status)} não define etapa`);
  console.log(`Equipe (logada):  ${ok(g.eq_le)} lê   ${ok(g.eq_edita)} edita   ${ok(g.eq_notas)} anota   ${ok(g.realtime)} tempo real`);

  const leads = await c.query(`select status, count(*)::int as n from public.leads group by 1 order by 1`);
  console.log(`Leads: ${leads.rows.length ? leads.rows.map((r) => `${r.status} ${r.n}`).join(" · ") : "nenhum ainda"}`);

  const eq = await c.query(`select e.email, e.nome, exists (select 1 from auth.users u where lower(u.email) = e.email) as login
                            from public.equipe e order by e.nome`);
  if (!eq.rows.length) console.log(`Equipe: ✖ ninguém cadastrado → npm run db -- equipe add email@x.com "Nome"`);
  for (const m of eq.rows) {
    console.log(`Equipe: ${m.nome} <${m.email}> ${m.login ? "✔ tem login" : "✖ sem login: crie em Supabase → Authentication → Users → Add user"}`);
  }

  if (t.config) {
    const cfg = await c.query(`select chave, coalesce(valor, '') <> '' as ok from public.crm_config order by 1`);
    const key = await c.query(`select decrypted_secret not like 'COLE_%' as ok from vault.decrypted_secrets where name = 'resend_api_key'`);
    console.log(`Aviso por e-mail: ${ok(key.rows[0]?.ok)} chave do Resend  ${cfg.rows.map((r) => `${ok(r.ok)} ${r.chave}`).join("  ")}`);
  } else {
    console.log("Aviso por e-mail: não instalado (opcional: RESEND_API_KEY no .env + npm run db -- migrate)");
  }
  console.log("");
}

/** Simula o caminho completo com os papéis reais do Supabase e desfaz tudo (rollback). */
async function smoke(c) {
  await c.query("begin");
  const passo = async (nome, fn) => {
    try {
      await fn();
      console.log(`✔ ${nome}`);
    } catch (e) {
      console.log(`✖ ${nome}: ${e.code ?? ""} ${e.message}`);
      process.exitCode = 1;
    }
  };
  try {
    await c.query("set local role anon");
    await passo("site grava um lead (papel anon)", () =>
      c.query(`insert into public.leads (nome, empresa, whatsapp, plano, consentimento_em, origem)
               values ('Teste Automático', 'Empresa Teste', '51999998888', 'duvida', now(), '{"pagina":"/","teste":true}')`),
    );
    await c.query("savepoint s");
    await passo("site NÃO consegue ler leads", async () => {
      try {
        await c.query("select 1 from public.leads limit 1");
      } catch (e) {
        if (e.code === "42501") return;
        throw e;
      }
      throw new Error("anon conseguiu ler a tabela leads");
    });
    await c.query("rollback to savepoint s");
    await c.query("reset role");
    await c.query(`insert into public.equipe (email, nome) values ('teste-smoke@exemplo.invalid', 'Teste') on conflict do nothing`);
    await c.query(`select set_config('request.jwt.claims', '{"email":"teste-smoke@exemplo.invalid","role":"authenticated"}', true)`);
    await c.query("set local role authenticated");
    await passo("CRM (equipe logada) enxerga o lead do site", async () => {
      const r = await c.query(`select status from public.leads where nome = 'Teste Automático'`);
      if (r.rows[0]?.status !== "novo") throw new Error("lead não apareceu na coluna Novo");
    });
  } finally {
    await c.query("rollback");
  }
  console.log("\nTudo desfeito: nenhum dado de teste ficou no banco e nenhum e-mail foi enviado.");
}

async function equipe(c, [acao, email, ...nomeParts]) {
  const nome = nomeParts.join(" ").trim();
  if (acao === "add") {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !nome) fail('Uso: npm run db -- equipe add email@x.com "Nome"');
    await c.query(`insert into public.equipe (email, nome) values (lower($1), $2) on conflict (email) do update set nome = excluded.nome`, [email, nome]);
    console.log(`✔ ${nome} <${email.toLowerCase()}> pode acessar o CRM (depois de criar o login no Supabase → Authentication → Users).`);
  } else if (acao === "remove") {
    if (!email) fail("Uso: npm run db -- equipe remove email@x.com");
    const r = await c.query(`delete from public.equipe where email = lower($1)`, [email]);
    console.log(r.rowCount ? `✔ ${email} removido da equipe.` : `• ${email} não estava na equipe.`);
  } else {
    const r = await c.query(`select email, nome from public.equipe order by nome`);
    if (!r.rows.length) console.log("Equipe vazia.");
    for (const m of r.rows) console.log(`${m.nome} <${m.email}>`);
  }
}

const [cmd, ...args] = process.argv.slice(2);
const comandos = { status, migrate, smoke, equipe: (c) => equipe(c, args) };
if (!comandos[cmd]) {
  console.log("Comandos: status | migrate | smoke | equipe list | equipe add <email> <nome> | equipe remove <email>");
  process.exit(cmd ? 1 : 0);
}
const client = await connect();
try {
  await comandos[cmd](client);
} finally {
  await client.end();
}
