import type { Plano } from "../../shared/leads";
import type { EtapaTrabalho } from "../../shared/projetos";

/**
 * Checklist padrão de cada plano: o que a equipe segue em cada etapa.
 * Cópia de public.projeto_modelo (database/05-projetos.sql), que é quem cria
 * as tarefas de verdade; aqui serve ao modo demonstração. O teste
 * database/tests/projetos.test.ts falha se os dois ficarem diferentes.
 */
const TODOS = "*";
const WEB: readonly Plano[] = ["essencial", "profissional", "completo"];

type Linha = readonly [planos: typeof TODOS | readonly Plano[], etapa: EtapaTrabalho, titulo: string];

const MODELO: readonly Linha[] = [
  [TODOS, "escopo", "Reunião de levantamento de requisitos"],
  [TODOS, "escopo", "Escrever o escopo: objetivo, o que está incluído e o que fica fora"],
  [["seguranca"], "escopo", "Autorização por escrito do cliente para os testes"],
  [TODOS, "escopo", "Escopo aprovado pelo cliente"],
  [TODOS, "escopo", "Definir prazo de entrega"],
  [TODOS, "escopo", "Receber o pagamento inicial (entrada ou implantação)"],
  [WEB, "escopo", "Receber do cliente textos, logo e imagens"],
  [["suporte"], "escopo", "Levantamento do ambiente de TI: equipamentos, rede e contas"],
  [["suporte"], "escopo", "Definir plano de atendimento e prazos de resposta"],
  [["duvida"], "escopo", "Definir o plano ou serviço contratado"],
  [["completo"], "design", "Identidade visual: cores, tipografia e logo"],
  [["completo"], "design", "Protótipo das telas"],
  [["completo"], "design", "Protótipo aprovado pelo cliente"],
  [WEB, "landing", "Estrutura e textos da página"],
  [WEB, "landing", "Desenvolver a página responsiva"],
  [WEB, "landing", "Formulário de contato funcionando"],
  [WEB, "landing", "SEO básico: título, descrição e compartilhamento"],
  [WEB, "landing", "Testar no celular e no computador"],
  [["profissional", "completo"], "backend", "Modelagem do banco de dados"],
  [["profissional", "completo"], "backend", "Regras de negócio e API"],
  [["profissional", "completo"], "backend", "Login e permissões de acesso"],
  [["profissional", "completo"], "backend", "Integrar a página com o backend"],
  [["profissional", "completo"], "backend", "Infraestrutura: hospedagem, domínio e backups"],
  [["completo", "seguranca"], "seguranca", "Varredura de vulnerabilidades no código e nas dependências"],
  [["completo", "seguranca"], "seguranca", "Testar autenticação, permissões e dados expostos"],
  [["completo", "seguranca"], "seguranca", "Relatório com as correções recomendadas"],
  [["completo"], "seguranca", "Aplicar as correções e testar de novo"],
  [WEB, "entrega", "1ª rodada de revisão com o cliente"],
  [WEB, "entrega", "2ª rodada de revisão com o cliente"],
  [WEB, "entrega", "Publicar no domínio do cliente"],
  [["completo"], "entrega", "Registro no INPI: preparar a documentação"],
  [["completo"], "entrega", "Registro no INPI: protocolar (taxa paga pelo cliente)"],
  [["seguranca"], "entrega", "Apresentar o relatório ao cliente"],
  [["suporte"], "entrega", "Implantar o suporte e passar os canais de atendimento"],
  [TODOS, "entrega", "Entregar acessos e orientações ao cliente"],
  [TODOS, "entrega", "Receber o pagamento final"],
];

export type TarefaModelo = { etapa: EtapaTrabalho; titulo: string; ordem: number };

export function modeloDoPlano(plano: Plano): TarefaModelo[] {
  return MODELO.flatMap(([planos, etapa, titulo], i) => (planos === TODOS || planos.includes(plano) ? [{ etapa, titulo, ordem: (i + 1) * 10 }] : []));
}
