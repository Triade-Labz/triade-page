import type { AuthApi, Membro } from "./auth";

/** Equipe fictícia dos modos de demonstração (CRM e projetos). */
export const DEMO_EQUIPE: Membro[] = [
  { email: "socio1@exemplo.com", nome: "Sócio 1" },
  { email: "socio2@exemplo.com", nome: "Sócio 2" },
  { email: "socio3@exemplo.com", nome: "Sócio 3" },
];

export const DEMO_EU = DEMO_EQUIPE[0]?.email ?? "socio1@exemplo.com";

/** Responde com uma cópia, depois de um instante, como se viesse do banco. */
export const later = <T,>(v: T): Promise<T> => new Promise((r) => setTimeout(() => r(structuredClone(v)), 120));

export function demoAuth(): AuthApi {
  return {
    demo: true,
    sessionEmail: () => later(DEMO_EU),
    onAuth: () => () => {},
    signIn: () => later(undefined),
    resetPassword: () => later(undefined),
    setPassword: () => later(undefined),
    signOut: () => later(undefined),
    equipe: () => later(DEMO_EQUIPE),
  };
}
