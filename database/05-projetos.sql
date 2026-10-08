-- =====================================================================
-- Controle de projetos — Parte 5: projetos dos clientes
--
-- O QUE FAZ
--   • Cada projeto tem etapa (Escopo → Design → Landing page → Integração
--     backend → Teste de vulnerabilidade → Revisão e entrega → Concluído),
--     escopo (o que o cliente precisa / o que está fora) e um checklist de
--     tarefas por etapa, criado a partir do plano contratado.
--   • Ligação com o CRM: quando um lead passa para "Fechado", o projeto é
--     criado sozinho, já com o checklist padrão do plano.
--   • Mesmo login do CRM: só quem está na tabela equipe vê os projetos.
--
-- QUANDO RODAR
--   Depois das Partes 1, 2 e 4. Pode rodar mais de uma vez: não apaga dados.
--   No computador: npm run db -- migrate
--   Ou: Supabase → SQL Editor → New query → colar tudo → Run
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Projetos
-- ---------------------------------------------------------------------
create table if not exists public.projetos (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- lead do CRM que virou contrato (um projeto por lead); se o lead for
  -- apagado (pedido LGPD), o projeto continua, só perde o vínculo
  lead_id       uuid unique references public.leads(id) on delete set null,

  nome          text not null check (char_length(nome) between 2 and 160),
  cliente       text not null check (char_length(cliente) between 2 and 120),
  empresa       text not null default '' check (char_length(empresa) <= 160),
  whatsapp      text check (whatsapp ~ '^[0-9]{10,11}$'),
  plano         text not null check (plano in ('essencial','profissional','completo','suporte','seguranca','duvida')),

  etapa         text not null default 'escopo'
                check (etapa in ('escopo','design','landing','backend','seguranca','entrega','concluido')),
  situacao      text not null default 'andamento'
                check (situacao in ('andamento','aguardando','pausado','cancelado')),
  responsavel   text,
  inicio        date not null default current_date,
  prazo         date,
  concluido_em  timestamptz,

  -- escopo do projeto
  objetivo      text not null default '' check (char_length(objetivo) <= 8000),
  requisitos    text not null default '' check (char_length(requisitos) <= 8000),
  fora_escopo   text not null default '' check (char_length(fora_escopo) <= 8000),
  links         text not null default '' check (char_length(links) <= 4000)
);

create index if not exists projetos_etapa_idx on public.projetos (etapa);
create index if not exists projetos_created_idx on public.projetos (created_at desc);

-- ---------------------------------------------------------------------
-- 2) Tarefas (checklist de cada etapa) e histórico
-- ---------------------------------------------------------------------
create table if not exists public.projeto_tarefas (
  id          uuid primary key default gen_random_uuid(),
  projeto_id  uuid not null references public.projetos(id) on delete cascade,
  created_at  timestamptz not null default now(),
  etapa       text not null check (etapa in ('escopo','design','landing','backend','seguranca','entrega')),
  titulo      text not null check (char_length(titulo) between 1 and 300),
  ordem       integer not null default 1000,
  feita       boolean not null default false,
  feita_em    timestamptz,
  feita_por   text
);
create index if not exists projeto_tarefas_projeto_idx on public.projeto_tarefas (projeto_id, etapa, ordem);

create table if not exists public.projeto_notas (
  id          uuid primary key default gen_random_uuid(),
  projeto_id  uuid not null references public.projetos(id) on delete cascade,
  created_at  timestamptz not null default now(),
  autor       text not null default coalesce(lower(auth.jwt() ->> 'email'), 'sistema'),
  -- nota: escrita pela equipe · etapa: mudança de etapa/situação · sistema: eventos automáticos
  tipo        text not null default 'nota' check (tipo in ('nota','etapa','sistema')),
  texto       text not null check (char_length(texto) between 1 and 4000)
);
create index if not exists projeto_notas_projeto_idx on public.projeto_notas (projeto_id, created_at desc);

-- ---------------------------------------------------------------------
-- 3) Nomes das etapas/situações (usados no histórico) e checklist padrão
--    O painel usa os mesmos textos (src/shared/projetos.ts e
--    src/projetos/lib/modelos.ts); database/tests confere os dois lados.
-- ---------------------------------------------------------------------
create or replace function public.projeto_etapa_nome(p_etapa text) returns text
language sql immutable set search_path = public as $$
  select case p_etapa
    when 'escopo'    then 'Escopo'
    when 'design'    then 'Design'
    when 'landing'   then 'Landing page'
    when 'backend'   then 'Integração backend'
    when 'seguranca' then 'Teste de vulnerabilidade'
    when 'entrega'   then 'Revisão e entrega'
    when 'concluido' then 'Concluído'
    else p_etapa end
$$;

create or replace function public.projeto_situacao_nome(p_situacao text) returns text
language sql immutable set search_path = public as $$
  select case p_situacao
    when 'andamento'  then 'Em andamento'
    when 'aguardando' then 'Aguardando cliente'
    when 'pausado'    then 'Pausado'
    when 'cancelado'  then 'Cancelado'
    else p_situacao end
$$;

-- Checklist padrão de cada plano: [planos, etapa, tarefa]. O primeiro item diz
-- para quais planos vale a tarefa ("*" = todos). Para mudar o padrão, edite aqui e em
-- src/projetos/lib/modelos.ts (o teste avisa se ficarem diferentes).
create or replace function public.projeto_modelo(p_plano text)
returns table (etapa text, titulo text, ordem integer)
language sql immutable set search_path = public as $$
  select e.v ->> 1, e.v ->> 2, (e.n * 10)::integer
  from jsonb_array_elements($j$[
    ["*",                                "escopo",     "Reunião de levantamento de requisitos"],
    ["*",                                "escopo",     "Escrever o escopo: objetivo, o que está incluído e o que fica fora"],
    ["seguranca",                        "escopo",     "Autorização por escrito do cliente para os testes"],
    ["*",                                "escopo",     "Escopo aprovado pelo cliente"],
    ["*",                                "escopo",     "Definir prazo de entrega"],
    ["*",                                "escopo",     "Receber o pagamento inicial (entrada ou implantação)"],
    ["essencial,profissional,completo",  "escopo",     "Receber do cliente textos, logo e imagens"],
    ["suporte",                          "escopo",     "Levantamento do ambiente de TI: equipamentos, rede e contas"],
    ["suporte",                          "escopo",     "Definir plano de atendimento e prazos de resposta"],
    ["duvida",                           "escopo",     "Definir o plano ou serviço contratado"],
    ["completo",                         "design",     "Identidade visual: cores, tipografia e logo"],
    ["completo",                         "design",     "Protótipo das telas"],
    ["completo",                         "design",     "Protótipo aprovado pelo cliente"],
    ["essencial,profissional,completo",  "landing",    "Estrutura e textos da página"],
    ["essencial,profissional,completo",  "landing",    "Desenvolver a página responsiva"],
    ["essencial,profissional,completo",  "landing",    "Formulário de contato funcionando"],
    ["essencial,profissional,completo",  "landing",    "SEO básico: título, descrição e compartilhamento"],
    ["essencial,profissional,completo",  "landing",    "Testar no celular e no computador"],
    ["profissional,completo",            "backend",    "Modelagem do banco de dados"],
    ["profissional,completo",            "backend",    "Regras de negócio e API"],
    ["profissional,completo",            "backend",    "Login e permissões de acesso"],
    ["profissional,completo",            "backend",    "Integrar a página com o backend"],
    ["profissional,completo",            "backend",    "Infraestrutura: hospedagem, domínio e backups"],
    ["completo,seguranca",               "seguranca",  "Varredura de vulnerabilidades no código e nas dependências"],
    ["completo,seguranca",               "seguranca",  "Testar autenticação, permissões e dados expostos"],
    ["completo,seguranca",               "seguranca",  "Relatório com as correções recomendadas"],
    ["completo",                         "seguranca",  "Aplicar as correções e testar de novo"],
    ["essencial,profissional,completo",  "entrega",    "1ª rodada de revisão com o cliente"],
    ["essencial,profissional,completo",  "entrega",    "2ª rodada de revisão com o cliente"],
    ["essencial,profissional,completo",  "entrega",    "Publicar no domínio do cliente"],
    ["completo",                         "entrega",    "Registro no INPI: preparar a documentação"],
    ["completo",                         "entrega",    "Registro no INPI: protocolar (taxa paga pelo cliente)"],
    ["seguranca",                        "entrega",    "Apresentar o relatório ao cliente"],
    ["suporte",                          "entrega",    "Implantar o suporte e passar os canais de atendimento"],
    ["*",                                "entrega",    "Entregar acessos e orientações ao cliente"],
    ["*",                                "entrega",    "Receber o pagamento final"]
  ]$j$::jsonb) with ordinality as e(v, n)
  where e.v ->> 0 = '*' or p_plano = any (string_to_array(e.v ->> 0, ','))
  order by e.n
$$;

-- Acrescenta ao projeto as tarefas padrão do plano que ainda não existem
-- (botão "Aplicar checklist do plano" e criação de projeto). Roda com as
-- permissões de quem chamou: fora da equipe, não insere nada.
create or replace function public.projeto_aplicar_modelo(p_projeto uuid) returns integer
language plpgsql set search_path = public as $$
declare
  n integer;
begin
  insert into public.projeto_tarefas (projeto_id, etapa, titulo, ordem)
  select p.id, m.etapa, m.titulo, m.ordem
  from public.projetos p
  cross join lateral public.projeto_modelo(p.plano) m
  where p.id = p_projeto
    and not exists (
      select 1 from public.projeto_tarefas t
      where t.projeto_id = p.id and t.etapa = m.etapa and t.titulo = m.titulo
    );
  get diagnostics n = row_count;
  return n;
end $$;

-- Nome sugerido para projetos que nascem de um contrato do CRM.
create or replace function public.projeto_nome_padrao(p_plano text, p_empresa text) returns text
language sql immutable set search_path = public as $$
  select left(
    case p_plano
      when 'essencial'    then 'Landing page'
      when 'profissional' then 'Landing page + aplicação'
      when 'completo'     then 'Projeto completo'
      when 'suporte'      then 'Suporte em TI'
      when 'seguranca'    then 'Análise de vulnerabilidades'
      else 'Projeto'
    end || ' — ' || p_empresa, 160)
$$;

-- ---------------------------------------------------------------------
-- 4) Automações
-- ---------------------------------------------------------------------
drop trigger if exists projetos_updated_at on public.projetos;
create trigger projetos_updated_at before update on public.projetos
for each row execute function public.set_updated_at();

-- Data de conclusão automática.
create or replace function public.projeto_marca_conclusao() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.etapa = 'concluido' then
    if tg_op = 'INSERT' or old.etapa is distinct from 'concluido' then new.concluido_em = now(); end if;
  else
    new.concluido_em = null;
  end if;
  return new;
end $$;

drop trigger if exists projetos_conclusao on public.projetos;
create trigger projetos_conclusao before insert or update of etapa on public.projetos
for each row execute function public.projeto_marca_conclusao();

-- Projeto novo: checklist padrão do plano + registro no histórico.
create or replace function public.projeto_criado() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.projeto_aplicar_modelo(new.id);
  insert into public.projeto_notas (projeto_id, tipo, texto, autor)
  values (
    new.id, 'sistema',
    case when new.lead_id is not null
      then 'Contrato fechado no CRM: projeto criado automaticamente com o checklist do plano.'
      else 'Projeto criado com o checklist do plano.' end,
    coalesce(lower(auth.jwt() ->> 'email'), 'sistema')
  );
  return null;
end $$;

drop trigger if exists projetos_criado on public.projetos;
create trigger projetos_criado after insert on public.projetos
for each row execute function public.projeto_criado();

-- Mudança de etapa ou situação vai para o histórico, com quem mudou.
create or replace function public.projeto_registra_mudanca() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  quem text := coalesce(lower(auth.jwt() ->> 'email'), 'sistema');
begin
  if new.etapa is distinct from old.etapa then
    insert into public.projeto_notas (projeto_id, tipo, texto, autor)
    values (new.id, 'etapa', public.projeto_etapa_nome(old.etapa) || ' → ' || public.projeto_etapa_nome(new.etapa), quem);
  end if;
  if new.situacao is distinct from old.situacao then
    insert into public.projeto_notas (projeto_id, tipo, texto, autor)
    values (new.id, 'etapa', 'Situação: ' || public.projeto_situacao_nome(old.situacao) || ' → ' || public.projeto_situacao_nome(new.situacao), quem);
  end if;
  return null;
end $$;

drop trigger if exists projetos_historico on public.projetos;
create trigger projetos_historico after update of etapa, situacao on public.projetos
for each row execute function public.projeto_registra_mudanca();

-- Quem marcou a tarefa e quando (não dá para preencher à mão).
create or replace function public.projeto_tarefa_feita() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.feita is distinct from old.feita then
    if new.feita then
      new.feita_em = now();
      new.feita_por = lower(auth.jwt() ->> 'email');
    else
      new.feita_em = null;
      new.feita_por = null;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists projeto_tarefas_feita on public.projeto_tarefas;
create trigger projeto_tarefas_feita before insert or update on public.projeto_tarefas
for each row execute function public.projeto_tarefa_feita();

-- ★ Ligação com o CRM: lead "Fechado" vira projeto (um por lead).
create or replace function public.lead_fechado_cria_projeto() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.projetos (lead_id, nome, cliente, empresa, whatsapp, plano, responsavel, prazo)
  values (
    new.id, public.projeto_nome_padrao(new.plano, new.empresa), new.nome, new.empresa, new.whatsapp, new.plano, new.responsavel,
    -- landing page: entrega em até 15 dias (prometido no site)
    case when new.plano = 'essencial' then current_date + 15 end
  )
  on conflict (lead_id) do nothing;
  return null;
end $$;

drop trigger if exists leads_fechado_insert on public.leads;
create trigger leads_fechado_insert after insert on public.leads
for each row when (new.status = 'fechado')
execute function public.lead_fechado_cria_projeto();

drop trigger if exists leads_fechado_update on public.leads;
create trigger leads_fechado_update after update of status on public.leads
for each row when (new.status = 'fechado' and old.status is distinct from 'fechado')
execute function public.lead_fechado_cria_projeto();

-- Primeira instalação: contratos que já estavam fechados também viram projeto.
do $$ begin
  if not exists (select 1 from public.projetos) then
    insert into public.projetos (lead_id, nome, cliente, empresa, whatsapp, plano, responsavel)
    select l.id, public.projeto_nome_padrao(l.plano, l.empresa), l.nome, l.empresa, l.whatsapp, l.plano, l.responsavel
    from public.leads l
    where l.status = 'fechado'
    order by l.updated_at
    on conflict (lead_id) do nothing;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 5) Segurança (RLS): só a equipe (tabela equipe) vê e mexe
-- ---------------------------------------------------------------------
alter table public.projetos        enable row level security;
alter table public.projeto_tarefas enable row level security;
alter table public.projeto_notas   enable row level security;

drop policy if exists "equipe le projetos"      on public.projetos;
drop policy if exists "equipe cria projetos"    on public.projetos;
drop policy if exists "equipe edita projetos"   on public.projetos;
drop policy if exists "equipe apaga projetos"   on public.projetos;
create policy "equipe le projetos"    on public.projetos for select to authenticated using (public.is_equipe());
create policy "equipe cria projetos"  on public.projetos for insert to authenticated with check (public.is_equipe());
create policy "equipe edita projetos" on public.projetos for update to authenticated using (public.is_equipe()) with check (public.is_equipe());
create policy "equipe apaga projetos" on public.projetos for delete to authenticated using (public.is_equipe());

drop policy if exists "equipe le tarefas"     on public.projeto_tarefas;
drop policy if exists "equipe cria tarefas"   on public.projeto_tarefas;
drop policy if exists "equipe edita tarefas"  on public.projeto_tarefas;
drop policy if exists "equipe apaga tarefas"  on public.projeto_tarefas;
create policy "equipe le tarefas"    on public.projeto_tarefas for select to authenticated using (public.is_equipe());
create policy "equipe cria tarefas"  on public.projeto_tarefas for insert to authenticated with check (public.is_equipe());
create policy "equipe edita tarefas" on public.projeto_tarefas for update to authenticated using (public.is_equipe()) with check (public.is_equipe());
create policy "equipe apaga tarefas" on public.projeto_tarefas for delete to authenticated using (public.is_equipe());

-- O histórico de etapas é gravado só pelo banco; a equipe escreve e apaga as próprias notas.
drop policy if exists "equipe le historico"       on public.projeto_notas;
drop policy if exists "equipe cria nota"          on public.projeto_notas;
drop policy if exists "autor apaga nota projeto"  on public.projeto_notas;
create policy "equipe le historico" on public.projeto_notas for select to authenticated using (public.is_equipe());
create policy "equipe cria nota"    on public.projeto_notas for insert to authenticated
  with check (public.is_equipe() and tipo = 'nota' and autor = lower(auth.jwt() ->> 'email'));
create policy "autor apaga nota projeto" on public.projeto_notas for delete to authenticated
  using (public.is_equipe() and tipo = 'nota' and autor = lower(auth.jwt() ->> 'email'));

-- ---------------------------------------------------------------------
-- 6) Permissões da API (GRANT). O site (anon) não acessa nada daqui.
--    Colunas automáticas (datas, vínculo com o lead, quem marcou a
--    tarefa) não podem ser gravadas pela API.
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

revoke all on table public.projetos, public.projeto_tarefas, public.projeto_notas from anon, authenticated;

grant select, delete on table public.projetos to authenticated;
grant insert (nome, cliente, empresa, whatsapp, plano, etapa, situacao, responsavel, inicio, prazo, objetivo, requisitos, fora_escopo, links)
  on table public.projetos to authenticated;
grant update (nome, cliente, empresa, whatsapp, plano, etapa, situacao, responsavel, inicio, prazo, objetivo, requisitos, fora_escopo, links)
  on table public.projetos to authenticated;

grant select, delete on table public.projeto_tarefas to authenticated;
grant insert (projeto_id, etapa, titulo, ordem, feita) on table public.projeto_tarefas to authenticated;
grant update (etapa, titulo, ordem, feita) on table public.projeto_tarefas to authenticated;

grant select, delete on table public.projeto_notas to authenticated;
grant insert (projeto_id, texto) on table public.projeto_notas to authenticated;

grant all on table public.projetos, public.projeto_tarefas, public.projeto_notas to service_role;

revoke all on function public.projeto_aplicar_modelo(uuid) from public, anon;
grant execute on function public.projeto_aplicar_modelo(uuid) to authenticated, service_role;
revoke all on function public.projeto_modelo(text) from public, anon;
grant execute on function public.projeto_modelo(text) to authenticated, service_role;

-- ---------------------------------------------------------------------
-- 7) Tempo real: contrato fechado no CRM aparece no painel na hora
-- ---------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.projetos;
exception
  when duplicate_object then null;
  when undefined_object then raise notice 'Publicação supabase_realtime não existe neste banco: tempo real ignorado.';
end $$;
do $$ begin
  alter publication supabase_realtime add table public.projeto_tarefas;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

notify pgrst, 'reload schema';
