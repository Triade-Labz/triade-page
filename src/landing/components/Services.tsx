import type { Plano } from "../../shared/leads";
import { CLIENTS, PILLARS, STATS } from "../content";
import { CountUp } from "./CountUp";
import { IconArrow, IconCheck } from "./icons";
import { Reveal } from "./Reveal";

const DELAYS = [undefined, 1, 2, 3] as const;

export function Services({ onChoosePlan }: { onChoosePlan: (p: Plano) => void }) {
  const stats = STATS.filter((s) => s.value);

  return (
    <section className="shell void trust curve-b" id="servicos" aria-labelledby="servicos-title">
      <div className="container">
        <div className="section-head">
          <Reveal as="p" className="label">
            O que fazemos
          </Reveal>
          <Reveal as="h2" className="h-section" id="servicos-title" delay={1}>
            Construir. Sustentar. <em>Proteger.</em>
          </Reveal>
          <Reveal as="p" className="lead" delay={2}>
            Três frentes, um só time. Do site novo ao suporte do dia a dia e à segurança dos seus sistemas.
          </Reveal>
        </div>

        <div className="pillars">
          {PILLARS.map((p, i) => (
            <Reveal as="article" className="pillar" delay={DELAYS[i]} key={p.tag}>
              <p className="tag">{p.tag}</p>
              <h3>{p.title}</h3>
              <p>{p.text}</p>
              <ul>
                {p.items.map((it) => (
                  <li key={it}>
                    <IconCheck />
                    {it}
                  </li>
                ))}
              </ul>
              <a
                href={p.cta.href}
                className="more"
                onClick={() => {
                  if (p.cta.plano) onChoosePlan(p.cta.plano);
                }}
              >
                {p.cta.label} <IconArrow />
              </a>
            </Reveal>
          ))}
        </div>

        {stats.length > 0 && (
          <div className="stats">
            {stats.map((s, i) => (
              <Reveal className="stat" delay={DELAYS[i]} key={s.label}>
                <strong>
                  <CountUp value={s.value ?? 0} decimals={s.decimals} />
                  {s.suffix}
                </strong>
                <span>{s.label}</span>
              </Reveal>
            ))}
          </div>
        )}

        {CLIENTS.length > 0 && (
          <Reveal className="marquee" aria-label="Empresas que confiam na Tríade Labs">
            <p className="marquee-title">Empresas que já estão no ar com a gente</p>
            <div className="marquee-track">
              {/* A lista aparece duas vezes para o loop da animação não ter emenda. */}
              {[...CLIENTS, ...CLIENTS].map((c, i) => (
                <span className="client" key={`${c}-${i}`} aria-hidden={i >= CLIENTS.length || undefined}>
                  {c}
                </span>
              ))}
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
