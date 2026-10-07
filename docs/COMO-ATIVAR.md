# Tríade Labs — como colocar site e CRM no ar

## Arquivos
- `index.html` + `src/landing/` — a landing page.
- `politica-de-privacidade.html` + `src/privacy/` — política de privacidade (linkada no formulário e no rodapé).
- `crm.html` + `src/crm/` — o painel do CRM (fica no mesmo site, em `/crm.html`; não aparece no Google).
- `database/01-tabela-leads.sql` e `database/02-painel-equipe.sql` — criam o banco do CRM.
- `database/03-aviso-email.sql` — manda um e-mail a cada lead novo do site.
- `database/04-permissoes-site-crm.sql` — libera o site para gravar leads e o CRM para lê-los (obrigatório).
- `database/extra-atualizacao-servicos.sql` — só se a Parte 1 tiver sido rodada antes dos serviços novos.
- `src/landing/assets/portfolio/` — prints do portfólio usados no site (`docs/portfolio-prints/` guarda os originais).
- `public/triade-simbolo.svg` — símbolo da marca.
- `vercel.json` — configuração de publicação e cabeçalhos de segurança na Vercel.

## 1. Banco de dados (Supabase, gratuito)
**Pelo terminal (recomendado):** com `DATABASE_URL` no `.env`, rode `npm run db -- migrate`, depois
`npm run db -- equipe add email@x.com "Nome"` para cada sócio e confira com `npm run db -- status`.
Em seguida faça os passos 5, 6 e 7 abaixo. **Pelo SQL Editor:**

1. Crie uma conta em supabase.com e um projeto (região: São Paulo).
2. Em **SQL Editor**, rode `database/01-tabela-leads.sql`.
3. Rode `database/02-painel-equipe.sql`. Depois cadastre os sócios: na seção 1 do arquivo há um `insert` comentado; troque os e-mails e nomes, tire os `--` e rode só esse trecho.
4. Rode `database/04-permissoes-site-crm.sql`.
   **Projeto que já estava funcionando "pela metade"** (formulário dando erro ou CRM vazio): rode só este arquivo, é a correção.
5. Em **Authentication → Sign In / Providers**, desative **Allow new users to sign up**.
6. Em **Authentication → Users → Add user**, crie um usuário para cada sócio (mesmo e-mail do passo 3), com senha.
7. Em **Project Settings → API**, copie a **URL** e a chave **publishable** (ou a antiga **anon**).

## 1b. Aviso por e-mail (Resend, gratuito)
1. Crie uma conta em resend.com com **jvv.moraes05@gmail.com** (sem domínio próprio, o Resend só envia para o e-mail da própria conta).
2. Em **API Keys → Create API Key**, copie a chave (começa com `re_`).
3. Abra `database/03-aviso-email.sql`, cole a chave no lugar de `COLE_A_CHAVE_DO_RESEND_AQUI` e rode no SQL Editor. **Não salve** o arquivo com a chave.
4. Para trocar o e-mail depois: `update public.crm_config set valor = 'novo@email.com' where chave = 'email_destino';`
5. Quando o site estiver publicado, coloque o endereço do CRM para aparecer o botão "Abrir no CRM" no e-mail:
   `update public.crm_config set valor = 'https://SEU-ENDERECO/crm.html' where chave = 'crm_url';`

## 2. Configurar
A URL e a chave do Supabase ficam em **um lugar só**, usado pelo site e pelo CRM:
- **No computador:** copie `.env.example` para `.env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
- **Na hospedagem:** cadastre as mesmas duas variáveis (passo 3).

WhatsApp, e-mail, CNPJ e redes da empresa ficam em `src/shared/siteConfig.ts`. Campo vazio não aparece no site.

## 3. Publicar (Vercel, gratuito)
1. Em vercel.com, **Add New → Project → Import** o repositório `Triade-Labz/triade-page`.
   Framework, build e pasta de saída já vêm configurados pelo `vercel.json`.
2. Em **Environment Variables**, para Production e Preview: `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
   Clique em **Deploy**.
3. Depois de mudar variáveis, faça um novo deploy (**Deployments → ⋯ → Redeploy**): elas entram no build.
4. Em Supabase → **Authentication → URL Configuration**, coloque o endereço do site em **Site URL** e o endereço
   do CRM (`https://SEU-ENDERECO/crm.html`) em **Redirect URLs** (necessário para o "Esqueci minha senha" funcionar).

## 4. Testar
Envie um pedido pelo formulário do site: ele aparece na coluna **Novo** do CRM em tempo real e o e-mail chega em segundos
(na primeira vez, confira o Spam).

Se o formulário mostrar "Não conseguimos enviar seu pedido", abra o console do navegador (F12): a mensagem diz o motivo.
O mais comum é `42501 permission denied` → rode `database/04-permissoes-site-crm.sql`.
Se o CRM mostrar "atualizando a cada 30 s" no topo, o tempo real não conectou: os leads continuam chegando, só com atraso.

## Antes de divulgar
- Domínio (.com.br no registro.br, pode ser registrado com CPF).
- WhatsApp Business com número da empresa.
- Apagar leads não convertidos com mais de 12 meses (prazo prometido na política de privacidade).
- Depoimentos reais (a seção fica oculta enquanto `TESTIMONIALS` em `src/landing/content.ts` estiver vazio).
- Autorização dos clientes GVG e FABIN para mostrar os projetos no portfólio.
