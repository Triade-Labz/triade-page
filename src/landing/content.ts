import type { Plano } from "../shared/leads";
import gvgImg from "./assets/portfolio/gvg.webp";
import sajImg from "./assets/portfolio/saj.webp";
import fabinImg from "./assets/portfolio/fabin-portal.webp";

/* Textos da landing. Para mudar conteúdo, edite aqui: os componentes só desenham. */

export interface Pillar {
  tag: string;
  title: string;
  text: string;
  items: string[];
  cta: { label: string; href: string; plano?: Plano };
}

export const PILLARS: Pillar[] = [
  {
    tag: "01 / construir",
    title: "Sites, páginas e SaaS sob medida",
    text: "Landing pages, sites institucionais e sistemas web com banco de dados, do design até o ar.",
    items: ["Landing pages e sites institucionais", "Sistemas e SaaS com painel administrativo", "Integrações com WhatsApp, pagamentos e APIs"],
    cta: { label: "Ver planos de sites", href: "#planos" },
  },
  {
    tag: "02 / sustentar",
    title: "Suporte completo em TI",
    text: "Cuidamos da tecnologia do dia a dia para a sua equipe trabalhar sem interrupção.",
    items: ["Suporte a computadores, redes e e-mail", "Backups, atualizações e manutenção preventiva", "Atendimento direto pelo WhatsApp"],
    cta: { label: "Pedir proposta de suporte", href: "#contato", plano: "suporte" },
  },
  {
    tag: "03 / proteger",
    title: "Pentest e testes de vulnerabilidade",
    text: "Testamos seus sistemas como um atacante faria, com a sua autorização, e mostramos como corrigir.",
    items: ["Testes em sites, aplicações e redes", "Relatório com riscos priorizados e correções", "Reteste depois que tudo for corrigido"],
    cta: { label: "Agendar avaliação de segurança", href: "#contato", plano: "seguranca" },
  },
];

export interface Stat {
  /** null = ainda sem número real: o card não aparece. */
  value: number | null;
  decimals?: number;
  suffix: string;
  label: string;
}

export const STATS: Stat[] = [
  { value: null, suffix: "+", label: "sites entregues" }, // PREENCHER quando houver número real
  { value: null, suffix: "", label: "clientes ativos" }, // PREENCHER quando houver número real
  { value: 99.9, decimals: 1, suffix: "%", label: "de uptime garantido" },
  { value: 24, suffix: "h", label: "de suporte, 7 dias por semana" },
];

/** Logos de clientes (com autorização). Lista vazia = faixa oculta. */
export const CLIENTS: string[] = [];

export type BenefitIcon = "design" | "seo" | "responsive" | "secure";

export const BENEFITS: { icon: BenefitIcon; title: string; text: string }[] = [
  { icon: "design", title: "Design sob medida", text: "Nada de template. Cada site nasce da identidade da sua marca e do seu público." },
  { icon: "seo", title: "Otimizado para o Google", text: "Estrutura, velocidade e conteúdo preparados para você ser encontrado." },
  { icon: "responsive", title: "100% responsivo", text: "Perfeito no celular, no tablet e no desktop, onde quer que seu cliente esteja." },
  { icon: "secure", title: "Seguro e rápido", text: "SSL, backups e infraestrutura de alto desempenho desde o primeiro dia." },
];

export interface Plan {
  plano: Extract<Plano, "essencial" | "profissional" | "completo">;
  tier: string;
  title: string;
  desc: string;
  inherits?: string;
  items: string[];
  cta: string;
  featured?: boolean;
}

/** Sem valores no site: cada projeto é negociado (veja a proposta comercial). */
export const PLANS: Plan[] = [
  {
    plano: "essencial",
    tier: "Essencial",
    title: "Landing Page",
    desc: "Para apresentar sua empresa e começar a gerar contatos.",
    items: [
      "Landing page profissional e responsiva",
      "Formulário de contato e integração com WhatsApp",
      "Hospedagem e ajustes simples",
      "Até 2 rodadas de revisão",
    ],
    cta: "Começar agora",
  },
  {
    plano: "profissional",
    tier: "Profissional",
    title: "Landing Page + Aplicação e Infraestrutura",
    desc: "Para quem precisa de um sistema com regras de negócio e dados próprios.",
    inherits: "Tudo do Essencial",
    items: [
      "Aplicação e infraestrutura: modelagem, regras de negócio e API",
      "Login e integração com o seu sistema",
      "Hospedagem e backups",
    ],
    cta: "Escolher Profissional",
    featured: true,
  },
  {
    plano: "completo",
    tier: "Completo",
    title: "Design + Aplicação + Segurança",
    desc: "Para empresas que querem o projeto completo e tranquilidade.",
    inherits: "Tudo do Profissional",
    items: [
      "Design: protótipo e identidade visual do projeto",
      "Análise de vulnerabilidades semestral",
      "Registro do software no INPI (na compra do projeto)",
      "Suporte prioritário",
    ],
    cta: "Falar com consultor",
  },
];

export const STEPS = [
  { title: "Briefing", text: "Entendemos seu negócio, seu público e seus objetivos em uma conversa estratégica.", dur: "1–2 dias" },
  { title: "Design", text: "Criamos o layout com a sua identidade. Você revisa e aprova antes de qualquer código.", dur: "3–5 dias" },
  { title: "Desenvolvimento", text: "Transformamos o design em um site rápido, seguro e otimizado para buscas.", dur: "5–7 dias" },
  { title: "Lançamento", text: "Configuramos domínio e hospedagem, testamos tudo e colocamos seu site no ar.", dur: "1 dia" },
];

export interface Case {
  bar: string;
  img: { src: string; width: number; height: number; alt: string };
  kicker: string;
  title: string;
  text: string;
  tags: string[];
  /** Quando o site estiver no ar, o card vira link. */
  url?: string;
}

export const CASES: Case[] = [
  {
    bar: "gvg · ginástica rítmica",
    img: { src: gvgImg, width: 1100, height: 590, alt: "Página inicial do site da GVG Ginástica Rítmica, com chamada para agendar aula experimental" },
    kicker: "Escola de ginástica · Canoas, RS",
    title: "GVG Ginástica Rítmica",
    text: "Site da escola com agendamento de aula experimental pelo WhatsApp e portal do aluno, com banco de dados completo por trás.",
    tags: ["Site institucional", "Portal do aluno", "Banco de dados"],
  },
  {
    bar: "saj · fabin",
    img: { src: sajImg, width: 1100, height: 524, alt: "Tela de acesso do sistema SAJ, Serviço de Assistência Jurídica da FABIN" },
    kicker: "Ensino jurídico · Faculdade FABIN",
    title: "SAJ: Núcleo de Prática Jurídica",
    text: "Sistema onde alunos redigem peças processuais, professores corrigem cada versão e a secretaria aprova cadastros e organiza as turmas.",
    tags: ["Sistema web", "3 perfis de acesso", "Banco de dados"],
  },
  {
    bar: "fabin · portal acadêmico",
    img: { src: fabinImg, width: 1100, height: 482, alt: "Painel do aluno no Portal Acadêmico da FABIN, com horário da semana e frequência" },
    kicker: "Ensino superior · Porto Alegre, RS",
    title: "Portal Acadêmico FABIN",
    text: "Site da faculdade e portal onde o aluno acompanha horários, frequência, materiais, boletim, rematrícula e financeiro, tudo integrado ao trabalho da secretaria e dos professores.",
    tags: ["Site + portal", "Área do aluno", "Banco de dados"],
  },
];

export const WIP = [
  { title: "Imobiliária", text: "vitrine de imóveis" },
  { title: "Barbearia", text: "agendamento e cursos online em vídeo" },
  { title: "Loja de celulares", text: "landing page e sistema de vendas" },
];

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
}

/** Só depoimentos reais e autorizados. Lista vazia = seção oculta. */
export const TESTIMONIALS: Testimonial[] = [];

export const FAQ = [
  {
    q: "Qual é o prazo de entrega?",
    a: "Landing pages ficam prontas em até 15 dias úteis após o briefing. Projetos com banco de dados levam de 3 a 4 semanas, e sites completos de 4 a 6 semanas, dependendo do número de páginas.",
  },
  {
    q: "O domínio e a hospedagem estão inclusos?",
    a: "Configuramos tudo para você. A hospedagem do primeiro ano está inclusa em todos os planos; o domínio (.com.br) é registrado em nome da sua empresa, para que ele seja sempre seu.",
  },
  {
    q: "Posso pedir alterações depois da entrega?",
    a: "Sim. Todos os planos incluem 30 dias de ajustes após o lançamento. No plano Completo, alterações e atualizações são contínuas e fazem parte da manutenção.",
  },
  {
    q: "Como funciona o suporte 24h?",
    a: "Você tem um canal direto via WhatsApp e e-mail, com atendimento a qualquer hora, inclusive fins de semana e feriados. Incidentes críticos têm tempo de resposta de até 1 hora.",
  },
  {
    q: "Como funciona o pentest? É seguro para o meu sistema?",
    a: "Antes de começar, definimos juntos o escopo e você autoriza os testes por escrito. Os testes são planejados para não derrubar o sistema e, ao final, você recebe um relatório com o que foi encontrado, o nível de risco de cada item e como corrigir. Depois das correções, fazemos um reteste.",
  },
  {
    q: "Posso trocar de plano depois?",
    a: "Pode. Você começa no Essencial e evolui quando precisar. O valor já investido é abatido do novo plano, sem perder nada do que foi construído.",
  },
  {
    q: "Quais são as formas de pagamento?",
    a: "Pix, boleto ou cartão de crédito. No pagamento único você pode parcelar sem juros; na modalidade mensal, o valor é dividido em 12 parcelas sem entrada.",
  },
];

export const NAV_LINKS = [
  { href: "#servicos", label: "Serviços" },
  { href: "#planos", label: "Planos" },
  { href: "#processo", label: "Processo" },
  { href: "#portfolio", label: "Portfólio" },
  { href: "#faq", label: "FAQ" },
];
