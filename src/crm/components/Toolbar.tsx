import { PLANOS, PLANO_INFO, isPlano } from "../../shared/leads";
import type { Membro } from "../api/types";
import type { Filtros } from "../lib/leads";
import { IconDown, IconPlus, IconSearch } from "./icons";

export type View = "board" | "list";

interface Props {
  filtros: Filtros;
  equipe: Membro[];
  view: View;
  onFiltros: (f: Filtros) => void;
  onView: (v: View) => void;
  onExport: () => void;
  onNew: () => void;
}

export function Toolbar({ filtros, equipe, view, onFiltros, onView, onExport, onNew }: Props) {
  return (
    <div className="toolbar">
      <label className="search">
        <IconSearch />
        <input
          className="input"
          type="search"
          placeholder="Buscar por nome, empresa ou WhatsApp"
          aria-label="Buscar leads"
          value={filtros.q}
          onChange={(e) => onFiltros({ ...filtros, q: e.target.value })}
        />
      </label>
      <select
        className="input"
        aria-label="Filtrar por interesse"
        value={filtros.plano}
        onChange={(e) => onFiltros({ ...filtros, plano: isPlano(e.target.value) ? e.target.value : "" })}
      >
        <option value="">Interesse: todos</option>
        {PLANOS.map((p) => (
          <option key={p} value={p}>
            {PLANO_INFO[p].curto}
          </option>
        ))}
      </select>
      <select className="input" aria-label="Filtrar por responsável" value={filtros.responsavel} onChange={(e) => onFiltros({ ...filtros, responsavel: e.target.value })}>
        <option value="">Responsável: todos</option>
        <option value="_none">Sem responsável</option>
        {equipe.map((m) => (
          <option key={m.email} value={m.email}>
            {m.nome}
          </option>
        ))}
      </select>
      <div className="grow" />
      <div className="seg" role="group" aria-label="Visualização">
        <button type="button" aria-pressed={view === "board"} onClick={() => onView("board")}>
          Funil
        </button>
        <button type="button" aria-pressed={view === "list"} onClick={() => onView("list")}>
          Lista
        </button>
      </div>
      <button className="btn btn-ghost" type="button" onClick={onExport}>
        <IconDown />
        Exportar
      </button>
      <button className="btn btn-primary" type="button" onClick={onNew}>
        <IconPlus />
        Novo lead
      </button>
    </div>
  );
}
