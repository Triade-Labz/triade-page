import { cx } from "../../shared/cx";
import type { Metricas } from "../lib/projetos";

function Metric({ k, v, d, alert }: { k: string; v: number; d: string; alert?: boolean }) {
  return (
    <div className={cx("metric", alert && "alert")}>
      <div className="k">{k}</div>
      <div className="v">{v}</div>
      <div className="d">{d}</div>
    </div>
  );
}

export function Metrics({ m }: { m: Metricas }) {
  return (
    <section className="metrics" aria-label="Resumo">
      <Metric k="em andamento" v={m.ativos} d={m.ativos === 1 ? "projeto ativo" : "projetos ativos"} />
      <Metric k="prazo vencido" v={m.atrasados} d={m.atrasados ? "reveja o prazo ou acelere" : "tudo dentro do prazo"} alert={m.atrasados > 0} />
      <Metric k="entregas em 7 dias" v={m.semana} d="prazo nesta semana" alert={m.semana > 0} />
      <Metric k="aguardando cliente" v={m.aguardando} d="material, aprovação ou acesso" />
      <Metric k="concluídos no mês" v={m.concluidosMes} d={m.concluidosMes === 1 ? "projeto entregue" : "projetos entregues"} />
    </section>
  );
}
