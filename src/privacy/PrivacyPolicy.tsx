import type { ReactNode } from "react";
import { LogoMark, Wordmark } from "../shared/components/LogoMark";
import { SITE } from "../shared/siteConfig";

const ATUALIZADA_EM = "1º de outubro de 2026";
const lgpdMailto = `mailto:${SITE.emailPrivacidade}?subject=${encodeURIComponent("Pedido LGPD")}`;

const SECOES: { id: string; titulo: string }[] = [
  { id: "quem", titulo: "Quem somos" },
  { id: "dados", titulo: "Quais dados coletamos" },
  { id: "uso", titulo: "Para que usamos" },
  { id: "base", titulo: "Bases legais" },
  { id: "compartilhamento", titulo: "Com quem compartilhamos" },
  { id: "internacional", titulo: "Transferência internacional" },
  { id: "prazo", titulo: "Por quanto tempo guardamos" },
  { id: "seguranca", titulo: "Como protegemos" },
  { id: "direitos", titulo: "Seus direitos" },
  { id: "cookies", titulo: "Cookies" },
  { id: "clientes", titulo: "Dados de projetos de clientes" },
  { id: "menores", titulo: "Menores de idade" },
  { id: "mudancas", titulo: "Mudanças nesta política" },
  { id: "contato", titulo: "Contato" },
];

function Secao({ id, children }: { id: string; children: ReactNode }) {
  const i = SECOES.findIndex((s) => s.id === id);
  return (
    <section id={id}>
      <h2>
        <span className="n">{String(i + 1).padStart(2, "0")}</span>
        {SECOES[i]?.titulo}
      </h2>
      {children}
    </section>
  );
}

export function PrivacyPolicy() {
  return (
    <>
      <header className="top">
        <div className="top-in">
          <a className="brand" href="index.html" aria-label="Tríade Labs — página inicial">
            <LogoMark />
            <Wordmark />
          </a>
          <a className="back" href="index.html">
            Voltar ao site
          </a>
        </div>
      </header>

      <div className="hero">
        <div className="hero-in">
          <p className="tag">// privacidade</p>
          <h1>Política de Privacidade</h1>
          <p>
            Como a Tríade Labs coleta, usa e protege os dados que você envia pelo nosso site, e como você pode exercer os seus direitos pela Lei
            Geral de Proteção de Dados (Lei nº 13.709/2018, a LGPD).
          </p>
          <p className="upd">Última atualização: {ATUALIZADA_EM}</p>
        </div>
      </div>

      <main className="wrap">
        <nav className="toc" aria-label="Nesta página">
          <p>Nesta página</p>
          <ol>
            {SECOES.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>{s.titulo}</a>
              </li>
            ))}
          </ol>
        </nav>

        <article>
          <div className="summary">
            <h2>Resumo</h2>
            <ul>
              <li>Coletamos apenas o que você digita no formulário de orçamento: nome, empresa, WhatsApp e o serviço de interesse.</li>
              <li>Usamos esses dados só para responder ao seu pedido e conversar sobre o projeto.</li>
              <li>Não vendemos nem alugamos seus dados, e não mandamos propaganda sem você pedir.</li>
              <li>
                Você pode pedir a qualquer momento para ver, corrigir ou apagar seus dados, pelo e-mail{" "}
                <a href={`mailto:${SITE.emailPrivacidade}`}>{SITE.emailPrivacidade}</a>.
              </li>
            </ul>
          </div>

          <Secao id="quem">
            {/* QUANDO TIVER CNPJ: incluir razão social, CNPJ e endereço neste parágrafo. */}
            <p>
              A Tríade Labs é formada por três sócios que desenvolvem sites, sistemas e SaaS, prestam suporte em TI e realizam testes de segurança
              para empresas, com atuação em Canoas, RS, e atendimento em todo o Brasil.
            </p>
            <p>
              Para os fins da LGPD, os sócios da Tríade Labs são os <strong>controladores</strong> dos dados pessoais tratados por meio deste site,
              ou seja, são eles que decidem como e para que os dados são usados.
            </p>
          </Secao>

          <Secao id="dados">
            <h3>Dados que você nos informa</h3>
            <p>Quando você preenche o formulário de orçamento, coletamos:</p>
            <ul>
              <li>nome;</li>
              <li>nome da empresa;</li>
              <li>número de WhatsApp;</li>
              <li>serviço ou plano de interesse;</li>
              <li>a data e a hora em que você aceitou esta política.</li>
            </ul>
            <p>
              Se você conversar com a gente por WhatsApp ou e-mail, também guardamos o conteúdo dessas conversas que for necessário para o
              atendimento, como anotações sobre o seu projeto.
            </p>
            <h3>Dados coletados automaticamente</h3>
            <p>
              Junto com o formulário, registramos de onde veio a visita, para entender quais canais trazem contatos: a página do site em que você
              estava, o endereço do site que te trouxe até aqui (se houver) e os parâmetros de campanha presentes no link (por exemplo,{" "}
              <code>utm_source</code> ou identificadores de anúncios).
            </p>
            <p>Como em qualquer site, os serviços que entregam as páginas recebem automaticamente dados técnicos da sua conexão, como endereço IP e tipo de navegador.</p>
            <p>Não coletamos dados sensíveis (como saúde, religião ou biometria) nem documentos pessoais pelo site.</p>
          </Secao>

          <Secao id="uso">
            <ul>
              <li>
                <strong>Responder ao seu pedido:</strong> entrar em contato pelo WhatsApp, entender a sua necessidade e enviar uma proposta.
              </li>
              <li>
                <strong>Acompanhar a negociação:</strong> organizar os contatos recebidos no nosso sistema interno, registrar o andamento e lembrar
                de retornos combinados com você.
              </li>
              <li>
                <strong>Entender de onde vêm os contatos:</strong> saber quais canais e campanhas funcionam melhor, de forma agregada.
              </li>
              <li>
                <strong>Proteger o site:</strong> identificar e bloquear envios automáticos (spam) e abusos.
              </li>
              <li>
                <strong>Cumprir obrigações legais:</strong> quando a lei exigir que algum dado seja guardado ou informado a uma autoridade.
              </li>
            </ul>
            <p>Não usamos seus dados para tomar decisões automatizadas sobre você, e não enviamos mensagens de marketing sem a sua autorização.</p>
          </Secao>

          <Secao id="base">
            <p>Cada uso dos dados se apoia em uma das hipóteses do artigo 7º da LGPD:</p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Uso</th>
                    <th>Base legal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Responder ao pedido de orçamento e negociar a proposta</td>
                    <td>
                      Procedimentos preliminares relacionados a contrato, a pedido do titular (art. 7º, V) e consentimento registrado no formulário
                      (art. 7º, I)
                    </td>
                  </tr>
                  <tr>
                    <td>Registrar a origem da visita e proteger o site contra spam</td>
                    <td>Legítimo interesse (art. 7º, IX), limitado ao mínimo necessário</td>
                  </tr>
                  <tr>
                    <td>Guardar dados exigidos por lei</td>
                    <td>Cumprimento de obrigação legal (art. 7º, II)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>Quando o uso se baseia no seu consentimento, você pode revogá-lo a qualquer momento pelo e-mail de contato, sem prejuízo do que já foi feito antes.</p>
          </Secao>

          <Secao id="compartilhamento">
            <p>
              Seus dados são acessados apenas pelos sócios da Tríade Labs. Para o site funcionar, contamos com fornecedores de tecnologia que tratam
              os dados <strong>em nosso nome, sob nossas instruções e só para essa finalidade</strong> (operadores, na linguagem da LGPD), nas
              seguintes categorias:
            </p>
            <ul>
              <li>
                <strong>hospedagem do site</strong>, para entregar as páginas;
              </li>
              <li>
                <strong>banco de dados</strong>, onde os pedidos de orçamento ficam guardados com segurança;
              </li>
              <li>
                <strong>envio e recebimento de e-mails</strong>, para avisar a equipe sobre pedidos novos e responder às suas mensagens;
              </li>
              <li>
                <strong>mensagens pelo WhatsApp</strong>, quando conversamos com você por esse canal.
              </li>
            </ul>
            <p>Se quiser saber exatamente quais fornecedores tratam os seus dados, é só pedir pelo nosso canal de contato.</p>
            <p>
              Também podemos compartilhar dados quando a lei exigir ou por ordem de autoridade competente.{" "}
              <strong>Nunca vendemos, alugamos ou cedemos seus dados</strong> para terceiros usarem em marketing.
            </p>
          </Secao>

          <Secao id="internacional">
            <p>
              Alguns dos nossos fornecedores de tecnologia podem processar dados em servidores fora do Brasil. Escolhemos fornecedores reconhecidos,
              que adotam medidas de segurança e compromissos contratuais de proteção de dados compatíveis com a LGPD, conforme os artigos 33 e
              seguintes da lei.
            </p>
          </Secao>

          <Secao id="prazo">
            <ul>
              <li>
                <strong>Se o pedido não virar contrato:</strong> guardamos os dados por até 12 meses após o último contato, para o caso de você
                retomar a conversa. Depois disso, os dados são apagados.
              </li>
              <li>
                <strong>Se você se tornar cliente:</strong> mantemos os dados enquanto durar a relação e, depois, pelo prazo exigido pela legislação
                civil e fiscal.
              </li>
              <li>
                <strong>Se você pedir a exclusão:</strong> apagamos assim que possível, exceto o que a lei nos obrigar a manter.
              </li>
            </ul>
          </Secao>

          <Secao id="seguranca">
            <p>Segurança é uma das nossas áreas de trabalho, e aplicamos aqui o que recomendamos aos clientes:</p>
            <ul>
              <li>o site e o envio do formulário usam conexão criptografada (HTTPS);</li>
              <li>
                o formulário só consegue <em>enviar</em> dados; ninguém consegue lê-los pelo site;
              </li>
              <li>o sistema interno onde os pedidos ficam exige login com senha e só permite a entrada dos sócios;</li>
              <li>chaves de acesso aos sistemas ficam guardadas em cofre criptografado;</li>
              <li>coletamos o mínimo de dados necessário para atender você.</li>
            </ul>
            <p>
              Nenhum sistema é totalmente imune a falhas. Se acontecer um incidente de segurança que possa trazer risco ou dano relevante a você,
              avisaremos você e a Autoridade Nacional de Proteção de Dados (ANPD), como determina a LGPD.
            </p>
          </Secao>

          <Secao id="direitos">
            <p>Pelo artigo 18 da LGPD, você pode pedir a qualquer momento:</p>
            <ul>
              <li>confirmação de que tratamos dados seus, e acesso a eles;</li>
              <li>correção de dados incompletos, errados ou desatualizados;</li>
              <li>anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desacordo com a lei;</li>
              <li>portabilidade dos dados a outro fornecedor;</li>
              <li>eliminação dos dados tratados com base no seu consentimento;</li>
              <li>informação sobre com quem compartilhamos seus dados;</li>
              <li>informação sobre a possibilidade de não dar o consentimento, e as consequências disso;</li>
              <li>revogação do consentimento.</li>
            </ul>
            <p>
              Para exercer qualquer um desses direitos, escreva para <a href={lgpdMailto}>{SITE.emailPrivacidade}</a> com o assunto “Pedido LGPD”.
              Podemos pedir uma confirmação simples de identidade, para garantir que os dados sejam entregues só a você. Respondemos em até 15 dias.
            </p>
            <p>
              Se você não ficar satisfeito com a nossa resposta, também pode apresentar reclamação à ANPD, pelo site{" "}
              <a href="https://www.gov.br/anpd" target="_blank" rel="noopener">
                gov.br/anpd
              </a>
              .
            </p>
          </Secao>

          <Secao id="cookies">
            <p>
              Hoje, o nosso site <strong>não usa cookies de rastreamento, publicidade ou análise</strong>. Se no futuro passarmos a usar ferramentas
              desse tipo, atualizaremos esta política e pediremos a sua autorização antes de ativá-las.
            </p>
          </Secao>

          <Secao id="clientes">
            <p>
              Esta política trata dos dados coletados pelo site da Tríade Labs. Os dados a que temos acesso ao prestar serviços para clientes (por
              exemplo, ao desenvolver um sistema, dar suporte técnico ou realizar um teste de segurança) são tratados conforme o contrato de cada
              projeto, em que atuamos como operadores em nome do cliente, com sigilo e apenas para a finalidade contratada.
            </p>
          </Secao>

          <Secao id="menores">
            <p>
              Nossos serviços são voltados a empresas e profissionais, e o formulário não é destinado a menores de 18 anos. Se soubermos que
              recebemos dados de um menor sem autorização dos responsáveis, vamos apagá-los.
            </p>
          </Secao>

          <Secao id="mudancas">
            <p>
              Podemos atualizar esta política quando mudarmos a forma de tratar dados ou quando a lei mudar. A data da última atualização fica sempre
              no topo da página. Mudanças relevantes também serão destacadas no site.
            </p>
          </Secao>

          <Secao id="contato">
            <div className="contact">
              <p>
                <strong>Canal de privacidade da Tríade Labs</strong>
              </p>
              <p>
                E-mail: <a href={lgpdMailto}>{SITE.emailPrivacidade}</a>
                <br />
                Atuação: Canoas, RS · atendimento em todo o Brasil
              </p>
              <p className="last">Este é o canal para dúvidas sobre esta política e para pedidos relacionados aos seus dados pessoais.</p>
            </div>
          </Secao>
        </article>
      </main>

      <footer>
        © {new Date().getFullYear()} Tríade Labs · <a href="index.html">Voltar ao site</a>
      </footer>
    </>
  );
}
