import { useState } from "react";
import type { Lead, LeadStatus } from "../../shared/leads";
import { cx } from "../../shared/cx";
import type { Membro } from "../api/types";
import { brl } from "../lib/format";
import { STATUS } from "../lib/leads";
import { LeadCard } from "./LeadCard";

interface Props {
  leads: Lead[];
  equipe: Membro[];
  fresh: ReadonlySet<string>;
  now: number;
  hoje: string;
  onOpen: (id: string) => void;
  onMove: (id: string, to: LeadStatus) => void;
}

/** Funil em colunas, com arrastar e soltar entre etapas. */
export function Board({ leads, equipe, fresh, now, hoje, onOpen, onMove }: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<LeadStatus | null>(null);

  const endDrag = () => {
    setDragId(null);
    setOver(null);
  };

  return (
    <section className="board" aria-label="Funil de vendas">
      {STATUS.map((s) => {
        const items = leads.filter((l) => l.status === s.id);
        const soma = items.reduce((a, l) => a + (Number(l.valor) || 0), 0);
        return (
          <div
            key={s.id}
            className={cx("col", over === s.id && "over")}
            data-status={s.id}
            onDragOver={(e) => {
              if (!dragId) return;
              e.preventDefault();
              if (over !== s.id) setOver(s.id);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver((o) => (o === s.id ? null : o));
            }}
            onDrop={(e) => {
              e.preventDefault();
              const id = dragId ?? e.dataTransfer.getData("text/plain");
              endDrag();
              if (id) onMove(id, s.id);
            }}
          >
            <div className="col-h">
              <span className="dot" style={{ background: `var(--s-${s.id})` }} />
              <b>{s.nome}</b>
              <span className="n">{items.length}</span>
              {soma ? <span className="sum">{brl(soma)}</span> : null}
            </div>
            {items.length ? (
              items.map((l) => (
                <LeadCard
                  key={l.id}
                  lead={l}
                  equipe={equipe}
                  isNew={fresh.has(l.id)}
                  dragging={dragId === l.id}
                  now={now}
                  hoje={hoje}
                  onOpen={onOpen}
                  onDragStart={setDragId}
                  onDragEnd={endDrag}
                />
              ))
            ) : (
              <div className="empty">{s.vazio}</div>
            )}
          </div>
        );
      })}
    </section>
  );
}
