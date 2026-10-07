import { StrictMode, type ReactNode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";

/**
 * Monta a página em #root. Se o HTML já veio pré-renderizado do build
 * (landing e política), só "hidrata"; senão (dev, CRM) renderiza do zero.
 */
export function mount(app: ReactNode): void {
  const root = document.getElementById("root");
  if (!root) throw new Error("Elemento #root não encontrado no HTML");
  const tree = <StrictMode>{app}</StrictMode>;
  if (root.hasChildNodes()) hydrateRoot(root, tree);
  else createRoot(root).render(tree);
}
