/**
 * Transforma erros do Supabase/PostgREST em mensagens que a equipe entende
 * e que dizem o que fazer, em vez de "permission denied for table leads".
 */
export function errMsg(e: unknown): string {
  if (!e) return "erro desconhecido";
  const err = e as { code?: string; message?: string; error_description?: string; status?: number };
  const code = err.code ?? "";
  const message = err.message || err.error_description || (typeof e === "string" ? e : "");

  if (code === "42501" || /permission denied/i.test(message)) {
    return "o banco recusou o acesso (permissão). Rode database/04-permissoes-site-crm.sql no SQL Editor do Supabase.";
  }
  if (code === "PGRST205" || code === "42P01") {
    return "tabela não encontrada no banco. Rode os arquivos de database/ na ordem do README.";
  }
  if (code === "PGRST301" || /jwt expired/i.test(message)) {
    return "sua sessão expirou. Entre de novo.";
  }
  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return "sem conexão com o servidor. Verifique a internet.";
  }
  return message || "erro desconhecido";
}
