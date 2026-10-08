import { useCallback, useMemo, useState } from "react";
import type { Etapa, Projeto, ProjetoUpdate } from "../../shared/projetos";
import type { Membro } from "../../painel/api/auth";
import { TopBar } from "../../painel/components/TopBar";
import { useToast } from "../../painel/components/toastContext";
import { useNow } from "../../painel/hooks/useNow";
import { errMsg } from "../../painel/lib/errors";
import { ymd } from "../../painel/lib/format";
import type { DemoProjetosApi } from "../api/demoApi";
import type { DadosIniciais, ProjetosApi } from "../api/types";
import { useProjetos } from "../hooks/useProjetos";
import { computeMetricas, filterProjetos, tarefasPorProjeto, type Filtros } from "../lib/projetos";
import { Board } from "./Board";
import { Metrics } from "./Metrics";
import { NovoProjetoDialog } from "./NovoProjetoDialog";
import { ProjetoDrawer } from "./ProjetoDrawer";
import { ProjetoList } from "./ProjetoList";
import { Toolbar, type View } from "./Toolbar";

interface Props {
  api: ProjetosApi;
  me: Membro;
  equipe: Membro[];
  inicial: DadosIniciais;
  onLogout: () => Promise<void>;
  onChangePassword: () => void;
}

/** Link vindo do CRM: ?lead=<id do lead> abre o projeto daquele contrato; ?projeto=<id> abre direto. */
function projetoDaUrl(projetos: Projeto[]): string | null {
  const q = new URLSearchParams(location.search);
  const lead = q.get("lead");
  const id = q.get("projeto");
  return projetos.find((p) => (lead && p.lead_id === lead) || (id && p.id === id))?.id ?? null;
}

const SEM_TAREFAS: never[] = [];

export function Dashboard({ api, me, equipe, inicial, onLogout, onChangePassword }: Props) {
  const toast = useToast();
  const now = useNow();
  const hoje = ymd(new Date(now));
  const { projetos, tarefas, fresh, realtime, markSeen, patchProjeto, moverEtapa, patchTarefa, createProjeto, removeProjeto, addTarefa, removeTarefa, aplicarModelo } =
    useProjetos(api, inicial);

  const [filtros, setFiltros] = useState<Filtros>({ q: "", responsavel: "", situacao: "ativos" });
  const [view, setView] = useState<View>("board");
  const [drawerId, setDrawerId] = useState<string | null>(() => projetoDaUrl(inicial.projetos));
  const [drawerOpen, setDrawerOpen] = useState(() => drawerId !== null);
  const [notesVersion, setNotesVersion] = useState(0);
  const [newOpen, setNewOpen] = useState(false);

  const visiveis = useMemo(() => filterProjetos(projetos, filtros), [projetos, filtros]);
  const metricas = useMemo(() => computeMetricas(visiveis, hoje), [visiveis, hoje]);
  const porProjeto = useMemo(() => tarefasPorProjeto(tarefas), [tarefas]);
  // Mantém o projeto na gaveta durante a animação de fechar; some se for apagado.
  const drawerProjeto = drawerId ? (projetos.find((p) => p.id === drawerId) ?? null) : null;

  const openProjeto = useCallback(
    (id: string) => {
      markSeen(id);
      setDrawerId(id);
      setDrawerOpen(true);
    },
    [markSeen],
  );

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    const id = drawerId;
    if (id) requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-id="${CSS.escape(id)}"]`)?.focus());
  }, [drawerId]);

  const onMove = useCallback(
    (id: string, to: Etapa) => {
      void moverEtapa(id, to).then((ok) => ok && setNotesVersion((n) => n + 1));
    },
    [moverEtapa],
  );

  const onPatch = useCallback(
    (id: string, p: ProjetoUpdate, okMsg: string) => {
      void patchProjeto(id, p, okMsg).then((row) => row && "situacao" in p && setNotesVersion((n) => n + 1));
    },
    [patchProjeto],
  );

  const onToggleTarefa = useCallback(
    (id: string, feita: boolean) => {
      void patchTarefa(id, { feita });
    },
    [patchTarefa],
  );

  const onDelete = useCallback(
    async (id: string) => {
      try {
        await removeProjeto(id);
        setDrawerOpen(false);
        setDrawerId(null);
        toast("Projeto excluído");
      } catch (e) {
        toast(`Não foi possível excluir: ${errMsg(e)}`, "err");
      }
    },
    [removeProjeto, toast],
  );

  return (
    <div id="app">
      <TopBar me={me} realtimeOff={realtime === "off" && !api.demo} onChangePassword={onChangePassword} onLogout={() => void onLogout()} />

      {api.demo && (
        <div className="demo">
          <span>
            <b>Modo demonstração.</b> Os projetos abaixo são exemplos e nada é salvo. No sistema real, cada contrato fechado no CRM vira projeto aqui
            sozinho.
          </span>
          <button className="btn btn-ghost" type="button" onClick={() => (api as DemoProjetosApi).simulate()}>
            Simular contrato fechado no CRM
          </button>
        </div>
      )}

      <main>
        <Metrics m={metricas} />
        <Toolbar filtros={filtros} equipe={equipe} view={view} onFiltros={setFiltros} onView={setView} onNew={() => setNewOpen(true)} />
        {view === "board" ? (
          <Board projetos={visiveis} tarefasPorProjeto={porProjeto} equipe={equipe} fresh={fresh} hoje={hoje} onOpen={openProjeto} onMove={onMove} />
        ) : (
          <ProjetoList projetos={visiveis} tarefasPorProjeto={porProjeto} equipe={equipe} hoje={hoje} onOpen={openProjeto} />
        )}
      </main>

      <ProjetoDrawer
        api={api}
        projeto={drawerProjeto}
        tarefas={drawerProjeto ? (porProjeto.get(drawerProjeto.id) ?? SEM_TAREFAS) : SEM_TAREFAS}
        open={drawerOpen && !!drawerProjeto}
        me={me}
        equipe={equipe}
        hoje={hoje}
        notesVersion={notesVersion}
        onClose={closeDrawer}
        onMove={onMove}
        onPatch={onPatch}
        onToggleTarefa={onToggleTarefa}
        onAddTarefa={addTarefa}
        onRemoveTarefa={removeTarefa}
        onAplicarModelo={aplicarModelo}
        onDelete={onDelete}
      />

      <NovoProjetoDialog
        open={newOpen}
        me={me}
        equipe={equipe}
        onClose={() => setNewOpen(false)}
        onCreate={async (row) => {
          const p = await createProjeto(row);
          toast("Projeto criado com o checklist do plano");
          openProjeto(p.id);
          return p;
        }}
      />
    </div>
  );
}
