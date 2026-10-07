# Tríade Labs — site e CRM

**Construir. Sustentar. Proteger.**
Landing page da Tríade Labs, política de privacidade e CRM próprio para os leads do site,
em **React + TypeScript** (Vite) com banco no **Supabase**.

## Por que os leads não chegavam no CRM (e o que foi corrigido)

Três problemas, em camadas:

1. **O banco nunca tinha sido criado:** o projeto Supabase estava sem nenhuma tabela, então
   o formulário não tinha onde gravar.
2. **A URL e a chave do Supabase estavam vazias** e eram copiadas à mão em dois arquivos (site
   e CRM): o site falhava e o CRM abria em modo demonstração, com leads falsos.
3. **Os SQLs não tinham `GRANT`.** Desde 30/05/2026 o Supabase cria projetos sem liberar as
   tabelas para a API (e em 30/10/2026 isso passa a valer para tabelas novas de todos os
   projetos). Mesmo rodando os SQLs antigos, o formulário receberia `permission denied for
   table leads` (código `42501`).

O que mudou:

- O banco foi criado com `npm run db -- migrate` (veja abaixo).
- `database/04-permissoes-site-crm.sql` libera o acesso certo: o site **só insere** (e só as
  colunas do formulário) e a equipe logada lê e edita. Os arquivos 01 e 02 também já trazem
  os grants para instalações novas.
- Site e CRM leem a **mesma configuração** (`.env` / variáveis da hospedagem).
- Em produção, CRM sem configuração mostra um erro claro em vez de dados de exemplo.
- O WhatsApp preenchido pelo navegador como `+55 51 9…` agora é salvo certo (antes virava
  outro número), e erros do banco aparecem com a explicação de como resolver.
- O CRM busca todos os leads (o Supabase corta em 1000 por consulta) e, se o tempo real cair,
  consulta o banco a cada 30 s para nenhum lead ficar de fora.

## Estrutura

```
index.html, crm.html,           páginas (entradas do Vite)
politica-de-privacidade.html
src/
  landing/                      site: seções, formulário, envio do lead (services/submitLead.ts)
  crm/                          painel: login, funil, lista, gaveta do lead, tempo real
  privacy/                      política de privacidade
  shared/                       tipos do lead, telefone, validação, configuração
  prerender.tsx                 gera o HTML do site e da política no build (SEO)
public/                         _headers (segurança), favicon, símbolo da marca
database/                       SQLs do Supabase, rodar nesta ordem
  01-tabela-leads.sql
  02-painel-equipe.sql
  03-aviso-email.sql            (opcional: e-mail a cada lead)
  04-permissoes-site-crm.sql    ★ correção das permissões (rodar sempre)
  extra-atualizacao-servicos.sql (só se a 01 foi rodada antes dos serviços novos)
  tests/                        testes dos SQLs num Postgres em memória
docs/
  COMO-ATIVAR.md                passo a passo completo de ativação
  portfolio-prints/             prints originais do portfólio
```

## Rodar localmente

Requer Node 20.19+ (recomendado 22, veja `.nvmrc`).

```bash
npm install
```

```bash
npm run dev
```

Abra http://localhost:5173 (site), http://localhost:5173/crm.html (CRM) e
http://localhost:5173/politica-de-privacidade.html.
Sem `.env`, o CRM abre em **modo demonstração** (leads de exemplo, nada é salvo) e o
formulário mostra o erro de configuração.

Para usar o banco de verdade, copie `.env.example` para `.env` e preencha.

## Banco de dados pelo terminal

Com `DATABASE_URL` no `.env` (conexão direta do Supabase; só fica no seu computador):

| comando | o que faz |
| --- | --- |
| `npm run db -- status` | mostra tabelas, permissões, equipe e aviso por e-mail |
| `npm run db -- migrate` | aplica 01, 02 e 04 (e 03 se houver `RESEND_API_KEY` no `.env`) numa transação; pode rodar de novo |
| `npm run db -- smoke` | testa de verdade "site grava → CRM enxerga" e desfaz tudo no final |
| `npm run db -- equipe add email@x.com "Nome"` | libera um sócio no CRM (o login é criado em Supabase → Authentication → Users) |
| `npm run db -- equipe list` / `remove email@x.com` | lista / remove |

## Scripts

| comando | o que faz |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | checa tipos, gera `dist/` e pré-renderiza site e política |
| `npm run preview` | serve o `dist/` gerado |
| `npm test` | testes (front-end + SQLs do banco) |
| `npm run check` | tipos + lint + testes |

## Configuração

- **Supabase** (`.env` ou variáveis da hospedagem, veja `.env.example`):
  `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` (chave **publishable/anon**; o
  banco só deixa o site *inserir* leads). O build avisa se estiverem faltando.
- **Contatos públicos** (WhatsApp, e-mail, CNPJ, redes): `src/shared/siteConfig.ts`.
  Campo vazio não aparece no site.
- **Textos da landing** (planos, FAQ, portfólio…): `src/landing/content.ts`.

## Publicar (Cloudflare Pages, deploy automático)

**Workers & Pages → Create → Pages → Connect to Git**, escolha este repositório e configure:

- Framework preset: **Vite** (ou None)
- Build command: **`npm run build`**
- Build output directory: **`dist`**
- Environment variables (Production **e** Preview): `VITE_SUPABASE_URL`,
  `VITE_SUPABASE_PUBLISHABLE_KEY` e `NODE_VERSION` = `22`

A partir daí, cada `git push` na branch principal publica o site sozinho.
O CRM fica em `/crm.html` (o Cloudflare também atende em `/crm`).

## ⚠️ Segurança: o que NUNCA subir para o GitHub

- O arquivo `.env` (já está no `.gitignore`; só o `.env.example` vai para o Git).
- A chave do **Resend** (`re_...`). Cole a chave só no SQL Editor do Supabase, na hora
  de rodar o `03-aviso-email.sql`, e **não salve** o arquivo com ela.
- A chave **secret/service_role** do Supabase (nenhum arquivo deste projeto precisa dela;
  o site se recusa a usar uma chave secreta se ela for configurada por engano).
- Senhas dos usuários do CRM.

Se alguma chave for enviada por engano, apague-a no painel do serviço e gere outra:
remover do código não basta, porque ela continua no histórico do Git.
