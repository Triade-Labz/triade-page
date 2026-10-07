import type { Plano } from "../../shared/leads";
import { cx } from "../../shared/cx";
import { BENEFITS, PLANS, type BenefitIcon } from "../content";
import { IconCheck } from "./icons";
import { Reveal } from "./Reveal";

const DELAYS = [undefined, 1, 2, 3] as const;

function BenefitSvg({ icon }: { icon: BenefitIcon }) {
  switch (icon) {
    case "design":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.9 1.8-1.8 0-1.2-.9-1.6-.9-2.7 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.4 17 3 12 3Z"
          />
          <circle cx="7.5" cy="11" r="1" fill="currentColor" />
          <circle cx="10.5" cy="7.5" r="1" fill="currentColor" />
          <circle cx="15" cy="7.5" r="1" fill="currentColor" />
        </svg>
      );
    case "seo":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="m20 20-3.5-3.5M8 11.5l2 2 3.5-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "responsive":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="4" width="13" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <rect x="15" y="9" width="6" height="11" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M6 18h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "secure":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6z" />
          <path d="m9 12 2 2 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

export function Offer({ onChoosePlan }: { onChoosePlan: (p: Plano) => void }) {
  return (
    <section className="shell offer curve-a" aria-labelledby="beneficios-title">
      <div className="blob blob-3" aria-hidden="true" />
      <div className="blob blob-1" aria-hidden="true" style={{ top: "55%", right: -200 }} />
      <div className="container">
        <div className="section-head">
          <Reveal as="p" className="label">
            Por que a Tríade
          </Reveal>
          <Reveal as="h2" className="h-section" id="beneficios-title" delay={1}>
            Feito sob medida. <em>Pensado para vender.</em>
          </Reveal>
        </div>
        <div className="benefits">
          {BENEFITS.map((b, i) => (
            <Reveal as="article" className="glass benefit" delay={DELAYS[i]} key={b.title}>
              <div className="ic">
                <BenefitSvg icon={b.icon} />
              </div>
              <h3>{b.title}</h3>
              <p>{b.text}</p>
            </Reveal>
          ))}
        </div>

        <svg className="wave-divider" viewBox="0 0 1200 80" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 40 C150 0 300 80 450 40 S750 0 900 40 S1100 70 1200 30" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path d="M0 52 C150 12 300 92 450 52 S750 12 900 52 S1100 82 1200 42" fill="none" stroke="currentColor" strokeWidth="1" opacity=".5" />
        </svg>

        <div id="planos" className="section-head center">
          <Reveal as="p" className="label">
            Planos
          </Reveal>
          <Reveal as="h2" className="h-section" delay={1}>
            Escolha o ponto de <em>partida.</em>
          </Reveal>
          <Reveal as="p" className="lead" delay={2}>
            Três pontos de partida. Cada projeto é orçado sob medida: fale com a gente para consultar disponibilidade.
          </Reveal>
        </div>


        <div className="plans">
          {PLANS.map((p, i) => (
            <Reveal as="article" className={cx("glass plan", p.featured && "featured")} delay={DELAYS[i]} aria-labelledby={`plan-${p.plano}`} key={p.plano}>
              {p.featured && <span className="ribbon">Mais escolhido</span>}
              <span className="tier">{p.tier}</span>
              <h3 id={`plan-${p.plano}`}>{p.title}</h3>
              <p className="desc">{p.desc}</p>
              <div className="price">
                <span className="val" aria-label="Valor sob consulta">—</span>
              </div>
              <p className="price-note">Consultar disponibilidade</p>
              <ul>
                {p.inherits && (
                  <li className="inherit">
                    <IconCheck />
                    {p.inherits}
                  </li>
                )}
                {p.items.map((it) => (
                  <li key={it}>
                    <IconCheck />
                    {it}
                  </li>
                ))}
              </ul>
              <a href="#contato" className={cx("btn btn-block", p.featured ? "btn-primary" : "btn-secondary")} onClick={() => onChoosePlan(p.plano)}>
                {p.cta}
              </a>
            </Reveal>
          ))}
        </div>
        <Reveal as="p" className="plans-foot">
          Precisa de algo diferente? <a href="#contato">Monte um projeto sob medida</a>.
        </Reveal>
      </div>
    </section>
  );
}
