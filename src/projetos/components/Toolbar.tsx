import { SITUACOES, SITUACAO_NOME, isSituacao } from "../../shared/projetos";
import type { Membro } from "../../painel/api/auth";
import { IconPlus, IconSearch } from "../../painel/components/icons";
import type { FiltroSituacao, Filtros } from "../lib/projetos";

export type View = "board" | "list";

interface Props {
  filtros: Filtros;
  equipe: Membro[];
  view: View;
  onFiltros: (f: Filtros) => void;
  onView: (v: View) => void;
  onNew: () => void;
}

const toFiltroSituacao = (v: string): FiltroSituacao => (v === "todos" || isSituacao(v) ? v : "ativos");

export function Toolbar({ filtros, equipe, view, onFiltros, onView, onNew }: Props) {
  return (
    <div className="toolbar">
      <label className="search">
        <IconSearch />
        <input
          className="input"
          type="search"
          placeholder="Buscar por projeto, cliente ou empresa"
          aria-label="Buscar projetos"
          value={filtros.q}
          onChange={(e) => onFiltros({ ...filtros, q: e.target.value })}
        />
      </label>
      <select className="input" aria-label="Filtrar por responsável" value={filtros.responsavel} onChange={(e) => onFiltros({ ...filtros, responsavel: e.target.value })}>
        <option value="">Responsável: todos</option>
        <option value="_none">Sem responsável</option>
        {equipe.map((m) => (
          <option key={m.email} value={m.email}>
            {m.nome}
          </option>
        ))}
      </select>
      <select
        className="input"
        aria-label="Filtrar por situação"
        value={filtros.situacao}
        onChange={(e) => onFiltros({ ...filtros, situacao: toFiltroSituacao(e.target.value) })}
      >
        <option value="ativos">Situação: ativos</option>
        {SITUACOES.map((s) => (
          <option key={s} value={s}>
            {SITUACAO_NOME[s]}
          </option>
        ))}
        <option value="todos">Todos, inclusive cancelados</option>
      </select>
      <div className="grow" />
      <div className="seg" role="group" aria-label="Visualização">
        <button type="button" aria-pressed={view === "board"} onClick={() => onView("board")}>
          Quadro
        </button>
        <button type="button" aria-pressed={view === "list"} onClick={() => onView("list")}>
          Lista
        </button>
      </div>
      <button className="btn btn-primary" type="button" onClick={onNew}>
        <IconPlus />
        Novo projeto
      </button>
    </div>
  );
}
