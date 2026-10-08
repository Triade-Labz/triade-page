import { useEffect, useRef, useState } from "react";
import { PLANOS, PLANO_INFO, isPlano } from "../../shared/leads";
import {
  ETAPAS,
  ETAPA_INFO,
  SITUACOES,
  SITUACAO_NOME,
  isEtapa,
  isSituacao,
  type Etapa,
  type Projeto,
  type ProjetoUpdate,
  type Tarefa,
  type TarefaInsert,
} from "../../shared/projetos";
import { cx } from "../../shared/cx";
import { waMeLink } from "../../shared/phone";
import { SITE } from "../../shared/siteConfig";
import type { Membro } from "../../painel/api/auth";
import { APPS } from "../../painel/appContext";
import { Dialog } from "../../painel/components/Dialog";
import { IconArrow, IconCopy, IconLink, IconWa, IconX } from "../../painel/components/icons";
import { useToast } from "../../painel/components/toastContext";
import type { ProjetosApi } from "../api/types";
import { clienteLinha, etapaNome, progresso, proximaEtapa, textoEscopo } from "../lib/projetos";
import { DateField } from "./CommitField";
import { EscopoTab } from "./EscopoTab";
import { HistoricoTab } from "./HistoricoTab";
import { Barra, PrazoChip } from "./ProjetoCard";
import { TarefasTab } from "./TarefasTab";

type Aba = "tarefas" | "escopo" | "historico";
const ABAS: { id: Aba; nome: string }[] = [
  { id: "tarefas", nome: "Etapas e tarefas" },
  { id: "escopo", nome: "Escopo" },
  { id: "historico", nome: "Histórico" },
];

interface Props {
  api: ProjetosApi;
  projeto: Projeto | null;
  tarefas: Tarefa[];
  open: boolean;
  me: Membro;
  equipe: Membro[];
  hoje: string;
  notesVersion: number;
  onClose: () => void;
  onMove: (id: string, to: Etapa) => void;
  onPatch: (id: string, patch: ProjetoUpdate, okMsg: string) => void;
  onToggleTarefa: (id: string, feita: boolean) => void;
  onAddTarefa: (row: TarefaInsert) => Promise<Tarefa>;
  onRemoveTarefa: (id: string) => Promise<void>;
  onAplicarModelo: (projetoId: string) => Promise<number>;
  onDelete: (id: string) => Promise<void>;
}

export function ProjetoDrawer(props: Props) {
  const { api, projeto: p, tarefas, open, me, equipe, hoje, notesVersion, onClose, onMove, onPatch, onDelete } = props;
  const toast = useToast();
  const closeBtn = useRef<HTMLButtonElement>(null);
  const [aba, setAba] = useState<Aba>("tarefas");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const id = p?.id;

  useEffect(() => {
    if (open) setTimeout(() => closeBtn.current?.focus(), 50);
  }, [open, id]);

  // Esc fecha a gaveta (os diálogos tratam o próprio Esc).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector("dialog[open]")) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function copiarEscopo(proj: Projeto) {
    const txt = textoEscopo(proj, tarefas);
    try {
      await navigator.clipboard.writeText(txt);
      toast("Escopo copiado: cole no WhatsApp ou no e-mail do cliente");
    } catch {
      toast("Não foi possível copiar automaticamente. Selecione o texto na aba Escopo.", "err");
    }
  }

  const prox = p ? proximaEtapa(p, tarefas) : null;
  const pendentes = p ? tarefas.filter((t) => t.etapa === p.etapa && !t.feita).length : 0;
  const first = p?.cliente.split(/\s+/)[0] ?? "";
  const meFirst = me.nome.split(/\s+/)[0] ?? "";
  const waMsg = p ? `Olá, ${first}! Aqui é ${meFirst}, da ${SITE.empresa}. Passando para atualizar sobre o projeto ${p.nome}.` : "";

  return (
    <>
      <div className={cx("scrim", open && "on")} onClick={onClose} />
      <aside className={cx("drawer", "drawer-wide", open && "on")} aria-hidden={!open} inert={!open} aria-labelledby="pj-title" role="dialog">
        {p && (
          <>
            <div className="dr-h">
              <div>
                <h2 id="pj-title">{p.nome}</h2>
                <p>{clienteLinha(p)}</p>
              </div>
              <button ref={closeBtn} className="icon-btn" type="button" aria-label="Fechar" onClick={onClose}>
                <IconX />
              </button>
            </div>
            <div className="dr-b">
              <div className="dr-actions">
                {p.whatsapp && (
                  <a className="btn btn-wa" href={waMeLink(p.whatsapp, waMsg)} target="_blank" rel="noopener">
                    <IconWa />
                    WhatsApp
                  </a>
                )}
                {p.lead_id && (
                  <a className="btn btn-ghost" href={`${APPS.crm.href}?lead=${encodeURIComponent(p.lead_id)}`}>
                    <IconLink />
                    Ver no CRM
                  </a>
                )}
                <button className="btn btn-ghost" type="button" onClick={() => copiarEscopo(p)}>
                  <IconCopy />
                  Copiar escopo
                </button>
              </div>

              <div className="avanco">
                <div className="avanco-r1">
                  <span className="st">
                    <i style={{ background: `var(--e-${p.etapa})` }} />
                    {etapaNome(p.etapa)}
                  </span>
                  <PrazoChip projeto={p} hoje={hoje} />
                </div>
                <Barra prog={progresso(tarefas)} label="Progresso do projeto" />
                {prox && (
                  <div className="avanco-r2">
                    <span className="sub">
                      {pendentes ? `Faltam ${pendentes} ${pendentes === 1 ? "tarefa" : "tarefas"} desta etapa.` : "Tarefas desta etapa concluídas."}
                    </span>
                    <button className="btn btn-primary" type="button" onClick={() => onMove(p.id, prox)}>
                      {prox === "concluido" ? "Concluir projeto" : `Avançar para ${etapaNome(prox)}`}
                      <IconArrow />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid2">
                <div>
                  <label className="lbl" htmlFor="pj-etapa">
                    Etapa
                  </label>
                  <select className="input" id="pj-etapa" value={p.etapa} onChange={(e) => isEtapa(e.target.value) && onMove(p.id, e.target.value)}>
                    {ETAPAS.map((e) => (
                      <option key={e} value={e}>
                        {ETAPA_INFO[e].nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="lbl" htmlFor="pj-sit">
                    Situação
                  </label>
                  <select
                    className="input"
                    id="pj-sit"
                    value={p.situacao}
                    onChange={(e) => isSituacao(e.target.value) && onPatch(p.id, { situacao: e.target.value }, "Situação atualizada")}
                  >
                    {SITUACOES.map((s) => (
                      <option key={s} value={s}>
                        {SITUACAO_NOME[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="lbl" htmlFor="pj-resp">
                    Responsável
                  </label>
                  <select
                    className="input"
                    id="pj-resp"
                    value={p.responsavel ?? ""}
                    onChange={(e) => onPatch(p.id, { responsavel: e.target.value || null }, "Responsável atualizado")}
                  >
                    <option value="">Ninguém ainda</option>
                    {equipe.map((m) => (
                      <option key={m.email} value={m.email}>
                        {m.nome}
                      </option>
                    ))}
                    {p.responsavel && !equipe.some((m) => m.email === p.responsavel) && <option value={p.responsavel}>{p.responsavel}</option>}
                  </select>
                </div>
                <div>
                  <label className="lbl" htmlFor="pj-plano">
                    Plano
                  </label>
                  <select
                    className="input"
                    id="pj-plano"
                    value={p.plano}
                    onChange={(e) => {
                      if (!isPlano(e.target.value)) return;
                      onPatch(p.id, { plano: e.target.value }, "Plano atualizado. Em “Etapas e tarefas”, acrescente o checklist do novo plano.");
                    }}
                  >
                    {PLANOS.map((pl) => (
                      <option key={pl} value={pl}>
                        {PLANO_INFO[pl].rotulo}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="lbl" htmlFor="pj-inicio">
                    Início
                  </label>
                  <DateField key={`i-${p.id}`} id="pj-inicio" required value={p.inicio} onCommit={(v) => v && onPatch(p.id, { inicio: v }, "Início salvo")} />
                </div>
                <div>
                  <label className="lbl" htmlFor="pj-prazo">
                    Prazo de entrega
                  </label>
                  <DateField key={`p-${p.id}`} id="pj-prazo" value={p.prazo} onCommit={(v) => onPatch(p.id, { prazo: v }, v ? "Prazo salvo" : "Prazo removido")} />
                </div>
              </div>

              <div className="seg tabs" role="tablist" aria-label="Detalhes do projeto">
                {ABAS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    role="tab"
                    id={`tab-${a.id}`}
                    aria-selected={aba === a.id}
                    aria-controls={`painel-${a.id}`}
                    onClick={() => setAba(a.id)}
                  >
                    {a.nome}
                  </button>
                ))}
              </div>
              <div className="tab-panel" role="tabpanel" id={`painel-${aba}`} aria-labelledby={`tab-${aba}`}>
                {aba === "tarefas" && (
                  <TarefasTab
                    key={p.id}
                    projeto={p}
                    tarefas={tarefas}
                    equipe={equipe}
                    onToggle={props.onToggleTarefa}
                    onAdd={props.onAddTarefa}
                    onRemove={props.onRemoveTarefa}
                    onAplicarModelo={() => props.onAplicarModelo(p.id)}
                  />
                )}
                {aba === "escopo" && <EscopoTab key={p.id} projeto={p} onPatch={(patch, msg) => onPatch(p.id, patch, msg)} />}
                {aba === "historico" && <HistoricoTab api={api} projetoId={p.id} me={me} equipe={equipe} version={notesVersion} />}
              </div>

              <div className="danger">
                <p>Excluir apaga o projeto, as tarefas e o histórico. O lead continua no CRM. Para guardar o registro, prefira a situação “Cancelado”.</p>
                <button className="btn btn-danger" type="button" onClick={() => setConfirmDelete(true)}>
                  Excluir projeto
                </button>
              </div>
            </div>

            <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} labelledBy="pj-del-title">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setConfirmDelete(false);
                  await onDelete(p.id);
                }}
              >
                <h3 id="pj-del-title">Excluir este projeto?</h3>
                <p>{p.nome}, com todas as tarefas e o histórico, será apagado. Não dá para desfazer.</p>
                <div className="dlg-actions">
                  <button className="btn btn-ghost" type="button" onClick={() => setConfirmDelete(false)}>
                    Cancelar
                  </button>
                  <button className="btn btn-danger" type="submit">
                    Excluir de vez
                  </button>
                </div>
              </form>
            </Dialog>
          </>
        )}
      </aside>
    </>
  );
}
