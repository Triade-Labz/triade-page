/**
 * Postgres em memória (PGlite) imitando o Supabase: papéis anon/authenticated,
 * auth.jwt() e projeto SEM grants automáticos (o padrão dos projetos novos
 * desde 30/05/2026). Usado pelos testes de database/.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const dir = join(import.meta.dirname, "..");
export const sql = (file: string) => readFileSync(join(dir, file), "utf8");

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

export async function novoBanco(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(SUPABASE_STUB);
  return db;
}

/** Executa como o site (anon, sem e-mail) ou como alguém logado (authenticated). */
export async function as<T>(db: PGlite, role: "anon" | "authenticated", email: string | null, fn: () => Promise<T>): Promise<T> {
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [email ? JSON.stringify({ email, role }) : "{}"]);
  await db.exec(`set role ${role}`);
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
    await db.query(`select set_config('request.jwt.claims', '', false)`);
  }
}

export async function errorCode(p: Promise<unknown>): Promise<string | undefined> {
  try {
    await p;
    return undefined;
  } catch (e) {
    return (e as { code?: string }).code;
  }
}
