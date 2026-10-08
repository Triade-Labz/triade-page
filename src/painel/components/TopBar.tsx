import type { ReactNode } from "react";
import type { Membro } from "../api/auth";
import { APPS, APP_IDS, useApp } from "../appContext";
import { initials } from "../lib/format";
import { Brand } from "./Brand";
import { IconKey, IconOut } from "./icons";

interface Props {
  me: Membro;
  /** Tempo real fora do ar: o painel está consultando o banco periodicamente. */
  realtimeOff: boolean;
  onChangePassword: () => void;
  onLogout: () => void;
  /** Botões extras do painel (ex.: ativar avisos). */
  children?: ReactNode;
}

export function TopBar({ me, realtimeOff, onChangePassword, onLogout, children }: Props) {
  const app = useApp();
  return (
    <header className="top">
      <Brand />
      <nav className="apps" aria-label="Painéis da equipe">
        {APP_IDS.map((id) => (
          <a key={id} href={APPS[id].href} aria-current={id === app ? "page" : undefined}>
            {APPS[id].nome}
          </a>
        ))}
      </nav>
      <div className="spacer" />
      {realtimeOff && (
        <span className="rt-off" title="O tempo real não conectou. O painel consulta o banco a cada 30 segundos.">
          atualizando a cada 30 s
        </span>
      )}
      {children}
      <div className="who">
        <span className="av">{initials(me.nome)}</span>
        <span className="name">{me.nome}</span>
      </div>
      <button className="icon-btn" type="button" title="Trocar senha" aria-label="Trocar minha senha" onClick={onChangePassword}>
        <IconKey />
      </button>
      <button className="icon-btn" type="button" title="Sair" aria-label="Sair" onClick={onLogout}>
        <IconOut />
      </button>
    </header>
  );
}
