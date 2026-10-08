import { SITUACAO_NOME, type Projeto } from "../../shared/projetos";
import { cx } from "../../shared/cx";
import type { Membro } from "../../painel/api/auth";
import { dm, initials } from "../../painel/lib/format";
import { activateOnKey } from "../../painel/lib/keys";
import { membroNome } from "../../painel/lib/equipe";
import { planoCurto } from "../../shared/leads";
import { clienteLinha, prazoInfo, type Progresso } from "../lib/projetos";

export function PrazoChip({ projeto, hoje }: { projeto: Projeto; hoje: string }) {
  const p = prazoInfo(projeto, hoje);
  if (!p) return null;
  if (p.tipo === "atrasado")
    return (
      <span className="chip late" title="Prazo de entrega vencido">
        atrasado · {dm(p.data)}
      </span>
    );
  if (p.tipo === "hoje") return <span className="chip today">entrega hoje</span>;
  return (
    <span className={cx("chip", p.tipo === "semana" && "today")} title="Prazo de entrega">
      prazo {dm(p.data)}
    </span>
  );
}

export function SituacaoChip({ projeto }: { projeto: Projeto }) {
  if (projeto.situacao === "andamento" || projeto.etapa === "concluido") return null;
  return <span className={cx("chip", "sit", `sit-${projeto.situacao}`)}>{SITUACAO_NOME[projeto.situacao].toLowerCase()}</span>;
}

export function Barra({ prog, label }: { prog: Progresso; label?: string }) {
  return (
    <div className="prog" title={`${prog.feitas} de ${prog.total} tarefas`}>
      <div
        className="bar"
        role="progressbar"
        aria-label={label ?? "Progresso das tarefas"}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={prog.pct}
      >
        <i style={{ width: `${prog.pct}%` }} />
      </div>
      <span>{prog.total ? `${prog.feitas}/${prog.total}` : "sem tarefas"}</span>
    </div>
  );
}

interface Props {
  projeto: Projeto;
  prog: Progresso;
  equipe: Membro[];
  isNew: boolean;
  dragging: boolean;
  hoje: string;
  onOpen: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
}

export function ProjetoCard({ projeto: p, prog, equipe, isNew, dragging, hoje, onOpen, onDragStart, onDragEnd }: Props) {
  const resp = membroNome(equipe, p.responsavel);
  return (
    <div
      className={cx("card", "pj", isNew && "is-new", dragging && "dragging", p.situacao !== "andamento" && p.etapa !== "concluido" && "parado")}
      role="button"
      tabIndex={0}
      draggable
      data-id={p.id}
      onClick={() => onOpen(p.id)}
      onKeyDown={(e) => activateOnKey(e, () => onOpen(p.id))}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", p.id);
        onDragStart(p.id);
      }}
      onDragEnd={onDragEnd}
    >
      <div className="r1">
        <strong>{p.nome}</strong>
      </div>
      <div className="emp">{clienteLinha(p)}</div>
      <Barra prog={prog} />
      <div className="r3">
        <span className="chip">{planoCurto(p.plano)}</span>
        <SituacaoChip projeto={p} />
        <PrazoChip projeto={p} hoje={hoje} />
        {p.responsavel && (
          <span className="av" title={resp}>
            {initials(resp)}
          </span>
        )}
      </div>
    </div>
  );
}
