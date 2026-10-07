import { useEffect, useRef, useState, type FormEvent } from "react";
import { LEAD_STATUS, isLeadStatus, type Lead, type LeadStatus, type LeadUpdate } from "../../shared/leads";
import { cx } from "../../shared/cx";
import { formatBrPhone, waMeLink } from "../../shared/phone";
import { SITE } from "../../shared/siteConfig";
import type { CrmApi, Membro, Nota } from "../api/types";
import { errMsg } from "../lib/errors";
import { ago, dataHora, formatValorInput, parseValor } from "../lib/format";
import { STATUS_NOME, describeOrigem, membroNome, planoCurto } from "../lib/leads";
import { Dialog } from "./Dialog";
import { IconCopy, IconWa, IconX } from "./icons";
import { useToast } from "./toastContext";

interface Props {
  api: CrmApi;
  lead: Lead | null;
  open: boolean;
  me: Membro;
  equipe: Membro[];
  now: number;
  /** Muda quando o histórico precisa ser recarregado (ex.: mudança de etapa). */
  notesVersion: number;
  onClose: () => void;
  onStatus: (id: string, to: LeadStatus) => void;
  onPatch: (id: string, patch: LeadUpdate, okMsg: string) => void;
  onDelete: (id: string) => Promise<void>;
}

const DATA_VALIDA = /^(\d{4})-\d{2}-\d{2}$/;

function ValorInput({ lead, onCommit }: { lead: Lead; onCommit: (v: number | null) => void }) {
  const [draft, setDraft] = useState(formatValorInput(lead.valor));
  const [synced, setSynced] = useState(lead.valor);
  const [focused, setFocused] = useState(false);
  // Atualização vinda do banco (ou de outro sócio) não apaga o que está sendo digitado.
  if (!focused && lead.valor !== synced) {
    setSynced(lead.valor);
    setDraft(formatValorInput(lead.valor));
  }
  const commit = () => {
    setFocused(false);
    const v = parseValor(draft);
    setDraft(formatValorInput(v));
    if (v !== lead.valor) onCommit(v);
  };
  return (
    <input
      className="input"
      id="dr-valor"
      inputMode="decimal"
      placeholder="0"
      value={draft}
      onFocus={() => setFocused(true)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
    />
  );
}

function ProximoContatoInput({ lead, onCommit }: { lead: Lead; onCommit: (v: string | null) => void }) {
  const [draft, setDraft] = useState(lead.proximo_contato ?? "");
  const [synced, setSynced] = useState(lead.proximo_contato);
  const [focused, setFocused] = useState(false);
  if (!focused && lead.proximo_contato !== synced) {
    setSynced(lead.proximo_contato);
    setDraft(lead.proximo_contato ?? "");
  }
  // Só salva data completa (o campo de data fica vazio enquanto se digita o ano).
  const isComplete = (v: string) => Number(DATA_VALIDA.exec(v)?.[1] ?? 0) >= 2000;
  return (
    <input
      className="input"
      id="dr-prox"
      type="date"
      value={draft}
      onFocus={() => setFocused(true)}
      onChange={(e) => {
        const v = e.target.value;
        setDraft(v);
        if (isComplete(v) && v !== lead.proximo_contato) onCommit(v);
      }}
      onBlur={() => {
        setFocused(false);
        if (!draft && lead.proximo_contato) onCommit(null);
      }}
    />
  );
}

export function LeadDrawer({ api, lead, open, me, equipe, now, notesVersion, onClose, onStatus, onPatch, onDelete }: Props) {
  const toast = useToast();
  const closeBtn = useRef<HTMLButtonElement>(null);
  // Guardadas com o id do lead, para nunca mostrar as anotações do lead anterior.
  const [notasState, setNotasState] = useState<{ leadId: string; list: Nota[] } | { leadId: string; erro: string } | null>(null);
  const [texto, setTexto] = useState("");
  const [salvandoNota, setSalvandoNota] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reload, setReload] = useState(0);
  const leadId = lead?.id;

  useEffect(() => {
    if (open) setTimeout(() => closeBtn.current?.focus(), 50);
  }, [open, leadId]);

  useEffect(() => {
    if (!open || !leadId) return;
    let alive = true;
    api
      .notas(leadId)
      .then((list) => {
        if (alive) setNotasState({ leadId, list });
      })
      .catch((e: unknown) => {
        if (alive) setNotasState({ leadId, erro: errMsg(e) });
      });
    return () => {
      alive = false;
    };
  }, [api, open, leadId, notesVersion, reload]);

  // Esc fecha a gaveta (os diálogos tratam o próprio Esc).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector("dialog[open]")) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function addNota(e: FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t || !leadId) return;
    setSalvandoNota(true);
    try {
      await api.addNota(leadId, t.slice(0, 4000), "nota");
      setTexto("");
      setReload((n) => n + 1);
    } catch (er) {
      toast(`Não foi possível salvar a anotação: ${errMsg(er)}`, "err");
    } finally {
      setSalvandoNota(false);
    }
  }

  async function delNota(id: string) {
    try {
      await api.delNota(id);
      setReload((n) => n + 1);
    } catch (er) {
      toast(`Não foi possível apagar: ${errMsg(er)}`, "err");
    }
  }

  async function copyPhone(l: Lead) {
    const p = formatBrPhone(l.whatsapp);
    try {
      await navigator.clipboard.writeText(p);
      toast("WhatsApp copiado");
    } catch {
      toast(`Copie manualmente: ${p}`);
    }
  }

  const current = notasState && notasState.leadId === leadId ? notasState : null;
  const notas = current && "list" in current ? current.list : null;
  const notasErro = current && "erro" in current ? current.erro : "";

  const first = lead?.nome.split(/\s+/)[0] ?? "";
  const meFirst = me.nome.split(/\s+/)[0] ?? "";
  const waMsg = lead
    ? `Olá, ${first}! Aqui é ${meFirst}, da ${SITE.empresa}. Recebemos seu pedido sobre ${planoCurto(lead.plano).toLowerCase()} e queria entender melhor o que você precisa.`
    : "";

  return (
    <>
      <div className={cx("scrim", open && "on")} onClick={onClose} />
      <aside className={cx("drawer", open && "on")} aria-hidden={!open} inert={!open} aria-labelledby="dr-name" role="dialog">
        {lead && (
          <>
            <div className="dr-h">
              <div>
                <h2 id="dr-name">{lead.nome}</h2>
                <p>{lead.empresa}</p>
              </div>
              <button ref={closeBtn} className="icon-btn" type="button" aria-label="Fechar" onClick={onClose}>
                <IconX />
              </button>
            </div>
            <div className="dr-b">
              <div className="dr-actions">
                <a className="btn btn-wa" href={waMeLink(lead.whatsapp, waMsg)} target="_blank" rel="noopener">
                  <IconWa />
                  Chamar no WhatsApp
                </a>
                <button className="btn btn-ghost" type="button" onClick={() => copyPhone(lead)}>
                  <IconCopy />
                  <span>{formatBrPhone(lead.whatsapp)}</span>
                </button>
              </div>

              <div className="grid2">
                <div>
                  <label className="lbl" htmlFor="dr-status">
                    Etapa
                  </label>
                  <select className="input" id="dr-status" value={lead.status} onChange={(e) => isLeadStatus(e.target.value) && onStatus(lead.id, e.target.value)}>
                    {LEAD_STATUS.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_NOME[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="lbl" htmlFor="dr-resp">
                    Responsável
                  </label>
                  <select
                    className="input"
                    id="dr-resp"
                    value={lead.responsavel ?? ""}
                    onChange={(e) => onPatch(lead.id, { responsavel: e.target.value || null }, "Responsável atualizado")}
                  >
                    <option value="">Ninguém ainda</option>
                    {equipe.map((m) => (
                      <option key={m.email} value={m.email}>
                        {m.nome}
                      </option>
                    ))}
                    {lead.responsavel && !equipe.some((m) => m.email === lead.responsavel) && <option value={lead.responsavel}>{lead.responsavel}</option>}
                  </select>
                </div>
                <div>
                  <label className="lbl" htmlFor="dr-valor">
                    Valor (R$)
                  </label>
                  <ValorInput key={lead.id} lead={lead} onCommit={(v) => onPatch(lead.id, { valor: v }, "Valor salvo")} />
                </div>
                <div>
                  <label className="lbl" htmlFor="dr-prox">
                    Próximo contato
                  </label>
                  <ProximoContatoInput key={lead.id} lead={lead} onCommit={(v) => onPatch(lead.id, { proximo_contato: v }, "Próximo contato salvo")} />
                </div>
              </div>

              <dl className="info">
                <dt>interesse</dt>
                <dd>{planoCurto(lead.plano)}</dd>
                <dt>recebido</dt>
                <dd>
                  {dataHora(lead.created_at)} ({ago(lead.created_at, now)})
                </dd>
                <dt>origem</dt>
                <dd>{describeOrigem(lead)}</dd>
                <dt>consentimento</dt>
                <dd>{lead.consentimento_em ? dataHora(lead.consentimento_em) : "–"}</dd>
              </dl>

              <p className="sec">Anotações e histórico</p>
              <form className="note-form" onSubmit={addNota}>
                <label className="lbl sr-only" htmlFor="note-text">
                  Nova anotação
                </label>
                <textarea
                  className="input"
                  id="note-text"
                  maxLength={4000}
                  placeholder="Ex.: Liguei, pediu proposta até sexta. Quer loja virtual."
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                />
                <button className="btn btn-primary" type="submit" disabled={salvandoNota || !texto.trim()}>
                  Adicionar anotação
                </button>
              </form>
              <ul className="timeline">
                {notasErro ? (
                  <li className="status">Não foi possível carregar: {notasErro}</li>
                ) : notas === null ? (
                  <li className="status">carregando…</li>
                ) : notas.length === 0 ? (
                  <li className="status">Nenhuma anotação ainda. Registre aqui cada conversa com o lead.</li>
                ) : (
                  notas.map((n) => (
                    <li key={n.id} className={n.tipo === "status" ? "status" : undefined}>
                      <div className="meta">
                        <span>{membroNome(equipe, n.autor)}</span>
                        <span>{dataHora(n.created_at)}</span>
                        {n.autor === me.email && n.tipo === "nota" && (
                          <button type="button" onClick={() => delNota(n.id)}>
                            apagar
                          </button>
                        )}
                      </div>
                      {n.tipo === "status" ? `Etapa: ${n.texto}` : n.texto}
                    </li>
                  ))
                )}
              </ul>

              <div className="danger">
                <p>Se a pessoa pedir para apagar os dados dela (direito previsto na LGPD), exclua o lead aqui. As anotações também são apagadas.</p>
                <button className="btn btn-danger" type="button" onClick={() => setConfirmDelete(true)}>
                  Excluir lead
                </button>
              </div>
            </div>

            <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} labelledBy="del-title">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setConfirmDelete(false);
                  await onDelete(lead.id);
                }}
              >
                <h3 id="del-title">Excluir este lead?</h3>
                <p>
                  {lead.nome} ({lead.empresa}) e todas as anotações serão apagados. Não dá para desfazer.
                </p>
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
