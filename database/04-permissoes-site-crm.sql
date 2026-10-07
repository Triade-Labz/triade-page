-- =====================================================================
-- CRM próprio — Parte 4: permissões da API  ★ CORREÇÃO formulário → CRM ★
--
-- POR QUE ESTE ARQUIVO EXISTE
--   Desde 30/05/2026 o Supabase cria projetos novos SEM liberar
--   automaticamente as tabelas do schema public para a API (e a partir de
--   30/10/2026 isso vale para tabelas novas de todos os projetos).
--   Os arquivos 01 e 02 antigos não tinham nenhum GRANT, então:
--     • o formulário do site recebia "permission denied for table leads"
--       (código 42501) e o lead NUNCA era gravado;
--     • o painel do CRM não conseguia ler leads, equipe nem anotações.
--   As regras de RLS continuam valendo: o GRANT diz QUEM pode usar a tabela,
--   a RLS diz QUAIS LINHAS cada um enxerga.
--
-- QUANDO RODAR
--   Em qualquer projeto que já rodou 01 e 02 (e 03, se usar o aviso por e-mail).
--   Pode rodar mais de uma vez: não apaga dados.
--
-- Supabase → SQL Editor → New query → colar tudo → Run
-- =====================================================================

grant usage on schema public to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- 1) leads
--    Site (anon): só INSERE, e só as colunas que o formulário envia.
--    Assim ninguém consegue, pela chave pública, ler leads nem gravar
--    status/responsável/valor. A RLS da Parte 1 continua como 2ª barreira.
-- ---------------------------------------------------------------------
revoke all on table public.leads from anon;
grant insert (nome, empresa, whatsapp, plano, consentimento_em, origem) on table public.leads to anon;

-- Equipe logada no CRM (authenticated): a RLS da Parte 2 limita à tabela equipe.
grant select, insert, update, delete on table public.leads to authenticated;

-- ---------------------------------------------------------------------
-- 2) equipe e anotações: só para a equipe logada
-- ---------------------------------------------------------------------
revoke all on table public.equipe from anon;
grant select on table public.equipe to authenticated;

revoke all on table public.lead_notas from anon;
grant select, insert, delete on table public.lead_notas to authenticated;

-- Função usada pelas regras de acesso da equipe.
grant execute on function public.is_equipe() to authenticated;

-- ---------------------------------------------------------------------
-- 3) Chave de serviço (scripts/administração): acesso total, ignora RLS.
-- ---------------------------------------------------------------------
grant all on table public.leads, public.equipe, public.lead_notas to service_role;

-- ---------------------------------------------------------------------
-- 4) crm_config (Parte 3) guarda o e-mail de destino dos avisos:
--    fica fora da API, só o gatilho do banco lê.
-- ---------------------------------------------------------------------
do $$ begin
  if to_regclass('public.crm_config') is not null then
    execute 'revoke all on table public.crm_config from anon, authenticated';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 5) Tempo real: garante que a tabela leads está publicada
--    (o painel recebe lead novo sem recarregar; se faltar, ele consulta a
--    cada 30 s, mas com isto o aviso é instantâneo).
-- ---------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.leads;
exception
  when duplicate_object then null;
  when undefined_object then raise notice 'Publicação supabase_realtime não existe neste banco: tempo real ignorado.';
end $$;

-- A API do Supabase passa a enxergar as permissões novas na hora.
notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------
-- CONFERIR: este SELECT deve listar INSERT para anon e
-- SELECT/INSERT/UPDATE/DELETE para authenticated.
--   select grantee, privilege_type from information_schema.role_table_grants
--    where table_schema = 'public' and table_name = 'leads' and grantee in ('anon','authenticated')
--   union all
--   select distinct grantee, privilege_type || ' (colunas)' from information_schema.column_privileges
--    where table_schema = 'public' and table_name = 'leads' and grantee = 'anon';
-- Depois envie um pedido pelo formulário do site: ele aparece na coluna
-- "Novo" do CRM na hora.
-- ---------------------------------------------------------------------
