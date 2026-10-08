import { useEffect, useState, type FormEvent } from "react";
import { LIMITES_PROJETO, type ProjetoNota } from "../../shared/projetos";
import type { Membro } from "../../painel/api/auth";
import { useToast } from "../../painel/components/toastContext";
import { membroNome } from "../../painel/lib/equipe";
import { errMsg } from "../../painel/lib/errors";
import { dataHora } from "../../painel/lib/format";
import type { ProjetosApi } from "../api/types";

interface Props {
  api: ProjetosApi;
  projetoId: string;
  me: Membro;
  equipe: Membro[];
  /** Muda quando o histórico precisa ser recarregado (ex.: mudança de etapa). */
  version: number;
}

export function HistoricoTab({ api, projetoId, me, equipe, version }: Props) {
  const toast = useToast();
  // Guardadas com o id do projeto, para nunca mostrar o histórico do projeto anterior.
  const [state, setState] = useState<{ id: string; list: ProjetoNota[] } | { id: string; erro: string } | null>(null);
  const [texto, setTexto] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let alive = true;
    api
      .notas(projetoId)
      .then((list) => alive && setState({ id: projetoId, list }))
      .catch((e: unknown) => alive && setState({ id: projetoId, erro: errMsg(e) }));
    return () => {
      alive = false;
    };
  }, [api, projetoId, version, reload]);

  async function add(e: FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t) return;
    setSalvando(true);
    try {
      await api.addNota(projetoId, t.slice(0, LIMITES_PROJETO.nota.max));
      setTexto("");
      setReload((n) => n + 1);
    } catch (er) {
      toast(`Não foi possível salvar a anotação: ${errMsg(er)}`, "err");
    } finally {
      setSalvando(false);
    }
  }

  async function del(id: string) {
    try {
      await api.delNota(id);
      setReload((n) => n + 1);
    } catch (er) {
      toast(`Não foi possível apagar: ${errMsg(er)}`, "err");
    }
  }

  const atual = state && state.id === projetoId ? state : null;
  const notas = atual && "list" in atual ? atual.list : null;
  const erro = atual && "erro" in atual ? atual.erro : "";

  return (
    <div>
      <form className="note-form" onSubmit={add}>
        <label className="lbl sr-only" htmlFor="pj-note">
          Nova anotação
        </label>
        <textarea
          className="input"
          id="pj-note"
          maxLength={LIMITES_PROJETO.nota.max}
          placeholder="Ex.: Cliente aprovou o protótipo na call de hoje. Pediu trocar a foto do topo."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <button className="btn btn-primary" type="submit" disabled={salvando || !texto.trim()}>
          Adicionar anotação
        </button>
      </form>
      <ul className="timeline">
        {erro ? (
          <li className="status">Não foi possível carregar: {erro}</li>
        ) : notas === null ? (
          <li className="status">carregando…</li>
        ) : notas.length === 0 ? (
          <li className="status">Nenhuma anotação ainda. Registre aqui reuniões, aprovações e pedidos do cliente.</li>
        ) : (
          notas.map((n) => (
            <li key={n.id} className={n.tipo === "nota" ? undefined : "status"}>
              <div className="meta">
                <span>{n.autor === "sistema" ? "automático" : membroNome(equipe, n.autor)}</span>
                <span>{dataHora(n.created_at)}</span>
                {n.autor === me.email && n.tipo === "nota" && (
                  <button type="button" onClick={() => del(n.id)}>
                    apagar
                  </button>
                )}
              </div>
              {n.tipo === "etapa" && !n.texto.startsWith("Situação:") ? `Etapa: ${n.texto}` : n.texto}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
