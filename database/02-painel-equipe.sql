-- =====================================================================
-- CRM próprio — Parte 2: equipe, anotações e permissões do painel
-- Rode DEPOIS da Parte 1 (e da atualização de serviços, se for o caso).
-- Supabase → SQL Editor → New query → colar tudo → Run
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Equipe: só quem estiver nesta lista acessa o CRM
-- ---------------------------------------------------------------------
create table if not exists public.equipe (
  email text primary key check (email = lower(email)),
  nome  text not null
);
alter table public.equipe enable row level security;

-- função usada pelas regras de acesso (evita repetir a consulta em cada regra)
create or replace function public.is_equipe() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.equipe where email = lower(auth.jwt() ->> 'email'));
$$;

drop policy if exists "equipe ve equipe" on public.equipe;
create policy "equipe ve equipe" on public.equipe
  for select to authenticated using (public.is_equipe());

-- >>> TROQUE pelos e-mails e nomes reais dos sócios <<<
-- (os mesmos e-mails que vocês vão criar em Authentication → Users)
insert into public.equipe (email, nome) values
  ('socio1@exemplo.com', 'Sócio 1'),
  ('socio2@exemplo.com', 'Sócio 2'),
  ('socio3@exemplo.com', 'Sócio 3')
on conflict (email) do update set nome = excluded.nome;

-- ---------------------------------------------------------------------
-- 2) Leads: troca as regras da Parte 1 por regras baseadas na equipe
-- ---------------------------------------------------------------------
drop policy if exists "equipe le leads"       on public.leads;
drop policy if exists "equipe atualiza leads" on public.leads;
drop policy if exists "equipe insere leads"   on public.leads;
drop policy if exists "equipe apaga leads"    on public.leads;

create policy "equipe le leads"       on public.leads for select to authenticated using (public.is_equipe());
create policy "equipe atualiza leads" on public.leads for update to authenticated using (public.is_equipe()) with check (public.is_equipe());
create policy "equipe insere leads"   on public.leads for insert to authenticated with check (public.is_equipe());
-- apagar existe para atender pedidos de exclusão de dados (LGPD)
create policy "equipe apaga leads"    on public.leads for delete to authenticated using (public.is_equipe());

-- ---------------------------------------------------------------------
-- 3) Anotações / histórico de cada lead
-- ---------------------------------------------------------------------
create table if not exists public.lead_notas (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references public.leads(id) on delete cascade,
  created_at timestamptz not null default now(),
  autor      text not null default lower(auth.jwt() ->> 'email'),
  tipo       text not null default 'nota' check (tipo in ('nota','status')),
  texto      text not null check (char_length(texto) between 1 and 4000)
);
create index if not exists lead_notas_lead_idx on public.lead_notas (lead_id, created_at desc);
alter table public.lead_notas enable row level security;

drop policy if exists "equipe le notas"    on public.lead_notas;
drop policy if exists "equipe cria notas"  on public.lead_notas;
drop policy if exists "autor apaga nota"   on public.lead_notas;
create policy "equipe le notas"   on public.lead_notas for select to authenticated using (public.is_equipe());
create policy "equipe cria notas" on public.lead_notas for insert to authenticated
  with check (public.is_equipe() and autor = lower(auth.jwt() ->> 'email'));
create policy "autor apaga nota"  on public.lead_notas for delete to authenticated
  using (public.is_equipe() and autor = lower(auth.jwt() ->> 'email'));

-- ---------------------------------------------------------------------
-- 4) Tempo real: o painel recebe lead novo sem recarregar a página
-- ---------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.leads;
exception when duplicate_object then null; end $$;
