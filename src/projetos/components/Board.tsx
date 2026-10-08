import { useState } from "react";
import { ETAPAS, ETAPA_INFO, type Etapa, type Projeto, type Tarefa } from "../../shared/projetos";
import { cx } from "../../shared/cx";
import type { Membro } from "../../painel/api/auth";
import { progresso } from "../lib/projetos";
import { ProjetoCard } from "./ProjetoCard";

interface Props {
  projetos: Projeto[];
  tarefasPorProjeto: Map<string, Tarefa[]>;
  equipe: Membro[];
  fresh: ReadonlySet<string>;
  hoje: string;
  onOpen: (id: string) => void;
  onMove: (id: string, to: Etapa) => void;
}

const SEM_TAREFAS: Tarefa[] = [];

/** Quadro por etapa, com arrastar e soltar entre colunas. */
export function Board({ projetos, tarefasPorProjeto, equipe, fresh, hoje, onOpen, onMove }: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<Etapa | null>(null);

  const endDrag = () => {
    setDragId(null);
    setOver(null);
  };

  return (
    <section className="board board-pj" aria-label="Projetos por etapa">
      {ETAPAS.map((e) => {
        const items = projetos.filter((p) => p.etapa === e);
        return (
          <div
            key={e}
            className={cx("col", over === e && "over")}
            data-etapa={e}
            onDragOver={(ev) => {
              if (!dragId) return;
              ev.preventDefault();
              if (over !== e) setOver(e);
            }}
            onDragLeave={(ev) => {
              if (!ev.currentTarget.contains(ev.relatedTarget as Node | null)) setOver((o) => (o === e ? null : o));
            }}
            onDrop={(ev) => {
              ev.preventDefault();
              const id = dragId ?? ev.dataTransfer.getData("text/plain");
              endDrag();
              if (id) onMove(id, e);
            }}
          >
            <div className="col-h">
              <span className="dot" style={{ background: `var(--e-${e})` }} />
              <b>{ETAPA_INFO[e].nome}</b>
              <span className="n">{items.length}</span>
            </div>
            {items.length ? (
              items.map((p) => (
                <ProjetoCard
                  key={p.id}
                  projeto={p}
                  prog={progresso(tarefasPorProjeto.get(p.id) ?? SEM_TAREFAS)}
                  equipe={equipe}
                  isNew={fresh.has(p.id)}
                  dragging={dragId === p.id}
                  hoje={hoje}
                  onOpen={onOpen}
                  onDragStart={setDragId}
                  onDragEnd={endDrag}
                />
              ))
            ) : (
              <div className="empty">{ETAPA_INFO[e].vazio}</div>
            )}
          </div>
        );
      })}
    </section>
  );
}
