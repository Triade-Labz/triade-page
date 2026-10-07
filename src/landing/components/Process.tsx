import { STEPS } from "../content";
import { Reveal } from "./Reveal";

const DELAYS = [undefined, 1, 2, 3] as const;

export function Process() {
  const total = String(STEPS.length).padStart(2, "0");
  return (
    <section className="shell void process curve-b" id="processo" aria-labelledby="processo-title">
      <div className="container">
        <div className="section-head">
          <Reveal as="p" className="label">
            Processo
          </Reveal>
          <Reveal as="h2" className="h-section" id="processo-title" delay={1}>
            Do briefing ao ar, <em>sem atrito.</em>
          </Reveal>
          <Reveal as="p" className="lead" delay={2}>
            Quatro etapas claras, com você aprovando cada passo.
          </Reveal>
        </div>
        <div className="timeline-wrap">
          <svg className="timeline-curve" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
            <path
              d="M40 100 C180 100 200 30 330 30 S480 100 630 100 S780 30 930 30 S1100 90 1180 90"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeDasharray="4 8"
              strokeLinecap="round"
            />
          </svg>
          <ol className="timeline">
            {STEPS.map((s, i) => (
              <Reveal as="li" className="step" delay={DELAYS[i]} key={s.title}>
                <span className="num">
                  {String(i + 1).padStart(2, "0")}
                  <sup>/{total}</sup>
                </span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                <span className="dur">{s.dur}</span>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
