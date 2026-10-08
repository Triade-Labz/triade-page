import { useCallback, useMemo, useState } from "react";
import type { Lead, LeadStatus, LeadUpdate } from "../../shared/leads";
import type { DemoApi } from "../api/demoApi";
import type { CrmApi, Membro } from "../api/types";
import { errMsg } from "../../painel/lib/errors";
import { ymd } from "../../painel/lib/format";
import { buildCsv, computeMetrics, filterLeads, type Filtros } from "../lib/leads";
import { useLeads } from "../hooks/useLeads";
import { useNow } from "../../painel/hooks/useNow";
import { Board } from "./Board";
import { IconBell } from "../../painel/components/icons";
import { TopBar } from "../../painel/components/TopBar";
import { LeadDrawer } from "./LeadDrawer";
import { LeadList } from "./LeadList";
import { Metrics } from "./Metrics";
import { NewLeadDialog } from "./NewLeadDialog";
import { useToast } from "../../painel/components/toastContext";
import { Toolbar, type View } from "./Toolbar";

interface Props {
  api: CrmApi;
  me: Membro;
  equipe: Membro[];
  initialLeads: Lead[];
  onLogout: () => Promise<void>;
  onChangePassword: () => void;
}

function leadDaUrl(leads: Lead[]): string | null {
  const id = new URLSearchParams(location.search).get("lead");
  return id && leads.some((l) => l.id === id) ? id : null;
}

function download(name: string, content: string, type: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function Dashboard({ api, me, equipe, initialLeads, onLogout, onChangePassword }: Props) {
  const toast = useToast();
  const now = useNow();
  const hoje = ymd(new Date(now));
  const { leads, fresh, realtime, markSeen, patch, changeStatus, create, remove } = useLeads(api, initialLeads, me);

  const [filtros, setFiltros] = useState<Filtros>({ q: "", plano: "", responsavel: "" });
  const [view, setView] = useState<View>("board");
  // Link vindo do controle de projetos: crm.html?lead=<id> já abre o lead.
  const [drawerId, setDrawerId] = useState<string | null>(() => leadDaUrl(initialLeads));
  const [drawerOpen, setDrawerOpen] = useState(() => drawerId !== null);
  const [notesVersion, setNotesVersion] = useState(0);
  const [newOpen, setNewOpen] = useState(false);
  const [notifPerm, setNotifPerm] = useState(() => ("Notification" in window ? Notification.permission : "denied"));

  const visiveis = useMemo(() => filterLeads(leads, filtros), [leads, filtros]);
  const metricas = useMemo(() => computeMetrics(visiveis, hoje), [visiveis, hoje]);
  // Mantém o lead na gaveta durante a animação de fechar; some se for apagado.
  const drawerLead = drawerId ? (leads.find((l) => l.id === drawerId) ?? null) : null;

  const openLead = useCallback(
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

  const onStatus = useCallback(
    (id: string, to: LeadStatus) => {
      void changeStatus(id, to).then((ok) => ok && setNotesVersion((n) => n + 1));
    },
    [changeStatus],
  );

  const onPatch = useCallback(
    (id: string, p: LeadUpdate, okMsg: string) => {
      void patch(id, p, okMsg);
    },
    [patch],
  );

  const onDelete = useCallback(
    async (id: string) => {
      try {
        await remove(id);
        setDrawerOpen(false);
        setDrawerId(null);
        toast("Lead excluído");
      } catch (e) {
        toast(`Não foi possível excluir: ${errMsg(e)}`, "err");
      }
    },
    [remove, toast],
  );

  async function askNotifications() {
    const p = await Notification.requestPermission();
    setNotifPerm(p);
    if (p === "granted") toast("Pronto: você será avisado quando chegar lead novo.");
  }

  return (
    <div id="app">
      <TopBar me={me} realtimeOff={realtime === "off" && !api.demo} onChangePassword={onChangePassword} onLogout={() => void onLogout()}>
        {!api.demo && notifPerm === "default" && (
          <button className="icon-btn" type="button" title="Avisar quando chegar lead novo" aria-label="Ativar avisos de lead novo" onClick={askNotifications}>
            <IconBell />
          </button>
        )}
      </TopBar>

      {api.demo && (
        <div className="demo">
          <span>
            <b>Modo demonstração.</b> Os leads abaixo são exemplos e nada é salvo. Para usar de verdade, configure VITE_SUPABASE_URL e
            VITE_SUPABASE_PUBLISHABLE_KEY (veja .env.example).
          </span>
          <button className="btn btn-ghost" type="button" onClick={() => (api as DemoApi).simulate()}>
            Simular lead chegando do site
          </button>
        </div>
      )}

      <main>
        <Metrics m={metricas} />
        <Toolbar
          filtros={filtros}
          equipe={equipe}
          view={view}
          onFiltros={setFiltros}
          onView={setView}
          onExport={() => download(`leads-triade-${hoje}.csv`, buildCsv(visiveis, equipe), "text/csv;charset=utf-8")}
          onNew={() => setNewOpen(true)}
        />
        {view === "board" ? (
          <Board leads={visiveis} equipe={equipe} fresh={fresh} now={now} hoje={hoje} onOpen={openLead} onMove={onStatus} />
        ) : (
          <LeadList leads={visiveis} equipe={equipe} hoje={hoje} onOpen={openLead} />
        )}
      </main>

      <LeadDrawer
        api={api}
        lead={drawerLead}
        open={drawerOpen && !!drawerLead}
        me={me}
        equipe={equipe}
        now={now}
        notesVersion={notesVersion}
        onClose={closeDrawer}
        onStatus={onStatus}
        onPatch={onPatch}
        onDelete={onDelete}
      />

      <NewLeadDialog
        open={newOpen}
        me={me}
        onClose={() => setNewOpen(false)}
        onCreate={async (row) => {
          const l = await create(row);
          toast("Lead cadastrado");
          return l;
        }}
      />
    </div>
  );
}
