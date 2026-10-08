import { useMemo } from "react";
import { supabaseConfig } from "../shared/supabaseConfig";
import { demoPermitido } from "../painel/appContext";
import { Painel } from "../painel/components/Painel";
import { createDemoApi } from "./api/demoApi";
import { createSupabaseApi } from "./api/supabaseApi";
import type { CrmApi } from "./api/types";
import { Dashboard } from "./components/Dashboard";

const carregarLeads = (api: CrmApi) => api.leads();

export function CrmApp() {
  const api = useMemo<CrmApi | null>(() => {
    if (supabaseConfig.ok) return createSupabaseApi(supabaseConfig.config);
    return demoPermitido ? createDemoApi() : null;
  }, []);

  return (
    <Painel app="crm" api={api} configError={supabaseConfig.ok ? "" : supabaseConfig.message} load={carregarLeads}>
      {({ api, me, equipe, data, logout, changePassword }) => (
        <Dashboard api={api} me={me} equipe={equipe} initialLeads={data} onLogout={logout} onChangePassword={changePassword} />
      )}
    </Painel>
  );
}
