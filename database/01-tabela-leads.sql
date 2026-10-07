-- =====================================================================
-- CRM próprio — Parte 1: tabela de leads (Supabase / Postgres)
-- Como usar: Supabase → SQL Editor → New query → colar tudo → Run
-- =====================================================================

create table if not exists public.leads (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- dados que chegam do formulário do site
  nome             text not null check (char_length(nome) between 2 and 120),
  empresa          text not null check (char_length(empresa) between 2 and 160),
  whatsapp         text not null check (whatsapp ~ '^[0-9]{10,11}$'),
  plano            text not null check (plano in ('essencial','profissional','completo','suporte','seguranca','duvida')),
  consentimento_em timestamptz not null,                       -- prova de aceite (LGPD)
  origem           jsonb not null default '{}'::jsonb          -- utm, página, referrer
                   check (pg_column_size(origem) < 4000),

  -- campos de gestão, usados só pelo painel do CRM
  status           text not null default 'novo'
                   check (status in ('novo','em_contato','proposta','fechado','perdido')),
  responsavel      text,
  valor            numeric(10,2),
  proximo_contato  date
);

create index if not exists leads_status_idx  on public.leads (status);
create index if not exists leads_created_idx on public.leads (created_at desc);

-- updated_at automático
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

drop trigger if exists leads_updated_at on public.leads;
create trigger leads_updated_at before update on public.leads
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Segurança (RLS): o site só consegue INSERIR; ninguém de fora lê nada.
-- ---------------------------------------------------------------------
alter table public.leads enable row level security;

drop policy if exists "site insere leads" on public.leads;
create policy "site insere leads" on public.leads
  for insert to anon
  with check (status = 'novo' and responsavel is null and valor is null and proximo_contato is null);

-- Equipe logada (painel do CRM) lê e atualiza.
-- IMPORTANTE: em Authentication → Sign In / Providers, DESATIVE "Allow new users to sign up"
-- e crie os usuários da equipe manualmente em Authentication → Users.
drop policy if exists "equipe le leads" on public.leads;
create policy "equipe le leads" on public.leads
  for select to authenticated using (true);

drop policy if exists "equipe atualiza leads" on public.leads;
create policy "equipe atualiza leads" on public.leads
  for update to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------
-- Permissões da API (GRANT). Sem isto, projetos Supabase criados a partir
-- de 30/05/2026 recusam o formulário com "permission denied" (42501).
-- O site (anon) só insere, e só as colunas do formulário.
-- ---------------------------------------------------------------------
revoke all on table public.leads from anon;
grant insert (nome, empresa, whatsapp, plano, consentimento_em, origem) on table public.leads to anon;
grant select, insert, update, delete on table public.leads to authenticated;
grant all on table public.leads to service_role;
