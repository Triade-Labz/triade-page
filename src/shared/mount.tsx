import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

/** Monta a página React em #root. */
export function mount(app: ReactNode): void {
  const root = document.getElementById("root");
  if (!root) throw new Error("Elemento #root não encontrado no HTML");
  createRoot(root).render(<StrictMode>{app}</StrictMode>);
}
