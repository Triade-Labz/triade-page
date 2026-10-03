# Tríade Labs — como colocar site e CRM no ar

## Arquivos
- `index.html` — a landing page.
- `politica-de-privacidade.html` — política de privacidade (linkada no formulário e no rodapé).
- `crm.html` — o painel do CRM (fica no mesmo site, em `/crm.html`; não aparece no Google).
- `database/01-tabela-leads.sql` e `database/02-painel-equipe.sql` — criam o banco do CRM.
- `database/03-aviso-email.sql` — manda um e-mail a cada lead novo do site.
- `database/extra-atualizacao-servicos.sql` — só se a Parte 1 tiver sido rodada antes dos serviços novos.
- `portfolio-gvg.webp` e `portfolio-saj.webp` — prints do portfólio (já estão embutidos no index.html; ficam aqui só como cópia).
- `triade-simbolo.svg` — símbolo da marca.

## 1. Banco de dados (Supabase, gratuito)
1. Crie uma conta em supabase.com e um projeto (região: São Paulo).
2. Em **SQL Editor**, rode `database/01-tabela-leads.sql`.
3. Abra `database/02-painel-equipe.sql`, troque os 3 e-mails e nomes de exemplo pelos dos sócios e rode.
4. Em **Authentication → Sign In / Providers**, desative **Allow new users to sign up**.
5. Em **Authentication → Users → Add user**, crie um usuário para cada sócio (mesmo e-mail do passo 3), com senha.
6. Em **Project Settings → API**, copie a **URL** e a chave **anon / publishable**.

## 1b. Aviso por e-mail (Resend, gratuito)
1. Crie uma conta em resend.com com **jvv.moraes05@gmail.com** (sem domínio próprio, o Resend só envia para o e-mail da própria conta).
2. Em **API Keys → Create API Key**, copie a chave (começa com `re_`).
3. Abra `database/03-aviso-email.sql`, cole a chave no lugar de `COLE_A_CHAVE_DO_RESEND_AQUI` e rode no SQL Editor.
4. Para trocar o e-mail depois: `update public.crm_config set valor = 'novo@email.com' where chave = 'email_destino';`
5. Quando o site estiver publicado, coloque o endereço do CRM para aparecer o botão "Abrir no CRM" no e-mail:
   `update public.crm_config set valor = 'https://SEU-ENDERECO/crm.html' where chave = 'crm_url';`

## 2. Configurar os arquivos
No início do `<script>` de **index.html** e de **crm.html**, no bloco `CONFIG`, cole a URL e a chave.
No index.html, preencha também o que já tiverem (WhatsApp, e-mail, redes). Campo vazio não aparece no site.

## 3. Publicar (gratuito)
Use Cloudflare Pages ou Netlify: arraste a pasta com `index.html`, `politica-de-privacidade.html`, `crm.html` e `triade-simbolo.svg`.
Depois, em Supabase → **Authentication → URL Configuration**, coloque o endereço do site em **Site URL**
(necessário para o "Esqueci minha senha" funcionar).

## 4. Testar
Envie um pedido pelo formulário do site: ele aparece na coluna **Novo** do CRM em tempo real e o e-mail chega em segundos (na primeira vez, confira o Spam).

## Antes de divulgar
- Domínio (.com.br no registro.br, pode ser registrado com CPF).
- WhatsApp Business com número da empresa.
- Apagar leads não convertidos com mais de 12 meses (prazo prometido na política de privacidade).
- Depoimentos reais (a seção está oculta até lá).
- Autorização dos clientes GVG e FABIN para mostrar os projetos no portfólio.
