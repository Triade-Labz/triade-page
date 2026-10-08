import { createContext, useContext } from "react";

export type AppId = "crm" | "projetos";

/** Os painéis da equipe. O link fica no topo de cada um para alternar entre eles. */
export const APPS: Record<AppId, { nome: string; href: string; titulo: string }> = {
  crm: { nome: "CRM", href: "/crm.html", titulo: "CRM" },
  projetos: { nome: "Projetos", href: "/desenvolvimento-projetos", titulo: "Projetos" },
};

export const APP_IDS = Object.keys(APPS) as AppId[];

export const AppContext = createContext<AppId>("crm");

export function useApp(): AppId {
  return useContext(AppContext);
}

/** Demonstração só em desenvolvimento ou quando pedida: em produção, falta de configuração é erro visível. */
export const demoPermitido = import.meta.env.DEV || import.meta.env.VITE_CRM_DEMO === "true";
