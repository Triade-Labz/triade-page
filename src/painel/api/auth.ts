/** Login da equipe: o mesmo para o CRM e para o controle de projetos (mesma sessão do Supabase). */

export type Membro = {
  email: string;
  nome: string;
};

export type AuthEvent = "SIGNED_IN" | "SIGNED_OUT" | "PASSWORD_RECOVERY" | "OTHER";

/** "on": recebendo em tempo real. "off": canal caiu, o painel passa a consultar periodicamente. */
export type RealtimeState = "connecting" | "on" | "off";

export interface AuthApi {
  readonly demo: boolean;
  sessionEmail(): Promise<string | null>;
  onAuth(cb: (event: AuthEvent) => void): () => void;
  signIn(email: string, password: string): Promise<void>;
  resetPassword(email: string): Promise<void>;
  setPassword(password: string): Promise<void>;
  signOut(): Promise<void>;
  /** Só quem está na tabela equipe entra nos painéis. */
  equipe(): Promise<Membro[]>;
}
