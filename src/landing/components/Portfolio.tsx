import type { ReactNode } from "react";
import { CASES, TESTIMONIALS, WIP, type Case } from "../content";
import { IconStar } from "./icons";
import { Reveal } from "./Reveal";

const DELAYS = [undefined, 1, 2] as const;

function CaseCard({ c, delay }: { c: Case; delay: 1 | 2 | undefined }) {
  const body: ReactNode = (
    <>
      <div className="browser">
        <div className="bar" aria-hidden="true">
          <i />
          <i />
          <i />
          <span>{c.bar}</span>
        </div>
        <img src={c.img.src} width={c.img.width} height={c.img.height} loading="lazy" decoding="async" alt={c.img.alt} />
      </div>
      <div className="case-body">
        <small>{c.kicker}</small>
        <h3>{c.title}</h3>
        <p>{c.text}</p>
        <ul className="case-tags">
          {c.tags.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
    </>
  );
  // Projeto já publicado vira link; os demais são só vitrine.
  return c.url ? (
    <Reveal as="a" className="project case" delay={delay} href={c.url} target="_blank" rel="noopener">
      {body}
    </Reveal>
  ) : (
    <Reveal as="article" className="project case" delay={delay}>
      {body}
    </Reveal>
  );
}

export function Portfolio() {
  return (
    <section className="shell navy work curve-a" id="portfolio" aria-labelledby="portfolio-title">
      <div className="blob blob-2" aria-hidden="true" style={{ left: "auto", right: -180, top: "10%" }} />
      <div className="container">
        <div className="section-head">
          <Reveal as="p" className="label">
            Portfólio
          </Reveal>
          <Reveal as="h2" className="h-section" id="portfolio-title" delay={1}>
            Projetos que <em>falam por si.</em>
          </Reveal>
          <Reveal as="p" className="lead" delay={2}>
            Projetos reais, feitos do zero e com banco de dados completo por trás.
          </Reveal>
        </div>

        <div className="portfolio real">
          {CASES.map((c, i) => (
            <CaseCard c={c} delay={DELAYS[i % 3]} key={c.title} />
          ))}
        </div>

        <Reveal className="wip">
          <p className="wip-title">Em desenvolvimento agora</p>
          <ul>
            {WIP.map((w) => (
              <li key={w.title}>
                <b>{w.title}</b>
                <span>{w.text}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        {TESTIMONIALS.length > 0 && (
          <>
            <div className="section-head testimonials-head">
              <Reveal as="p" className="label">
                Depoimentos
              </Reveal>
              <Reveal as="h2" className="h-section" delay={1}>
                Quem já está no ar <em>recomenda.</em>
              </Reveal>
            </div>
            <div className="testimonials">
              {TESTIMONIALS.map((t, i) => (
                <Reveal as="figure" className="glass quote" delay={DELAYS[i % 3]} key={t.name}>
                  <div className="stars" role="img" aria-label="Avaliação: 5 de 5 estrelas">
                    {[0, 1, 2, 3, 4].map((n) => (
                      <IconStar key={n} />
                    ))}
                  </div>
                  <blockquote>“{t.quote}”</blockquote>
                  <figcaption className="who">
                    <span className="av" aria-hidden="true">
                      {t.initials}
                    </span>
                    <div>
                      <b>{t.name}</b>
                      <span>{t.role}</span>
                    </div>
                  </figcaption>
                </Reveal>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
