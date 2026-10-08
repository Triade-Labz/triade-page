import { useMemo } from "react";
import { supabaseConfig } from "../shared/supabaseConfig";
import { demoPermitido } from "../painel/appContext";
import { Painel } from "../painel/components/Painel";
import { createDemoApi } from "./api/demoApi";
import { createSupabaseApi } from "./api/supabaseApi";
import type { DadosIniciais, ProjetosApi } from "./api/types";
import { Dashboard } from "./components/Dashboard";

const carregar = async (api: ProjetosApi): Promise<DadosIniciais> => {
  const [projetos, tarefas] = await Promise.all([api.projetos(), api.tarefas()]);
  return { projetos, tarefas };
};

export function ProjetosApp() {
  const api = useMemo<ProjetosApi | null>(() => {
    if (supabaseConfig.ok) return createSupabaseApi(supabaseConfig.config);
    return demoPermitido ? createDemoApi() : null;
  }, []);

  return (
    <Painel app="projetos" api={api} configError={supabaseConfig.ok ? "" : supabaseConfig.message} load={carregar}>
      {({ api, me, equipe, data, logout, changePassword }) => (
        <Dashboard api={api} me={me} equipe={equipe} inicial={data} onLogout={logout} onChangePassword={changePassword} />
      )}
    </Painel>
  );
}
