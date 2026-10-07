-- =====================================================================
-- CRM próprio — Parte 3: e-mail automático a cada lead novo do site
-- Rode DEPOIS das Partes 1 e 2.
--
-- ANTES DE RODAR:
--   1. Crie uma conta gratuita em resend.com usando o e-mail que vai
--      receber os avisos (jvv.moraes05@gmail.com).
--      Sem domínio próprio, o Resend só entrega para o e-mail da própria conta.
--   2. No Resend, vá em API Keys → Create API Key e copie a chave (começa com re_).
--   3. Cole a chave no lugar de COLE_A_CHAVE_DO_RESEND_AQUI, na seção 2 abaixo.
--
-- Supabase → SQL Editor → New query → colar tudo → Run
-- =====================================================================

-- 1) Extensão que permite ao banco chamar APIs externas
create extension if not exists pg_net;

-- 2) Chave do Resend guardada no cofre criptografado do Supabase (Vault)
do $$ begin
  if exists (select 1 from vault.secrets where name = 'resend_api_key') then
    perform vault.update_secret(
      (select id from vault.secrets where name = 'resend_api_key'),
      'COLE_A_CHAVE_DO_RESEND_AQUI');
  else
    perform vault.create_secret('COLE_A_CHAVE_DO_RESEND_AQUI', 'resend_api_key');
  end if;
end $$;

-- 3) Configurações do aviso (não são segredos; ninguém de fora consegue ler)
create table if not exists public.crm_config (
  chave text primary key,
  valor text
);
alter table public.crm_config enable row level security;   -- sem regras = só o próprio banco lê
revoke all on table public.crm_config from anon, authenticated;

insert into public.crm_config (chave, valor) values
  ('email_destino', 'jvv.moraes05@gmail.com'),   -- vários e-mails: separe por vírgula (exige domínio verificado no Resend)
  ('email_remetente', 'CRM Tríade Labs <onboarding@resend.dev>'),
  ('crm_url', '')                                -- ex.: https://triadelabs.pages.dev/crm.html (vira um botão no e-mail)
on conflict (chave) do nothing;

-- Para trocar o e-mail depois, rode só isto:
--   update public.crm_config set valor = 'novo@email.com' where chave = 'email_destino';

-- 4) Escapa texto digitado no formulário antes de colocar no HTML do e-mail
create or replace function public.esc_html(t text) returns text
language sql immutable as $$
  select replace(replace(replace(replace(coalesce(t, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;');
$$;

-- 5) Função que monta e envia o e-mail
create or replace function public.notificar_lead_novo() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_key   text;
  v_to    text;
  v_from  text;
  v_crm   text;
  v_int   text;
  v_orig  text;
  v_fone  text;
  v_html  text;
begin
  -- leads cadastrados à mão no CRM não geram e-mail
  if coalesce((new.origem ->> 'manual')::boolean, false) then
    return new;
  end if;

  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'resend_api_key' limit 1;
  select valor into v_to   from public.crm_config where chave = 'email_destino';
  select valor into v_from from public.crm_config where chave = 'email_remetente';
  select valor into v_crm  from public.crm_config where chave = 'crm_url';

  if v_key is null or v_key like 'COLE_%' or coalesce(v_to, '') = '' then
    return new;   -- aviso ainda não configurado: o lead é salvo normalmente
  end if;

  v_int := case new.plano
    when 'essencial'    then 'Site · Essencial (Landing Page)'
    when 'profissional' then 'Site · Profissional (Landing + Banco de Dados)'
    when 'completo'     then 'Site · Completo (+ Suporte 24h)'
    when 'suporte'      then 'Suporte em TI'
    when 'seguranca'    then 'Pentest / segurança'
    else 'Ainda não sabe, quer orientação'
  end;

  v_orig := coalesce(
    nullif(concat_ws(' / ', new.origem ->> 'utm_source', new.origem ->> 'utm_medium', new.origem ->> 'utm_campaign'), ''),
    nullif(new.origem ->> 'referrer', ''),
    'acesso direto ao site');

  v_fone := case when length(new.whatsapp) >= 10
    then '(' || left(new.whatsapp, 2) || ') ' || substr(new.whatsapp, 3, length(new.whatsapp) - 6) || '-' || right(new.whatsapp, 4)
    else new.whatsapp end;

  v_html :=
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#0F1A2E">'
    || '<div style="background:#0F1A2E;color:#F3F5F9;padding:20px 24px;border-radius:14px 14px 0 0">'
    ||   '<div style="font-size:13px;color:#FF6B3D;font-family:monospace">tríade labs · crm</div>'
    ||   '<div style="font-size:22px;font-weight:bold;margin-top:6px">Lead novo pelo site</div>'
    || '</div>'
    || '<div style="border:1px solid #DDE3EC;border-top:0;padding:20px 24px;border-radius:0 0 14px 14px">'
    ||   '<table style="width:100%;font-size:15px;border-collapse:collapse">'
    ||     '<tr><td style="padding:6px 0;color:#5E6E89;width:110px">Nome</td><td style="padding:6px 0"><b>' || esc_html(new.nome) || '</b></td></tr>'
    ||     '<tr><td style="padding:6px 0;color:#5E6E89">Empresa</td><td style="padding:6px 0">' || esc_html(new.empresa) || '</td></tr>'
    ||     '<tr><td style="padding:6px 0;color:#5E6E89">WhatsApp</td><td style="padding:6px 0">' || esc_html(v_fone) || '</td></tr>'
    ||     '<tr><td style="padding:6px 0;color:#5E6E89">Interesse</td><td style="padding:6px 0">' || esc_html(v_int) || '</td></tr>'
    ||     '<tr><td style="padding:6px 0;color:#5E6E89">Origem</td><td style="padding:6px 0">' || esc_html(v_orig) || '</td></tr>'
    ||     '<tr><td style="padding:6px 0;color:#5E6E89">Recebido</td><td style="padding:6px 0">'
    ||        to_char(new.created_at at time zone 'America/Sao_Paulo', 'DD/MM/YYYY "às" HH24:MI') || '</td></tr>'
    ||   '</table>'
    ||   '<div style="margin-top:20px">'
    ||     '<a href="https://wa.me/55' || new.whatsapp || '" style="display:inline-block;background:#2DD4A7;color:#0F1A2E;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:999px;margin:0 8px 8px 0">Chamar no WhatsApp</a>'
    ||     case when coalesce(v_crm, '') <> ''
             then '<a href="' || esc_html(v_crm) || '" style="display:inline-block;border:1px solid #0F1A2E;color:#0F1A2E;text-decoration:none;font-weight:bold;padding:11px 20px;border-radius:999px">Abrir no CRM</a>'
             else '' end
    ||   '</div>'
    ||   '<p style="font-size:12px;color:#5E6E89;margin:20px 0 0">A promessa do site é responder em até 2 horas úteis.</p>'
    || '</div></div>';

  perform net.http_post(
    url     := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
    body    := jsonb_build_object(
      'from',    coalesce(nullif(v_from, ''), 'CRM Tríade Labs <onboarding@resend.dev>'),
      'to',      to_jsonb(string_to_array(replace(v_to, ' ', ''), ',')),
      'subject', 'Lead novo: ' || new.nome || ' · ' || new.empresa,
      'html',    v_html)
  );
  return new;

exception when others then
  -- qualquer falha no aviso nunca impede o lead de ser salvo
  raise warning 'notificar_lead_novo falhou: %', sqlerrm;
  return new;
end $$;

-- ninguém de fora pode chamar a função diretamente
revoke all on function public.notificar_lead_novo() from public, anon, authenticated;

-- 6) Dispara a cada lead novo
drop trigger if exists leads_notificar on public.leads;
create trigger leads_notificar
  after insert on public.leads
  for each row execute function public.notificar_lead_novo();

-- ---------------------------------------------------------------------
-- TESTE: envie um pedido pelo formulário do site. O e-mail chega em segundos.
-- Se não chegar, veja a resposta do Resend com:
--   select status_code, content, created from net._http_response order by created desc limit 5;
-- (o e-mail de teste pode cair no Spam na primeira vez: marque "Não é spam")
-- ---------------------------------------------------------------------
