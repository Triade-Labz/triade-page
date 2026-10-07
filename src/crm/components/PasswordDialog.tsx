import { useState, type FormEvent } from "react";
import type { CrmApi } from "../api/types";
import { errMsg } from "../lib/errors";
import { Dialog } from "./Dialog";

/** Aberto quando a pessoa chega pelo link de "Esqueci minha senha". */
export function PasswordDialog({ api, open, onDone }: { api: CrmApi; open: boolean; onDone: (ok: boolean) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Use pelo menos 8 caracteres.");
      return;
    }
    setBusy(true);
    try {
      await api.setPassword(password);
      setPassword("");
      setError("");
      onDone(true);
    } catch (er) {
      setError(`Não foi possível salvar: ${errMsg(er)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={() => onDone(false)} labelledBy="pass-title">
      <form onSubmit={onSubmit} noValidate>
        <h3 id="pass-title">Criar nova senha</h3>
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
        {error && (
          <div className="msg err" role="alert">
            {error}
          </div>
        )}
        <div className="dlg-actions">
          <button className="btn btn-primary" type="submit" disabled={busy}>
            Salvar senha
          </button>
        </div>
      </form>
    </Dialog>
  );
}
