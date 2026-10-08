import { useState } from "react";

interface Props {
  id: string;
  /** Valor salvo no banco. */
  value: string;
  /** Devolva false para recusar (o campo volta ao valor salvo). */
  onCommit: (v: string) => boolean | void;
  multiline?: boolean;
  type?: "text" | "tel";
  inputMode?: "text" | "numeric";
  maxLength?: number;
  placeholder?: string;
  /** Formatação enquanto digita (ex.: telefone). */
  format?: (v: string) => string;
}

/**
 * Campo que salva ao sair dele (ou Enter, se for de uma linha).
 * Atualização vinda do banco (ou de outro sócio) não apaga o que está sendo digitado.
 */
export function CommitField({ id, value, onCommit, multiline, type = "text", inputMode, maxLength, placeholder, format }: Props) {
  const show = (v: string) => (format ? format(v) : v);
  const [draft, setDraft] = useState(() => show(value));
  const [synced, setSynced] = useState(value);
  const [focused, setFocused] = useState(false);
  if (!focused && value !== synced) {
    setSynced(value);
    setDraft(show(value));
  }

  const commit = () => {
    setFocused(false);
    const v = draft.trim();
    if (v === value.trim()) return;
    if (onCommit(v) === false) setDraft(show(value));
  };

  const common = {
    className: "input",
    id,
    value: draft,
    maxLength,
    placeholder,
    onFocus: () => setFocused(true),
    onBlur: commit,
  };

  return multiline ? (
    <textarea {...common} onChange={(e) => setDraft(e.target.value)} />
  ) : (
    <input
      {...common}
      type={type}
      inputMode={inputMode}
      onChange={(e) => setDraft(format ? format(e.target.value) : e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
    />
  );
}

const DATA_VALIDA = /^(\d{4})-\d{2}-\d{2}$/;

/** Data que salva assim que fica completa (o campo de data fica vazio enquanto se digita o ano). */
export function DateField({ id, value, onCommit, required }: { id: string; value: string | null; onCommit: (v: string | null) => void; required?: boolean }) {
  const [draft, setDraft] = useState(value ?? "");
  const [synced, setSynced] = useState(value);
  const [focused, setFocused] = useState(false);
  if (!focused && value !== synced) {
    setSynced(value);
    setDraft(value ?? "");
  }
  const isComplete = (v: string) => Number(DATA_VALIDA.exec(v)?.[1] ?? 0) >= 2000;
  return (
    <input
      className="input"
      id={id}
      type="date"
      value={draft}
      required={required}
      onFocus={() => setFocused(true)}
      onChange={(e) => {
        const v = e.target.value;
        setDraft(v);
        if (isComplete(v) && v !== value) onCommit(v);
      }}
      onBlur={() => {
        setFocused(false);
        if (draft) return;
        if (required) setDraft(value ?? "");
        else if (value) onCommit(null);
      }}
    />
  );
}
