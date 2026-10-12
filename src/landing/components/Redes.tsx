import { SITE } from "../../shared/siteConfig";
import { SOCIALS } from "./Footer";
import { IconArrow } from "./icons";
import { Reveal } from "./Reveal";

/** "https://www.instagram.com/triade_labs/" → "@triade_labs" */
const handle = (url: string) => `@${url.replace(/\/+$/, "").split("/").pop()}`;

export function Redes() {
  const redes = SOCIALS.filter((s) => SITE[s.key]);
  if (!redes.length) return null;

  return (
    <section className="shell navy redes curve-a" id="redes" aria-labelledby="redes-title">
      <div className="container">
        <div className="section-head">
          <Reveal as="p" className="label">
            Nossas redes
          </Reveal>
          <Reveal as="h2" className="h-section" id="redes-title" delay={1}>
            Acompanhe a <em>Tríade.</em>
          </Reveal>
          <Reveal as="p" className="lead" delay={2}>
            Bastidores, projetos e dicas de tecnologia para a sua empresa.
          </Reveal>
        </div>
        <ul className="redes-list">
          {redes.map(({ key, label, Icon }) => (
            <Reveal as="li" key={key}>
              <a className="glass rede" href={SITE[key]} target="_blank" rel="noopener">
                <span className="rede-icon">
                  <Icon />
                </span>
                <span className="rede-text">
                  <strong>{label}</strong>
                  <small>{handle(SITE[key])}</small>
                </span>
                <IconArrow className="rede-arrow" />
              </a>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
