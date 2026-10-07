import { IconCheck } from "./icons";
import { LeadForm, type PlanPrefill } from "./LeadForm";
import { Reveal } from "./Reveal";

const PERKS = ["Orçamento gratuito e sem compromisso", "Proposta clara em até 24 horas", "Atendimento direto pelo WhatsApp"];

export function Contact({ prefill }: { prefill: PlanPrefill | null }) {
  return (
    <section className="shell void final curve-b" id="contato" aria-labelledby="cta-title">
      <div className="container">
        <Reveal className="cta-block">
          <div className="blob blob-1 cta-blob" aria-hidden="true" />
          <div>
            <p className="label">Vamos conversar</p>
            <h2 id="cta-title">
              Vamos tirar seu site <em>do papel?</em>
            </h2>
            <p className="lead">Conte um pouco sobre sua empresa. Um especialista responde em até 2 horas úteis.</p>
            <ul className="cta-perks">
              {PERKS.map((p) => (
                <li key={p}>
                  <IconCheck />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <LeadForm prefill={prefill} />
        </Reveal>
      </div>
    </section>
  );
}
