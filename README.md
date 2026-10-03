# Tríade Labs — site e CRM

**Construir. Sustentar. Proteger.**
Landing page da Tríade Labs, política de privacidade e CRM próprio para os leads do site.

## Estrutura

```
site/                         ← tudo o que vai para o ar
  index.html                  landing page
  politica-de-privacidade.html
  crm.html                    painel do CRM (login só da equipe)
  triade-simbolo.svg          símbolo da marca
  _headers                    cabeçalhos de segurança da hospedagem
database/                     SQLs do Supabase, rodar nesta ordem
  01-tabela-leads.sql
  02-painel-equipe.sql
  03-aviso-email.sql
  extra-atualizacao-servicos.sql   (só se a 01 foi rodada antes dos serviços novos)
docs/
  COMO-ATIVAR.md              passo a passo completo de ativação
  portfolio-prints/           prints originais do portfólio
```

## Ver localmente

Abra `site/index.html` no navegador. O `site/crm.html`, sem o Supabase configurado,
abre em **modo demonstração** com leads de exemplo (nada é salvo).

## Publicar com deploy automático

No Cloudflare Pages: **Create → Pages → Connect to Git**, escolha este repositório e configure:

- Framework preset: **None**
- Build command: *(vazio)*
- Build output directory: **`triade-labs/site`** (pasta deste projeto dentro do repositório `projetos-gurizada`)

A partir daí, cada `git push` na branch principal publica o site sozinho.

## Configuração

Os dados de conexão ficam no bloco `CONFIG`, no início do `<script>` de
`site/index.html` e `site/crm.html`:

- `supabaseUrl` e `supabaseKey` (chave **anon/publishable**: pode ficar no código,
  o banco só permite que o site *envie* leads);
- `whatsapp`, `email`, `cnpj` e redes sociais (campo vazio não aparece no site).

## ⚠️ Segurança: o que NUNCA subir para o GitHub

- A chave do **Resend** (`re_...`). Cole a chave só no SQL Editor do Supabase, na hora
  de rodar o `03-aviso-email.sql`, e **não salve** o arquivo com ela.
- A chave **service_role** do Supabase (nenhum arquivo deste projeto precisa dela).
- Senhas dos usuários do CRM.

Se alguma chave for enviada por engano, apague-a no painel do serviço e gere outra:
remover do código não basta, porque ela continua no histórico do Git.
