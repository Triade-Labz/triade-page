# Tríade Labs — site, CRM e controle de projetos

**Construir. Sustentar. Proteger.**
Landing page da Tríade Labs, política de privacidade, CRM próprio para os leads do site e
controle de projetos dos clientes, em **React + TypeScript** (Vite) com banco no **Supabase**.

## Controle de projetos (`/desenvolvimento-projetos`)

Painel da equipe para acompanhar cada projeto de cliente, com o **mesmo login do CRM**
(quem entra em um já está logado no outro; o topo dos dois tem o atalho CRM | Projetos).

- **Etapas** (quadro com arrastar e soltar): Escopo → Design → Landing page → Integração
  backend → Teste de vulnerabilidade → Revisão e entrega → Concluído. O botão **Avançar**
  pula as etapas que não fazem parte do plano (ex.: landing page não tem backend).
- **Escopo** de cada projeto: objetivo, o que está incluído, o que fica fora e links. O botão
  **Copiar escopo** gera o texto para mandar ao cliente no WhatsApp ou e-mail.
- **Checklist por etapa**, criado a partir do plano contratado (baseado na proposta
  comercial: design, landing page, aplicação, análise de vulnerabilidades, INPI), com quem
  marcou cada tarefa e quando. Dá para acrescentar e apagar tarefas.
- **Histórico**: mudanças de etapa/situação são registradas pelo banco com o nome de quem
  mudou; a equipe acrescenta anotações (reuniões, aprovações, pedidos do cliente).
- **Situação** (em andamento, aguardando cliente, pausado, cancelado), responsável, início e
  prazo, com alerta de prazo vencido e de entregas da semana.
- **Ligação com o CRM**: quando um lead passa para **Fechado**, o banco cria o projeto sozinho
  (gatilho em `database/05-projetos.sql`), já com o checklist do plano e, para landing page,
  prazo de 15 dias. No CRM, o lead fechado ganha o botão **Abrir projeto**; no projeto,
  **Ver no CRM** volta para o lead.

O checklist padrão de cada plano fica em `public.projeto_modelo` (05-projetos.sql) e numa
cópia em `src/projetos/lib/modelos.ts`; um teste avisa se os dois ficarem diferentes.

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
desenvolvimento-projetos.html,
politica-de-privacidade.html
src/
  landing/                      site: seções, formulário, envio do lead (services/submitLead.ts)
  painel/                       base comum do CRM e dos projetos: login, senha, topo, estilos
  crm/                          CRM: funil, lista, gaveta do lead, tempo real
  projetos/                     controle de projetos: quadro por etapa, escopo, checklist
  privacy/                      política de privacidade
  shared/                       tipos do lead e do projeto, telefone, validação, configuração
public/                         favicon, símbolo da marca
vercel.json                     build e cabeçalhos de segurança na Vercel
database/                       SQLs do Supabase, rodar nesta ordem
  01-tabela-leads.sql
  02-painel-equipe.sql
  03-aviso-email.sql            (opcional: e-mail a cada lead)
  04-permissoes-site-crm.sql    ★ correção das permissões (rodar sempre)
  05-projetos.sql               controle de projetos + contrato fechado no CRM vira projeto
  extra-atualizacao-servicos.sql (só se a 01 foi rodada antes dos serviços novos)
  tests/                        testes dos SQLs num Postgres em memória
docs/
  COMO-ATIVAR.md                passo a passo completo de ativação
```

## Rodar localmente

Requer Node 20.19+ (recomendado 22).

```bash
npm install
```

```bash
npm run dev
```

Abra http://localhost:5173 (site), http://localhost:5173/crm.html (CRM),
http://localhost:5173/desenvolvimento-projetos (projetos) e
http://localhost:5173/politica-de-privacidade.html.
Sem `.env`, CRM e projetos abrem em **modo demonstração** (dados de exemplo, nada é salvo) e o
formulário mostra o erro de configuração.

Para usar o banco de verdade, copie `.env.example` para `.env` e preencha.

## Banco de dados pelo terminal

Com `DATABASE_URL` no `.env` (conexão direta do Supabase; só fica no seu computador):

| comando | o que faz |
| --- | --- |
| `npm run db -- status` | mostra tabelas, permissões, projetos, equipe e aviso por e-mail |
| `npm run db -- migrate` | aplica 01, 02, 04 e 05 (e 03 se houver `RESEND_API_KEY` no `.env`) numa transação; pode rodar de novo |
| `npm run db -- smoke` | testa de verdade "site grava → CRM enxerga" e desfaz tudo no final |
| `npm run db -- equipe add email@x.com "Nome"` | libera um sócio no CRM e nos projetos (o login é criado em Supabase → Authentication → Users) |
| `npm run db -- equipe list` / `remove email@x.com` | lista / remove |

## Scripts

| comando | o que faz |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | checa tipos e gera `dist/` |
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

## Publicar (Vercel, deploy automático)

Em vercel.com: **Add New → Project → Import** este repositório (`Triade-Labz/triade-page`).
Framework, comando de build e pasta de saída já vêm do `vercel.json`; só cadastre em
**Environment Variables** (Production e Preview):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

e clique em **Deploy**. A partir daí, cada `git push` na `main` publica o site sozinho.
Mudou uma variável? Faça um **Redeploy**: elas entram no build.
O CRM fica em `/crm.html` (ou `/crm`) e o controle de projetos em `/desenvolvimento-projetos`.

## ⚠️ Segurança: o que NUNCA subir para o GitHub

- O arquivo `.env` (já está no `.gitignore`; só o `.env.example` vai para o Git).
- A chave do **Resend** (`re_...`). Cole a chave só no SQL Editor do Supabase, na hora
  de rodar o `03-aviso-email.sql`, e **não salve** o arquivo com ela.
- A chave **secret/service_role** do Supabase (nenhum arquivo deste projeto precisa dela;
  o site se recusa a usar uma chave secreta se ela for configurada por engano).
- Senhas dos usuários do CRM.

Se alguma chave for enviada por engano, apague-a no painel do serviço e gere outra:
remover do código não basta, porque ela continua no histórico do Git.
