import { ETAPA_INFO, SITUACAO_NOME, type Projeto, type Tarefa } from "../../shared/projetos";
import { planoCurto } from "../../shared/leads";
import type { Membro } from "../../painel/api/auth";
import { membroNome } from "../../painel/lib/equipe";
import { activateOnKey } from "../../painel/lib/keys";
import { clienteLinha, dataBr, prazoInfo, progresso } from "../lib/projetos";
import { Barra, PrazoChip } from "./ProjetoCard";

interface Props {
  projetos: Projeto[];
  tarefasPorProjeto: Map<string, Tarefa[]>;
  equipe: Membro[];
  hoje: string;
  onOpen: (id: string) => void;
}

export function ProjetoList({ projetos, tarefasPorProjeto, equipe, hoje, onOpen }: Props) {
  return (
    <section className="table-wrap" aria-label="Lista de projetos">
      {!projetos.length ? (
        <div className="empty empty-list">Nenhum projeto encontrado com esses filtros.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Projeto</th>
              <th>Plano</th>
              <th>Etapa</th>
              <th>Tarefas</th>
              <th>Responsável</th>
              <th>Prazo</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            {projetos.map((p) => (
              <tr key={p.id} data-id={p.id} tabIndex={0} onClick={() => onOpen(p.id)} onKeyDown={(e) => activateOnKey(e, () => onOpen(p.id))}>
                <td>
                  <b>{p.nome}</b>
                  <div className="sub">{clienteLinha(p)}</div>
                </td>
                <td>{planoCurto(p.plano)}</td>
                <td>
                  <span className="st">
                    <i style={{ background: `var(--e-${p.etapa})` }} />
                    {ETAPA_INFO[p.etapa].nome}
                  </span>
                </td>
                <td className="td-prog">
                  <Barra prog={progresso(tarefasPorProjeto.get(p.id) ?? [])} />
                </td>
                <td>{p.responsavel ? membroNome(equipe, p.responsavel) : "–"}</td>
                <td>{prazoInfo(p, hoje) ? <PrazoChip projeto={p} hoje={hoje} /> : <span className="sub">{dataBr(p.prazo) || "–"}</span>}</td>
                <td>{p.etapa === "concluido" ? "Entregue" : SITUACAO_NOME[p.situacao]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
