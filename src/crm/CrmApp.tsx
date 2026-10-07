import { useCallback, useEffect, useMemo, useState } from "react";
import type { Lead } from "../shared/leads";
import { supabaseConfig } from "../shared/supabaseConfig";
import { createDemoApi } from "./api/demoApi";
import { createSupabaseApi } from "./api/supabaseApi";
import type { CrmApi, Membro } from "./api/types";
import { Brand } from "./components/Brand";
import { Dashboard } from "./components/Dashboard";
import { LoginScreen } from "./components/LoginScreen";
import { PasswordDialog } from "./components/PasswordDialog";
import { ToastProvider } from "./components/Toasts";
import { useToast } from "./components/toastContext";
import { errMsg } from "./lib/errors";

type Phase =
  | { tipo: "carregando" }
  | { tipo: "login"; erro?: string }
  | { tipo: "painel"; me: Membro; equipe: Membro[]; leads: Lead[] };

/** Demo só em desenvolvimento ou quando pedido explicitamente: em produção, falta de configuração é erro visível. */
const demoPermitido = import.meta.env.DEV || import.meta.env.VITE_CRM_DEMO === "true";

function ConfigError({ message }: { message: string }) {
  return (
    <section className="login">
      <div className="login-card">
        <Brand />
        <h1>CRM sem conexão com o banco</h1>
        <p className="sub">O painel não está configurado, então os leads do site não podem ser exibidos.</p>
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

function Crm({ api }: { api: CrmApi }) {
  const toast = useToast();
  const [phase, setPhase] = useState<Phase>({ tipo: "carregando" });
  const [recovering, setRecovering] = useState(false);

  /** Carrega equipe e leads e confere se o e-mail logado faz parte da equipe. */
  const loadFor = useCallback(
    async (email: string) => {
      const [equipe, leads] = await Promise.all([api.equipe(), api.leads()]);
      const me = api.demo ? equipe[0] : equipe.find((m) => m.email === email.toLowerCase());
      if (!me) {
        await api.signOut();
        setPhase({ tipo: "login", erro: "Este e-mail ainda não está liberado na equipe. Peça para incluí-lo na tabela equipe do Supabase." });
        return;
      }
      setPhase({ tipo: "painel", me, equipe, leads });
    },
    [api],
  );

  useEffect(() => {
    const off = api.onAuth((ev) => {
      if (ev === "PASSWORD_RECOVERY") setRecovering(true);
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
              setPhase({ tipo: "login", erro: `Entrou, mas não foi possível carregar os leads: ${errMsg(e)}` });
            }
          }}
        />
      )}
      {phase.tipo === "painel" && (
        <Dashboard api={api} me={phase.me} equipe={phase.equipe} initialLeads={phase.leads} onLogout={() => setPhase({ tipo: "login" })} />
      )}
      <PasswordDialog
        api={api}
        open={recovering}
        onDone={(ok) => {
          setRecovering(false);
          if (ok) toast("Senha atualizada");
        }}
      />
    </>
  );
}

export function CrmApp() {
  const api = useMemo<CrmApi | null>(() => {
    if (supabaseConfig.ok) return createSupabaseApi(supabaseConfig.config);
    return demoPermitido ? createDemoApi() : null;
  }, []);

  return (
    <ToastProvider>
      {api ? <Crm api={api} /> : <ConfigError message={supabaseConfig.ok ? "" : supabaseConfig.message} />}
    </ToastProvider>
  );
}
