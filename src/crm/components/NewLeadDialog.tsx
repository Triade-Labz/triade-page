import { useState, type FormEvent } from "react";
import { LIMITES, PLANOS, PLANO_INFO, isPlano, type Lead, type LeadInsertEquipe, type Plano } from "../../shared/leads";
import { formatBrPhone, isValidBrPhone, normalizeBrPhone } from "../../shared/phone";
import { cleanText } from "../../shared/validation";
import type { Membro } from "../api/types";
import { errMsg } from "../../painel/lib/errors";
import { Dialog } from "../../painel/components/Dialog";

const CANAIS = ["Indicação", "Instagram", "WhatsApp", "LinkedIn", "Evento", "Outro"];

interface Props {
  open: boolean;
  me: Membro;
  onClose: () => void;
  onCreate: (row: LeadInsertEquipe) => Promise<Lead>;
}

/** Cadastro de contatos que chegaram por fora do site. */
export function NewLeadDialog({ open, me, onClose, onCreate }: Props) {
  const [nome, setNome] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [wa, setWa] = useState("");
  const [plano, setPlano] = useState<Plano>("essencial");
  const [canal, setCanal] = useState(CANAIS[0] ?? "Outro");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function reset() {
    setNome("");
    setEmpresa("");
    setWa("");
    setPlano("essencial");
    setCanal(CANAIS[0] ?? "Outro");
    setError("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const n = cleanText(nome);
    const emp = cleanText(empresa);
    const digits = normalizeBrPhone(wa);
    const err =
      n.length < LIMITES.nome.min ? "Informe o nome." : emp.length < LIMITES.empresa.min ? "Informe a empresa." : !isValidBrPhone(digits) ? "Informe um WhatsApp com DDD." : "";
    if (err) {
      setError(err);
      return;
    }
    setBusy(true);
    try {
      await onCreate({
        nome: n.slice(0, LIMITES.nome.max),
        empresa: emp.slice(0, LIMITES.empresa.max),
        whatsapp: digits,
        plano,
        consentimento_em: new Date().toISOString(),
        origem: { canal, manual: true, registrado_por: me.email },
        responsavel: me.email,
      });
      reset();
      onClose();
    } catch (er) {
      setError(`Não foi possível salvar: ${errMsg(er)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      labelledBy="new-title"
    >
      <form onSubmit={onSubmit} noValidate>
        <h3 id="new-title">Novo lead</h3>
        <p>Para contatos que chegaram por fora do site: indicação, Instagram, evento.</p>
        <div>
          <label className="lbl" htmlFor="n-nome">
            Nome
          </label>
          <input className="input" id="n-nome" required autoFocus maxLength={LIMITES.nome.max} value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div>
          <label className="lbl" htmlFor="n-emp">
            Empresa
          </label>
          <input className="input" id="n-emp" required maxLength={LIMITES.empresa.max} value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
        </div>
        <div>
          <label className="lbl" htmlFor="n-wa">
            WhatsApp
          </label>
          <input
            className="input"
            id="n-wa"
            type="tel"
            inputMode="numeric"
            placeholder="(51) 90000-0000"
            required
            value={wa}
            onChange={(e) => setWa(formatBrPhone(e.target.value))}
          />
        </div>
        <div className="grid2 grid2-tight">
          <div>
            <label className="lbl" htmlFor="n-int">
              Interesse
            </label>
            <select className="input" id="n-int" value={plano} onChange={(e) => isPlano(e.target.value) && setPlano(e.target.value)}>
              {PLANOS.map((p) => (
                <option key={p} value={p}>
                  {PLANO_INFO[p].curto}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="lbl" htmlFor="n-canal">
              Como chegou
            </label>
            <select className="input" id="n-canal" value={canal} onChange={(e) => setCanal(e.target.value)}>
              {CANAIS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        {error && (
          <div className="msg err" role="alert">
            {error}
          </div>
        )}
        <div className="dlg-actions">
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancelar
          </button>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            Salvar lead
          </button>
        </div>
      </form>
    </Dialog>
  );
}
