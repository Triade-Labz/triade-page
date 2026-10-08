import { useState, type FormEvent } from "react";
import { PLANOS, PLANO_INFO, isPlano, type Plano } from "../../shared/leads";
import { LIMITES_PROJETO, type Projeto, type ProjetoInsert } from "../../shared/projetos";
import { formatBrPhone, isValidBrPhone, normalizeBrPhone } from "../../shared/phone";
import { cleanText } from "../../shared/validation";
import type { Membro } from "../../painel/api/auth";
import { Dialog } from "../../painel/components/Dialog";
import { errMsg } from "../../painel/lib/errors";
import { modeloDoPlano } from "../lib/modelos";

interface Props {
  open: boolean;
  me: Membro;
  equipe: Membro[];
  onClose: () => void;
  onCreate: (row: ProjetoInsert) => Promise<Projeto>;
}

/** Projeto que não veio de um contrato do CRM (ex.: indicação fechada por fora, projeto interno). */
export function NovoProjetoDialog({ open, me, equipe, onClose, onCreate }: Props) {
  const [nome, setNome] = useState("");
  const [cliente, setCliente] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [wa, setWa] = useState("");
  const [plano, setPlano] = useState<Plano>("essencial");
  const [responsavel, setResponsavel] = useState(me.email);
  const [prazo, setPrazo] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function reset() {
    setNome("");
    setCliente("");
    setEmpresa("");
    setWa("");
    setPlano("essencial");
    setResponsavel(me.email);
    setPrazo("");
    setError("");
  }

  function close() {
    reset();
    onClose();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const n = cleanText(nome);
    const c = cleanText(cliente);
    const digits = normalizeBrPhone(wa);
    const err =
      n.length < LIMITES_PROJETO.nome.min
        ? "Dê um nome ao projeto."
        : c.length < LIMITES_PROJETO.cliente.min
          ? "Informe o cliente."
          : digits && !isValidBrPhone(digits)
            ? "WhatsApp inválido: use DDD + número (ou deixe em branco)."
            : "";
    if (err) {
      setError(err);
      return;
    }
    setBusy(true);
    try {
      await onCreate({
        nome: n.slice(0, LIMITES_PROJETO.nome.max),
        cliente: c.slice(0, LIMITES_PROJETO.cliente.max),
        empresa: cleanText(empresa).slice(0, LIMITES_PROJETO.empresa.max),
        whatsapp: digits || null,
        plano,
        responsavel: responsavel || null,
        prazo: prazo || null,
      });
      close();
    } catch (er) {
      setError(`Não foi possível criar: ${errMsg(er)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={close} labelledBy="np-title">
      <form onSubmit={onSubmit} noValidate>
        <h3 id="np-title">Novo projeto</h3>
        <p>Contratos fechados no CRM já viram projeto sozinhos. Use aqui para o que foi fechado por fora.</p>
        <div>
          <label className="lbl" htmlFor="np-nome">
            Nome do projeto
          </label>
          <input
            className="input"
            id="np-nome"
            required
            autoFocus
            maxLength={LIMITES_PROJETO.nome.max}
            placeholder="Ex.: Landing page — Clínica Sorriso"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>
        <div className="grid2 grid2-tight">
          <div>
            <label className="lbl" htmlFor="np-cliente">
              Cliente
            </label>
            <input className="input" id="np-cliente" required maxLength={LIMITES_PROJETO.cliente.max} value={cliente} onChange={(e) => setCliente(e.target.value)} />
          </div>
          <div>
            <label className="lbl" htmlFor="np-emp">
              Empresa
            </label>
            <input className="input" id="np-emp" maxLength={LIMITES_PROJETO.empresa.max} value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
          </div>
          <div>
            <label className="lbl" htmlFor="np-wa">
              WhatsApp (opcional)
            </label>
            <input
              className="input"
              id="np-wa"
              type="tel"
              inputMode="numeric"
              placeholder="(51) 90000-0000"
              value={wa}
              onChange={(e) => setWa(formatBrPhone(e.target.value))}
            />
          </div>
          <div>
            <label className="lbl" htmlFor="np-prazo">
              Prazo de entrega
            </label>
            <input className="input" id="np-prazo" type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
          </div>
          <div>
            <label className="lbl" htmlFor="np-plano">
              Plano
            </label>
            <select className="input" id="np-plano" value={plano} onChange={(e) => isPlano(e.target.value) && setPlano(e.target.value)}>
              {PLANOS.map((p) => (
                <option key={p} value={p}>
                  {PLANO_INFO[p].curto}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="lbl" htmlFor="np-resp">
              Responsável
            </label>
            <select className="input" id="np-resp" value={responsavel} onChange={(e) => setResponsavel(e.target.value)}>
              <option value="">Ninguém ainda</option>
              {equipe.map((m) => (
                <option key={m.email} value={m.email}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="np-hint">O projeto começa com o checklist padrão do plano ({modeloDoPlano(plano).length} tarefas). Dá para editar depois.</p>
        {error && (
          <div className="msg err" role="alert">
            {error}
          </div>
        )}
        <div className="dlg-actions">
          <button className="btn btn-ghost" type="button" onClick={close}>
            Cancelar
          </button>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            Criar projeto
          </button>
        </div>
      </form>
    </Dialog>
  );
}
