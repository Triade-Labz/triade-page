import { useId, useState } from "react";
import { cx } from "../../shared/cx";
import { FAQ } from "../content";
import { Reveal } from "./Reveal";

export function Faq() {
  const [open, setOpen] = useState<number | null>(null);
  const uid = useId();

  return (
    <section className="shell void faq curve-b" id="faq" aria-labelledby="faq-title">
      <div className="container">
        <div className="section-head">
          <Reveal as="p" className="label">
            FAQ
          </Reveal>
          <Reveal as="h2" className="h-section" id="faq-title" delay={1}>
            Perguntas <em>frequentes.</em>
          </Reveal>
          <Reveal as="p" className="lead faq-sub" delay={2}>
            Não encontrou sua dúvida? <a href="#contato">Fale com a gente</a>.
          </Reveal>
        </div>
        <div className="faq-list">
          {FAQ.map((item, i) => {
            const isOpen = open === i;
            const q = `${uid}-q${i}`;
            const a = `${uid}-a${i}`;
            return (
              <Reveal className={cx("faq-item", isOpen && "open")} key={item.q}>
                <button className="faq-q" type="button" id={q} aria-expanded={isOpen} aria-controls={a} onClick={() => setOpen(isOpen ? null : i)}>
                  {item.q}
                  <span className="pm" aria-hidden="true" />
                </button>
                <div className="faq-a" id={a} role="region" aria-labelledby={q}>
                  <div>
                    <p>{item.a}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
