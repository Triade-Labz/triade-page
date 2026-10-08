import type { Membro } from "../api/auth";

/** Nome do sócio pelo e-mail (ou o próprio e-mail, se ele saiu da equipe). */
export function membroNome(equipe: Membro[], email: string | null | undefined): string {
  if (!email) return "";
  return equipe.find((e) => e.email === email)?.nome ?? email;
}
