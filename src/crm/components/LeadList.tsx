import type { Lead } from "../../shared/leads";
import type { Membro } from "../api/types";
import { brl } from "../../painel/lib/format";
import { STATUS_NOME, followUp, membroNome, planoCurto } from "../lib/leads";
import { activateOnKey } from "../../painel/lib/keys";
import { FollowChip } from "./LeadCard";

interface Props {
  leads: Lead[];
  equipe: Membro[];
  hoje: string;
  onOpen: (id: string) => void;
}

export function LeadList({ leads, equipe, hoje, onOpen }: Props) {
  return (
    <section className="table-wrap" aria-label="Lista de leads">
      {!leads.length ? (
        <div className="empty empty-list">Nenhum lead encontrado com esses filtros.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Lead</th>
              <th>Interesse</th>
              <th>Etapa</th>
              <th>Responsável</th>
              <th>Valor</th>
              <th>Recebido</th>
              <th>Próximo contato</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id} data-id={l.id} tabIndex={0} onClick={() => onOpen(l.id)} onKeyDown={(e) => activateOnKey(e, () => onOpen(l.id))}>
                <td>
                  <b>{l.nome}</b>
                  <div className="sub">{l.empresa}</div>
                </td>
                <td>{planoCurto(l.plano)}</td>
                <td>
                  <span className="st">
                    <i style={{ background: `var(--s-${l.status})` }} />
                    {STATUS_NOME[l.status]}
                  </span>
                </td>
                <td>{l.responsavel ? membroNome(equipe, l.responsavel) : "–"}</td>
                <td>{l.valor ? brl(l.valor) : "–"}</td>
                <td>
                  <span className="sub">{new Date(l.created_at).toLocaleDateString("pt-BR")}</span>
                </td>
                <td>{followUp(l, hoje) ? <FollowChip lead={l} hoje={hoje} /> : <span className="sub">–</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
