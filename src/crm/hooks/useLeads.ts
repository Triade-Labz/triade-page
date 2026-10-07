import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Lead, LeadInsertEquipe, LeadStatus, LeadUpdate } from "../../shared/leads";
import type { CrmApi, LeadChange, Membro, RealtimeState } from "../api/types";
import { errMsg } from "../lib/errors";
import { STATUS_NOME, planoCurto } from "../lib/leads";
import { useToast } from "../components/toastContext";

const POLL_MS = 30_000;

function notifyBrowser(l: Lead) {
  if (!("Notification" in window) || Notification.permission !== "granted" || !document.hidden) return;
  try {
    new Notification("Lead novo na Tríade Labs", { body: `${l.nome} · ${l.empresa} (${planoCurto(l.plano)})` });
  } catch {
    /* alguns navegadores móveis não permitem Notification fora de service worker */
  }
}

/**
 * Lista de leads do painel: carrega, mantém em tempo real e salva alterações.
 * Se o tempo real cair (ou não estiver habilitado no Supabase), passa a
 * consultar o banco a cada 30 s, para nenhum lead do site ficar de fora.
 */
export function useLeads(api: CrmApi, initial: Lead[], me: Membro) {
  const toast = useToast();
  const [leads, setLeads] = useState<Lead[]>(initial);
  const [fresh, setFresh] = useState<ReadonlySet<string>>(new Set());
  const [unseen, setUnseen] = useState(0);
  const [realtime, setRealtime] = useState<RealtimeState>("connecting");
  const leadsRef = useRef(leads);
  useLayoutEffect(() => {
    leadsRef.current = leads;
  }, [leads]);

  const announce = useCallback(
    (novos: Lead[]) => {
      if (!novos.length) return;
      setFresh((s) => new Set([...s, ...novos.map((l) => l.id)]));
      if (document.hidden) setUnseen((n) => n + novos.length);
      for (const l of novos) {
        toast(`Lead novo: ${l.nome} · ${l.empresa}`, "new");
        notifyBrowser(l);
      }
    },
    [toast],
  );

  const applyChange = useCallback(
    (c: LeadChange) => {
      if (c.type === "INSERT") {
        if (leadsRef.current.some((l) => l.id === c.lead.id)) return;
        setLeads((xs) => [c.lead, ...xs.filter((l) => l.id !== c.lead.id)]);
        // Cadastro manual feito pela equipe não é "lead novo do site".
        if (!c.lead.origem?.manual) announce([c.lead]);
      } else if (c.type === "UPDATE") {
        setLeads((xs) => (xs.some((l) => l.id === c.lead.id) ? xs.map((l) => (l.id === c.lead.id ? c.lead : l)) : [c.lead, ...xs]));
      } else {
        setLeads((xs) => xs.filter((l) => l.id !== c.id));
      }
    },
    [announce],
  );

  /** Recarrega tudo do banco e avisa sobre leads que chegaram nesse meio-tempo. */
  const refresh = useCallback(async () => {
    try {
      const server = await api.leads();
      const known = new Set(leadsRef.current.map((l) => l.id));
      const newest = leadsRef.current.reduce((m, l) => (l.created_at > m ? l.created_at : m), "");
      announce(server.filter((l) => !known.has(l.id) && l.created_at >= newest));
      setLeads(server);
    } catch (e) {
      console.warn("[CRM] falha ao atualizar leads:", e);
    }
  }, [api, announce]);

  useEffect(() => api.subscribe(applyChange, setRealtime), [api, applyChange]);

  // Plano B do tempo real: consulta periódica + atualização ao voltar para a aba.
  useEffect(() => {
    let last = Date.now();
    const tick = () => {
      last = Date.now();
      void refresh();
    };
    const timer = realtime === "off" ? setInterval(tick, POLL_MS) : undefined;
    const onVisible = () => {
      if (document.hidden) return;
      setUnseen(0);
      if (realtime !== "on" || Date.now() - last > 5 * 60_000) tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [realtime, refresh]);

  useEffect(() => {
    document.title = `${unseen ? `(${unseen}) ` : ""}CRM · Tríade Labs`;
  }, [unseen]);

  const markSeen = useCallback((id: string) => {
    setFresh((s) => {
      if (!s.has(id)) return s;
      const n = new Set(s);
      n.delete(id);
      return n;
    });
  }, []);

  /** Atualização otimista: a tela muda na hora e volta atrás se o banco recusar. */
  const patch = useCallback(
    async (id: string, changes: LeadUpdate, okMsg?: string): Promise<Lead | null> => {
      const prev = leadsRef.current.find((l) => l.id === id);
      if (!prev) return null;
      setLeads((xs) => xs.map((l) => (l.id === id ? { ...l, ...changes } : l)));
      try {
        const row = await api.update(id, changes);
        setLeads((xs) => xs.map((l) => (l.id === id ? row : l)));
        if (okMsg) toast(okMsg);
        return row;
      } catch (e) {
        setLeads((xs) => xs.map((l) => (l.id === id ? prev : l)));
        toast(`Não foi possível salvar: ${errMsg(e)}`, "err");
        return null;
      }
    },
    [api, toast],
  );

  const changeStatus = useCallback(
    async (id: string, to: LeadStatus): Promise<boolean> => {
      const l = leadsRef.current.find((x) => x.id === id);
      if (!l || l.status === to) return false;
      const from = l.status;
      markSeen(id);
      const row = await patch(id, { status: to });
      if (!row) return false;
      try {
        await api.addNota(id, `${STATUS_NOME[from]} → ${STATUS_NOME[to]}`, "status");
      } catch (e) {
        console.warn("[CRM] histórico de etapa não registrado:", e);
      }
      if (to === "fechado" && !row.valor) toast("Fechado! Informe o valor do contrato para acompanhar o faturamento.");
      return true;
    },
    [api, patch, markSeen, toast],
  );

  const create = useCallback(
    async (row: LeadInsertEquipe) => {
      const created = await api.create({ ...row, responsavel: row.responsavel ?? me.email });
      setLeads((xs) => (xs.some((l) => l.id === created.id) ? xs : [created, ...xs]));
      return created;
    },
    [api, me.email],
  );

  const remove = useCallback(
    async (id: string) => {
      await api.remove(id);
      setLeads((xs) => xs.filter((l) => l.id !== id));
    },
    [api],
  );

  return { leads, fresh, unseen, realtime, markSeen, patch, changeStatus, create, remove, refresh };
}
