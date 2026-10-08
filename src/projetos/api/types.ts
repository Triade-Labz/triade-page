import type { AuthApi, RealtimeState } from "../../painel/api/auth";
import type { Projeto, ProjetoInsert, ProjetoNota, ProjetoUpdate, Tarefa, TarefaInsert, TarefaUpdate } from "../../shared/projetos";

export type ProjetosChange =
  | { tabela: "projetos"; type: "INSERT" | "UPDATE"; row: Projeto }
  | { tabela: "projetos"; type: "DELETE"; id: string }
  | { tabela: "tarefas"; type: "INSERT" | "UPDATE"; row: Tarefa }
  | { tabela: "tarefas"; type: "DELETE"; id: string };

/** Tudo o que o controle de projetos precisa do banco (versão real e de demonstração). */
export interface ProjetosApi extends AuthApi {
  projetos(): Promise<Projeto[]>;
  /** Tarefas de todos os projetos (para o progresso nos cards) ou de um só. */
  tarefas(projetoId?: string): Promise<Tarefa[]>;

  createProjeto(row: ProjetoInsert): Promise<Projeto>;
  updateProjeto(id: string, patch: ProjetoUpdate): Promise<Projeto>;
  removeProjeto(id: string): Promise<void>;

  addTarefa(row: TarefaInsert): Promise<Tarefa>;
  updateTarefa(id: string, patch: TarefaUpdate): Promise<Tarefa>;
  removeTarefa(id: string): Promise<void>;
  /** Acrescenta as tarefas padrão do plano que faltam; devolve quantas entraram. */
  aplicarModelo(projetoId: string): Promise<number>;

  notas(projetoId: string): Promise<ProjetoNota[]>;
  addNota(projetoId: string, texto: string): Promise<ProjetoNota>;
  delNota(id: string): Promise<void>;

  subscribe(onChange: (c: ProjetosChange) => void, onState: (s: RealtimeState) => void): () => void;
}

export interface DadosIniciais {
  projetos: Projeto[];
  tarefas: Tarefa[];
}
