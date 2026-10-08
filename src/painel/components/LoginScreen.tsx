import { useState, type FormEvent } from "react";
import type { AuthApi } from "../api/auth";
import { errMsg } from "../lib/errors";
import { Brand } from "./Brand";

interface Props {
  api: AuthApi;
  /** Mensagem vinda de fora (ex.: e-mail fora da equipe, erro de conexão). */
  initialError?: string | undefined;
  onSignedIn: (email: string) => Promise<void>;
}

export function LoginScreen({ api, initialError, onSignedIn }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialError ?? "");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setOk("");
    const em = email.trim().toLowerCase();
    if (!em || !password) {
      setError("Informe e-mail e senha.");
      return;
    }
    setBusy(true);
    try {
      await api.signIn(em, password);
      await onSignedIn(em);
    } catch (er) {
      const msg = errMsg(er);
      setError(/invalid/i.test(msg) ? "E-mail ou senha incorretos." : `Não foi possível entrar: ${msg}`);
    } finally {
      setBusy(false);
    }
  }

  async function onForgot() {
    setError("");
    setOk("");
    const em = email.trim().toLowerCase();
    if (!em) {
      setError("Digite seu e-mail acima e clique de novo em “Esqueci minha senha”.");
      return;
    }
    try {
      await api.resetPassword(em);
      setOk("Se o e-mail estiver cadastrado, enviamos um link para criar uma nova senha.");
    } catch (er) {
      setError(`Não foi possível enviar: ${errMsg(er)}`);
    }
  }

  return (
    <section className="login">
      <div className="login-card">
        <Brand />
        <h1>Entrar no painel</h1>
        <p className="sub">Acesso restrito à equipe da Tríade Labs.</p>
        <form onSubmit={onSubmit} noValidate>
          <div>
            <label className="lbl" htmlFor="l-email">
              E-mail
            </label>
            <input className="input" id="l-email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="lbl" htmlFor="l-pass">
              Senha
            </label>
            <input
              className="input"
              id="l-pass"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <div className="msg err" role="alert">
              {error}
            </div>
          )}
          {ok && (
            <div className="msg ok" role="status">
              {ok}
            </div>
          )}
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Entrando…" : "Entrar"}
          </button>
          <button className="linkbtn" type="button" onClick={onForgot}>
            Esqueci minha senha
          </button>
        </form>
      </div>
    </section>
  );
}
