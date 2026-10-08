import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { AuthApi, Membro } from "../api/auth";
import { APPS, AppContext, type AppId } from "../appContext";
import { errMsg } from "../lib/errors";
import { Brand } from "./Brand";
import { LoginScreen } from "./LoginScreen";
import { PasswordDialog, type PasswordMode } from "./PasswordDialog";
import { ToastProvider } from "./Toasts";
import { useToast } from "./toastContext";

export interface PainelCtx<A, D> {
  api: A;
  me: Membro;
  equipe: Membro[];
  /** Dados carregados logo depois do login. */
  data: D;
  logout: () => Promise<void>;
  changePassword: () => void;
}

interface Props<A extends AuthApi, D> {
  app: AppId;
  /** null quando o Supabase não está configurado (e a demonstração não é permitida). */
  api: A | null;
  configError: string;
  /** Precisa ser estável (função fora do componente ou memorizada). */
  load: (api: A) => Promise<D>;
  children: (ctx: PainelCtx<A, D>) => ReactNode;
}

type Phase<D> = { tipo: "carregando" } | { tipo: "login"; erro?: string } | { tipo: "painel"; me: Membro; equipe: Membro[]; data: D };

function ConfigError({ app, message }: { app: AppId; message: string }) {
  return (
    <section className="login">
      <div className="login-card">
        <Brand />
        <h1>{APPS[app].titulo} sem conexão com o banco</h1>
        <p className="sub">O painel não está configurado, então os dados da equipe não podem ser exibidos.</p>
        <div className="msg err" role="alert">
          {message}
        </div>
        <p className="sub config-help">
          Defina <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> nas variáveis de ambiente da hospedagem (mesmos valores do
          site) e publique de novo. Veja o README.
        </p>
      </div>
    </section>
  );
}

/** Login, conferência da equipe e troca de senha: igual no CRM e no controle de projetos. */
function Gate<A extends AuthApi, D>({ api, load, children }: { api: A; load: (api: A) => Promise<D>; children: Props<A, D>["children"] }) {
  const toast = useToast();
  const [phase, setPhase] = useState<Phase<D>>({ tipo: "carregando" });
  const [passwordMode, setPasswordMode] = useState<PasswordMode | null>(null);

  /** Carrega equipe e dados e confere se o e-mail logado faz parte da equipe. */
  const loadFor = useCallback(
    async (email: string) => {
      const [equipe, data] = await Promise.all([api.equipe(), load(api)]);
      const me = api.demo ? equipe[0] : equipe.find((m) => m.email === email.toLowerCase());
      if (!me) {
        await api.signOut();
        setPhase({ tipo: "login", erro: "Este e-mail ainda não está liberado na equipe. Peça para incluí-lo na tabela equipe do Supabase." });
        return;
      }
      setPhase({ tipo: "painel", me, equipe, data });
    },
    [api, load],
  );

  useEffect(() => {
    const off = api.onAuth((ev) => {
      if (ev === "PASSWORD_RECOVERY") setPasswordMode("recuperar");
      if (ev === "SIGNED_OUT") setPhase((p) => (p.tipo === "painel" ? { tipo: "login" } : p));
    });
    let alive = true;
    api
      .sessionEmail()
      .then((email) => {
        if (!alive) return;
        if (email) return loadFor(email);
        setPhase({ tipo: "login" });
      })
      .catch((e: unknown) => alive && setPhase({ tipo: "login", erro: `Erro ao conectar: ${errMsg(e)}` }));
    return () => {
      alive = false;
      off();
    };
  }, [api, loadFor]);

  const logout = useCallback(async () => {
    try {
      await api.signOut();
    } finally {
      setPhase({ tipo: "login" });
    }
  }, [api]);

  const changePassword = useCallback(() => setPasswordMode("trocar"), []);

  return (
    <>
      {phase.tipo === "carregando" && <div className="loading">carregando…</div>}
      {phase.tipo === "login" && (
        <LoginScreen
          key={phase.erro ?? ""}
          api={api}
          initialError={phase.erro}
          onSignedIn={async (email) => {
            try {
              await loadFor(email);
            } catch (e) {
              setPhase({ tipo: "login", erro: `Entrou, mas não foi possível carregar os dados: ${errMsg(e)}` });
            }
          }}
        />
      )}
      {phase.tipo === "painel" && children({ api, me: phase.me, equipe: phase.equipe, data: phase.data, logout, changePassword })}
      <PasswordDialog
        api={api}
        mode={passwordMode}
        onDone={(ok) => {
          setPasswordMode(null);
          if (ok) toast("Senha atualizada");
        }}
      />
    </>
  );
}

export function Painel<A extends AuthApi, D>({ app, api, configError, load, children }: Props<A, D>) {
  return (
    <AppContext.Provider value={app}>
      <ToastProvider>
        {api ? (
          <Gate api={api} load={load}>
            {children}
          </Gate>
        ) : (
          <ConfigError app={app} message={configError} />
        )}
      </ToastProvider>
    </AppContext.Provider>
  );
}
