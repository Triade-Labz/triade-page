import { IconArrow, IconChat } from "./icons";
import { Reveal } from "./Reveal";

export function Hero() {
  return (
    <section className="shell navy hero curve-a" id="topo" aria-labelledby="hero-title">
      <div className="blob blob-1" aria-hidden="true" />
      <div className="blob blob-2" aria-hidden="true" />
      <div className="container">
        <div>
          <Reveal as="p" className="label">
            Sites, suporte em TI e segurança
          </Reveal>
          <Reveal as="h1" id="hero-title" delay={1}>
            Seu negócio merece um site <em>à altura.</em>
          </Reveal>
          <Reveal as="p" className="lead" delay={2}>
            Sites profissionais, rápidos e prontos para vender. Do briefing ao ar em poucas semanas, com design sob medida e tecnologia sólida.
          </Reveal>
          <Reveal className="hero-ctas" delay={3}>
            <a href="#planos" className="btn btn-primary">
              Ver planos <IconArrow />
            </a>
            <a href="#contato" className="btn btn-secondary">
              <IconChat /> Falar com especialista
            </a>
          </Reveal>
          <Reveal className="hero-note" delay={4}>
            {/* PREENCHER: quando houver clientes reais, voltar com "Mais de X empresas confiam no nosso trabalho" */}
            <span>Orçamento gratuito, resposta em até 2 horas úteis</span>
          </Reveal>
        </div>

        <Reveal
          className="hero-visual"
          delay={2}
          role="img"
          aria-label="Ilustração: site em construção em um navegador, com cards destacando painel de contatos e entrega da landing page personalizada em até 15 dias"
        >
          <div className="glass mock-browser">
            <div className="mock-bar" aria-hidden="true">
              <i />
              <i />
              <i />
              <div className="mock-url">
                <svg viewBox="0 0 24 24">
                  <path fill="none" stroke="currentColor" strokeWidth="2" d="M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z" />
                </svg>
                suaempresa.com.br
              </div>
            </div>
            <div className="mock-screen" aria-hidden="true">
              <div className="mock-nav">
                <b />
                <span>
                  <i />
                  <i />
                  <i />
                </span>
              </div>
              <div className="sk title" />
              <div className="sk title t2" />
              <div className="sk w60" style={{ marginTop: 18 }} />
              <div className="sk w40" />
              <div className="mock-row">
                <span className="pill" />
                <span className="pill o" />
              </div>
              <div className="mock-grid">
                <div />
                <div />
                <div className="building" />
              </div>
              <svg className="cursor" viewBox="0 0 24 24">
                <path fill="#F3F5F9" stroke="#0F1A2E" strokeWidth="1.2" d="M5 3l14 8-6 1.5L10 19z" />
              </svg>
            </div>
          </div>

          <div className="glass float-card metric" aria-hidden="true">
            <small>Seus contatos</small>
            <strong>1 painel</strong>
            <span>todo pedido do site cai organizado num só lugar</span>
          </div>

          <div className="glass float-card badge-delivery" aria-hidden="true">
            <span className="ic">
              <svg viewBox="0 0 24 24">
                <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </span>
            <b>Entrega em até 15 dias da sua landing page personalizada</b>
          </div>

          <div className="glass float-card speed" aria-hidden="true">
            <div className="ring">
              <svg viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="19" fill="none" stroke="rgba(154,168,191,.18)" strokeWidth="3" />
                <circle cx="22" cy="22" r="19" fill="none" stroke="#FF6B3D" strokeWidth="3" strokeLinecap="round" strokeDasharray="119.4" strokeDashoffset="2.4" />
              </svg>
              <b>90+</b>
            </div>
            <span>
              <strong>Meta de performance</strong>Google PageSpeed
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
