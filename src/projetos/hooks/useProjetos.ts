import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Etapa, Projeto, ProjetoInsert, ProjetoUpdate, Tarefa, TarefaInsert, TarefaUpdate } from "../../shared/projetos";
import type { RealtimeState } from "../../painel/api/auth";
import { useToast } from "../../painel/components/toastContext";
import { errMsg } from "../../painel/lib/errors";
import type { DadosIniciais, ProjetosApi, ProjetosChange } from "../api/types";
import { etapaNome } from "../lib/projetos";

const POLL_MS = 30_000;

const upsert = <T extends { id: string }>(xs: T[], row: T, noInicio = false): T[] =>
  xs.some((x) => x.id === row.id) ? xs.map((x) => (x.id === row.id ? row : x)) : noInicio ? [row, ...xs] : [...xs, row];

/**
 * Projetos e tarefas do painel: carrega, mantém em tempo real e salva alterações.
 * Contrato fechado no CRM chega sozinho (o banco cria o projeto). Se o tempo real
 * cair, passa a consultar o banco a cada 30 s.
 */
export function useProjetos(api: ProjetosApi, inicial: DadosIniciais) {
  const toast = useToast();
  const [projetos, setProjetos] = useState<Projeto[]>(inicial.projetos);
  const [tarefas, setTarefas] = useState<Tarefa[]>(inicial.tarefas);
  const [fresh, setFresh] = useState<ReadonlySet<string>>(new Set());
  const [unseen, setUnseen] = useState(0);
  const [realtime, setRealtime] = useState<RealtimeState>("connecting");
  const projetosRef = useRef(projetos);
  const tarefasRef = useRef(tarefas);
  useLayoutEffect(() => {
    projetosRef.current = projetos;
    tarefasRef.current = tarefas;
  }, [projetos, tarefas]);

  /** Projeto que chegou do CRM (contrato fechado) enquanto o painel estava aberto. */
  const announce = useCallback(
    (novos: Projeto[]) => {
      if (!novos.length) return;
      setFresh((s) => new Set([...s, ...novos.map((p) => p.id)]));
      if (document.hidden) setUnseen((n) => n + novos.length);
      for (const p of novos) toast(`Contrato fechado no CRM: ${p.cliente}${p.empresa ? ` · ${p.empresa}` : ""}`, "new");
    },
    [toast],
  );

  const applyChange = useCallback(
    (c: ProjetosChange) => {
      if (c.tabela === "projetos") {
        if (c.type === "DELETE") {
          setProjetos((xs) => xs.filter((p) => p.id !== c.id));
          setTarefas((xs) => xs.filter((t) => t.projeto_id !== c.id));
          return;
        }
        const novo = c.type === "INSERT" && !projetosRef.current.some((p) => p.id === c.row.id);
        setProjetos((xs) => upsert(xs, c.row, true));
        // Criado à mão aqui pela equipe não é novidade; vindo do CRM, é.
        if (novo && c.row.lead_id) announce([c.row]);
      } else if (c.type === "DELETE") {
        setTarefas((xs) => xs.filter((t) => t.id !== c.id));
      } else {
        setTarefas((xs) => upsert(xs, c.row));
      }
    },
    [announce],
  );

  /** Recarrega tudo do banco e avisa sobre projetos que chegaram nesse meio-tempo. */
  const refresh = useCallback(async () => {
    try {
      const [ps, ts] = await Promise.all([api.projetos(), api.tarefas()]);
      const known = new Set(projetosRef.current.map((p) => p.id));
      const newest = projetosRef.current.reduce((m, p) => (p.created_at > m ? p.created_at : m), "");
      announce(ps.filter((p) => !known.has(p.id) && p.lead_id && p.created_at >= newest));
      setProjetos(ps);
      setTarefas(ts);
    } catch (e) {
      console.warn("[Projetos] falha ao atualizar:", e);
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
    document.title = `${unseen ? `(${unseen}) ` : ""}Projetos · Tríade Labs`;
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
  const patchProjeto = useCallback(
    async (id: string, changes: ProjetoUpdate, okMsg?: string): Promise<Projeto | null> => {
      const prev = projetosRef.current.find((p) => p.id === id);
      if (!prev) return null;
      setProjetos((xs) => xs.map((p) => (p.id === id ? { ...p, ...changes } : p)));
      try {
        const row = await api.updateProjeto(id, changes);
        setProjetos((xs) => xs.map((p) => (p.id === id ? row : p)));
        if (okMsg) toast(okMsg);
        return row;
      } catch (e) {
        setProjetos((xs) => xs.map((p) => (p.id === id ? prev : p)));
        toast(`Não foi possível salvar: ${errMsg(e)}`, "err");
        return null;
      }
    },
    [api, toast],
  );

  const moverEtapa = useCallback(
    async (id: string, to: Etapa): Promise<boolean> => {
      const p = projetosRef.current.find((x) => x.id === id);
      if (!p || p.etapa === to) return false;
      markSeen(id);
      const row = await patchProjeto(id, { etapa: to }, to === "concluido" ? "Projeto concluído!" : `Etapa: ${etapaNome(to)}`);
      return !!row;
    },
    [patchProjeto, markSeen],
  );

  const patchTarefa = useCallback(
    async (id: string, changes: TarefaUpdate): Promise<boolean> => {
      const prev = tarefasRef.current.find((t) => t.id === id);
      if (!prev) return false;
      setTarefas((xs) => xs.map((t) => (t.id === id ? { ...t, ...changes } : t)));
      try {
        const row = await api.updateTarefa(id, changes);
        setTarefas((xs) => xs.map((t) => (t.id === id ? row : t)));
        return true;
      } catch (e) {
        setTarefas((xs) => xs.map((t) => (t.id === id ? prev : t)));
        toast(`Não foi possível salvar a tarefa: ${errMsg(e)}`, "err");
        return false;
      }
    },
    [api, toast],
  );

  /** Busca de novo as tarefas de um projeto (depois de o banco criar o checklist). */
  const recarregarTarefas = useCallback(
    async (projetoId: string) => {
      const ts = await api.tarefas(projetoId);
      setTarefas((xs) => [...xs.filter((t) => t.projeto_id !== projetoId), ...ts]);
    },
    [api],
  );

  const createProjeto = useCallback(
    async (row: ProjetoInsert) => {
      const p = await api.createProjeto(row);
      setProjetos((xs) => upsert(xs, p, true));
      await recarregarTarefas(p.id).catch((e: unknown) => console.warn("[Projetos] checklist não carregado:", e));
      return p;
    },
    [api, recarregarTarefas],
  );

  const removeProjeto = useCallback(
    async (id: string) => {
      await api.removeProjeto(id);
      setProjetos((xs) => xs.filter((p) => p.id !== id));
      setTarefas((xs) => xs.filter((t) => t.projeto_id !== id));
    },
    [api],
  );

  const addTarefa = useCallback(
    async (row: TarefaInsert) => {
      const t = await api.addTarefa(row);
      setTarefas((xs) => upsert(xs, t));
      return t;
    },
    [api],
  );

  const removeTarefa = useCallback(
    async (id: string) => {
      await api.removeTarefa(id);
      setTarefas((xs) => xs.filter((t) => t.id !== id));
    },
    [api],
  );

  const aplicarModelo = useCallback(
    async (projetoId: string) => {
      const n = await api.aplicarModelo(projetoId);
      await recarregarTarefas(projetoId);
      return n;
    },
    [api, recarregarTarefas],
  );

  return {
    projetos,
    tarefas,
    fresh,
    realtime,
    markSeen,
    patchProjeto,
    moverEtapa,
    patchTarefa,
    createProjeto,
    removeProjeto,
    addTarefa,
    removeTarefa,
    aplicarModelo,
    refresh,
  };
}
