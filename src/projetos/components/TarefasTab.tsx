import { useState, type FormEvent } from "react";
import { ETAPAS_TRABALHO, ETAPA_INFO, LIMITES_PROJETO, isEtapaTrabalho, type EtapaTrabalho, type Projeto, type Tarefa, type TarefaInsert } from "../../shared/projetos";
import { cx } from "../../shared/cx";
import type { Membro } from "../../painel/api/auth";
import { IconX } from "../../painel/components/icons";
import { useToast } from "../../painel/components/toastContext";
import { membroNome } from "../../painel/lib/equipe";
import { dm, ymd } from "../../painel/lib/format";
import { errMsg } from "../../painel/lib/errors";
import { cleanText } from "../../shared/validation";
import { ordenarTarefas, progresso } from "../lib/projetos";

interface Props {
  projeto: Projeto;
  tarefas: Tarefa[];
  equipe: Membro[];
  onToggle: (id: string, feita: boolean) => void;
  onAdd: (row: TarefaInsert) => Promise<Tarefa>;
  onRemove: (id: string) => Promise<void>;
  onAplicarModelo: () => Promise<number>;
}

/** O que a equipe vai seguir: checklist por etapa, com quem fez cada item. */
export function TarefasTab({ projeto: p, tarefas, equipe, onToggle, onAdd, onRemove, onAplicarModelo }: Props) {
  const toast = useToast();
  const etapaPadrao: EtapaTrabalho = isEtapaTrabalho(p.etapa) ? p.etapa : "entrega";
  const [titulo, setTitulo] = useState("");
  const [etapa, setEtapa] = useState<EtapaTrabalho>(etapaPadrao);
  const [busy, setBusy] = useState(false);
  const ordenadas = ordenarTarefas(tarefas);
  // A etapa atual aparece mesmo sem tarefas, para dar onde acrescentar.
  const grupos = ETAPAS_TRABALHO.map((e) => [e, ordenadas.filter((t) => t.etapa === e)] as const).filter(([e, ts]) => ts.length || e === p.etapa);

  async function add(e: FormEvent) {
    e.preventDefault();
    const t = cleanText(titulo).slice(0, LIMITES_PROJETO.tarefa.max);
    if (!t) return;
    setBusy(true);
    try {
      await onAdd({ projeto_id: p.id, etapa, titulo: t });
      setTitulo("");
    } catch (er) {
      toast(`Não foi possível adicionar: ${errMsg(er)}`, "err");
    } finally {
      setBusy(false);
    }
  }

  async function remove(t: Tarefa) {
    try {
      await onRemove(t.id);
    } catch (er) {
      toast(`Não foi possível apagar: ${errMsg(er)}`, "err");
    }
  }

  async function aplicar() {
    try {
      const n = await onAplicarModelo();
      toast(n ? `${n} ${n === 1 ? "tarefa adicionada" : "tarefas adicionadas"} do checklist do plano` : "O checklist do plano já está completo neste projeto.");
    } catch (er) {
      toast(`Não foi possível aplicar o checklist: ${errMsg(er)}`, "err");
    }
  }

  return (
    <div className="tarefas">
      {grupos.map(([e, ts]) => {
        const pr = progresso(ts);
        return (
          <section key={e} className={cx("grupo", e === p.etapa && "atual")} aria-label={ETAPA_INFO[e].nome}>
            <div className="grupo-h">
              <span className="dot" style={{ background: `var(--e-${e})` }} />
              <b>{ETAPA_INFO[e].nome}</b>
              {e === p.etapa && <span className="chip today">etapa atual</span>}
              <span className="n">{ts.length ? `${pr.feitas}/${pr.total}` : "sem tarefas"}</span>
            </div>
            <ul>
              {ts.map((t) => (
                <li key={t.id} className={cx(t.feita && "feita")}>
                  <label>
                    <input type="checkbox" checked={t.feita} onChange={(ev) => onToggle(t.id, ev.target.checked)} />
                    <span className="t">{t.titulo}</span>
                  </label>
                  {t.feita && t.feita_em && (
                    <span className="by">
                      {membroNome(equipe, t.feita_por).split(/\s+/)[0]} · {dm(ymd(new Date(t.feita_em)))}
                    </span>
                  )}
                  <button className="del" type="button" aria-label={`Apagar tarefa: ${t.titulo}`} title="Apagar tarefa" onClick={() => remove(t)}>
                    <IconX />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <form className="add-task" onSubmit={add}>
        <label className="lbl sr-only" htmlFor="t-etapa">
          Etapa da nova tarefa
        </label>
        <select className="input" id="t-etapa" value={etapa} onChange={(e) => isEtapaTrabalho(e.target.value) && setEtapa(e.target.value)}>
          {ETAPAS_TRABALHO.map((e) => (
            <option key={e} value={e}>
              {ETAPA_INFO[e].nome}
            </option>
          ))}
        </select>
        <label className="lbl sr-only" htmlFor="t-titulo">
          Nova tarefa
        </label>
        <input
          className="input"
          id="t-titulo"
          placeholder="Nova tarefa. Ex.: Página de serviços"
          maxLength={LIMITES_PROJETO.tarefa.max}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
        <button className="btn btn-primary" type="submit" disabled={busy || !titulo.trim()}>
          Adicionar
        </button>
      </form>
      <button className="linkbtn" type="button" onClick={aplicar}>
        Acrescentar as tarefas padrão do plano que estiverem faltando
      </button>
    </div>
  );
}
