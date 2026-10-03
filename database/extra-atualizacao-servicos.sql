-- =====================================================================
-- Atualização: aceitar os novos interesses do formulário
-- (suporte em TI e pentest). Rode só se já executou a Parte 1 antes.
-- Supabase → SQL Editor → colar → Run
-- =====================================================================
alter table public.leads drop constraint if exists leads_plano_check;
alter table public.leads add constraint leads_plano_check
  check (plano in ('essencial','profissional','completo','suporte','seguranca','duvida'));
