import type { ReactNode } from "react";
import { cx } from "../../shared/cx";
import { brl } from "../lib/format";
import type { Metricas } from "../lib/leads";

function Metric({ k, v, d, alert }: { k: string; v: ReactNode; d: string; alert?: boolean }) {
  return (
    <div className={cx("metric", alert && "alert")}>
      <div className="k">{k}</div>
      <div className="v">{v}</div>
      <div className="d">{d}</div>
    </div>
  );
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

export function Metrics({ m }: { m: Metricas }) {
  return (
    <section className="metrics" aria-label="Resumo">
      <Metric k="aguardando contato" v={m.novos} d={m.novos === 1 ? "lead novo" : "leads novos"} alert={m.novos > 0} />
      <Metric k="em negociação" v={m.negociacao} d={m.negociacaoValor ? `${brl(m.negociacaoValor)} em aberto` : "em contato ou proposta"} />
      <Metric k="fechados no mês" v={m.fechadosMes} d={m.fechadosMesValor ? brl(m.fechadosMesValor) : "sem valor informado"} />
      <Metric
        k="taxa de fechamento"
        v={m.taxa == null ? "–" : `${m.taxa}%`}
        d={`${plural(m.fechados, "fechado", "fechados")} · ${plural(m.perdidos, "perdido", "perdidos")}`}
      />
      <Metric k="follow-ups atrasados" v={m.atrasados} d={m.atrasados ? "reveja a data de contato" : "tudo em dia"} alert={m.atrasados > 0} />
    </section>
  );
}
