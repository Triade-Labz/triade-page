import { useState, type FormEvent } from "react";
import type { CrmApi } from "../api/types";
import { errMsg } from "../lib/errors";
import { Dialog } from "./Dialog";

export type PasswordMode = "recuperar" | "trocar";

const TEXTOS: Record<PasswordMode, { titulo: string; sub: string }> = {
  recuperar: { titulo: "Criar nova senha", sub: "Você entrou pelo link de recuperação. Defina a nova senha de acesso." },
  trocar: { titulo: "Trocar minha senha", sub: "Se recebeu uma senha provisória, troque por uma que só você conhece." },
};

/** Nova senha: pelo link de "Esqueci minha senha" ou pelo botão "Trocar senha" do painel. */
export function PasswordDialog({ api, mode, onDone }: { api: CrmApi; mode: PasswordMode | null; onDone: (ok: boolean) => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function close(ok: boolean) {
    setPassword("");
    setConfirm("");
    setError("");
    onDone(ok);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Use pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As duas senhas não são iguais.");
      return;
    }
    setBusy(true);
    try {
      await api.setPassword(password);
      close(true);
    } catch (er) {
      setError(`Não foi possível salvar: ${errMsg(er)}`);
    } finally {
      setBusy(false);
    }
  }

  const t = TEXTOS[mode ?? "trocar"];
  return (
    <Dialog open={mode !== null} onClose={() => close(false)} labelledBy="pass-title">
      <form onSubmit={onSubmit} noValidate>
        <h3 id="pass-title">{t.titulo}</h3>
        <p>{t.sub}</p>
        <div>
          <label className="lbl" htmlFor="p-new">
            Nova senha (mínimo 8 caracteres)
          </label>
          <input
            className="input"
            id="p-new"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="lbl" htmlFor="p-confirm">
            Repita a nova senha
          </label>
          <input
            className="input"
            id="p-confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        {error && (
          <div className="msg err" role="alert">
            {error}
          </div>
        )}
        <div className="dlg-actions">
          {mode === "trocar" && (
            <button className="btn btn-ghost" type="button" onClick={() => close(false)}>
              Cancelar
            </button>
          )}
          <button className="btn btn-primary" type="submit" disabled={busy}>
            Salvar senha
          </button>
        </div>
      </form>
    </Dialog>
  );
}
