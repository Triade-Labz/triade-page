import type { Lead } from "../../shared/leads";
import { cx } from "../../shared/cx";
import type { Membro } from "../api/types";
import { ago, brl, dm, initials } from "../lib/format";
import { activateOnKey } from "../lib/keys";
import { followUp, membroNome, planoCurto } from "../lib/leads";

export function FollowChip({ lead, hoje }: { lead: Lead; hoje: string }) {
  const f = followUp(lead, hoje);
  if (!f) return null;
  if (f.tipo === "atrasado")
    return (
      <span className="chip late" title="Contato atrasado">
        atrasado · {dm(f.data)}
      </span>
    );
  if (f.tipo === "hoje") return <span className="chip today">contatar hoje</span>;
  return <span className="chip">{dm(f.data)}</span>;
}

interface Props {
  lead: Lead;
  equipe: Membro[];
  isNew: boolean;
  dragging: boolean;
  now: number;
  hoje: string;
  onOpen: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
}

export function LeadCard({ lead: l, equipe, isNew, dragging, now, hoje, onOpen, onDragStart, onDragEnd }: Props) {
  const resp = membroNome(equipe, l.responsavel);
  return (
    <div
      className={cx("card", isNew && "is-new", dragging && "dragging")}
      role="button"
      tabIndex={0}
      draggable
      data-id={l.id}
      onClick={() => onOpen(l.id)}
      onKeyDown={(e) => activateOnKey(e, () => onOpen(l.id))}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", l.id);
        onDragStart(l.id);
      }}
      onDragEnd={onDragEnd}
    >
      <div className="r1">
        <strong>{l.nome}</strong>
        <span>{ago(l.created_at, now)}</span>
      </div>
      <div className="emp">{l.empresa}</div>
      <div className="r3">
        <span className="chip">{planoCurto(l.plano)}</span>
        {l.valor ? <span className="chip val">{brl(l.valor)}</span> : null}
        <FollowChip lead={l} hoje={hoje} />
        {l.responsavel && (
          <span className="av" title={resp}>
            {initials(resp)}
          </span>
        )}
      </div>
    </div>
  );
}
